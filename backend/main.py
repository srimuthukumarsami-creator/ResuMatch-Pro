"""ResuMatch Pro — FastAPI Application with all API routes."""

import time
import json
import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import init_db, get_db, User, ScreeningResult
from auth import hash_password, verify_password, create_access_token, get_current_user, require_auth
from nlp_pipeline import classifier, CATEGORIES, CATEGORY_DESCRIPTIONS, cleanResume
from advanced_nlp import (extract_skills, match_skills, calculate_keyword_overlap,
                          calculate_match_score, generate_recommendations, analyze_job_description)
from utils import (extract_text, extract_email, extract_phone, extract_linkedin,
                   extract_github, extract_name_heuristic, score_resume_quality,
                   check_ats_compatibility, detect_bias)
from schemas import *

# ── App Setup ──
app = FastAPI(title="ResuMatch Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    if not classifier.is_loaded:
        if not classifier.load():
            print("Training new model...")
            result = classifier.train()
            print(f"Model trained: {result['accuracy']:.2%} accuracy")
        else:
            print("Models loaded successfully")


def _validate_response(result: dict) -> dict:
    """BUG 9 FIX — Ensure all required fields exist with valid defaults."""
    defaults = {
        "candidate_name": "",
        "category": "Unknown",
        "confidence": 0.0,
        "match_score": 0.0,
        "ats_score": 0.0,
        "quality_score": {"total": 0},
        "skills_match": {"found": [], "missing": [], "bonus": [], "match_percentage": 0},
        "entities": {"name": "", "email": "", "phone": "", "linkedin": "", "github": "", "skills": []},
        "top_features": [],
        "top_categories": [],
        "recommendations": ["Upload a detailed resume for personalized recommendations"],
        "bias_flags": [],
        "content_score": {"score": 0, "word_count": 0, "quantified_count": 0, "action_verb_count": 0, "details": {}},
        "skills_score": {"score": 0, "hard_skills": [], "soft_skills": [], "missing_hard": [], "missing_soft": [], "match_percentage": 0, "hard_found": 0, "hard_total": 0, "soft_found": 0, "soft_total": 0},
        "format_score": {"score": 0, "date_formatting": {"pass": False}, "resume_length": {"pass": False}, "bullet_points": {"pass": False}},
        "sections_score": {"score": 0, "overall_pass": False, "sections": {}, "present_count": 0, "total_count": 0},
        "style_score": {"score": 0, "voice": {"tone": "professional"}, "buzzwords": {"pass": True, "found": []}},
        "composite": {"composite_score": 0, "breakdown": {"content": 0, "skills": 0, "format": 0, "sections": 0, "style": 0}, "radar_data": [], "weights": {}},
        "jd_parsed": None,
        "resume_text": "",
        "cleaned_text": "",
        "processing_time_ms": 0,
    }
    for key, default in defaults.items():
        if key not in result or result[key] is None:
            result[key] = default
        # Ensure nested dicts have their sub-keys
        if isinstance(default, dict) and isinstance(result.get(key), dict):
            for sub_key, sub_default in default.items():
                if sub_key not in result[key] or result[key][sub_key] is None:
                    result[key][sub_key] = sub_default

    # Clamp all scores to 0-100
    for score_key in ["match_score", "confidence", "ats_score"]:
        if isinstance(result.get(score_key), (int, float)):
            result[score_key] = max(0, min(100, round(result[score_key], 1)))

    # Ensure candidate_name is set from entities
    if not result["candidate_name"] and result.get("entities", {}).get("name"):
        result["candidate_name"] = result["entities"]["name"]

    return result


def _extract_jd_skills(jd_text: str) -> dict:
    """Extract skills directly from JD text using skills_db."""
    from skills_db import TECHNICAL_SKILLS, SOFT_SKILLS
    jd_lower = jd_text.lower()
    hard = []
    for cat_skills in TECHNICAL_SKILLS.values():
        for s in cat_skills:
            if s.lower() in jd_lower and s not in hard:
                hard.append(s)
    soft = [s for s in SOFT_SKILLS if s.lower() in jd_lower]
    return {"hard": hard, "soft": soft}


def _process_resume(resume_text: str, jd_text: str = None,
                    required_skills: list = None, preferred_skills: list = None,
                    min_experience: int = 0) -> dict:
    """Core screening logic with 5-axis scoring."""
    start = time.time()

    from scoring import (compute_content_score, compute_skills_score, compute_format_score,
                         compute_sections_score, compute_style_score, compute_composite_score)

    # Step 1: Classify resume
    cleaned = classifier.predict(resume_text)
    resume_category = cleaned["category"]
    resume_confidence = cleaned["confidence"]

    # Step 2: Extract entities
    entities = {
        "name": extract_name_heuristic(resume_text) or "",
        "email": extract_email(resume_text) or "",
        "phone": extract_phone(resume_text) or "",
        "linkedin": extract_linkedin(resume_text) or "",
        "github": extract_github(resume_text) or "",
        "skills": extract_skills(resume_text),
    }

    # Step 3: Parse JD and extract skills from it (BUG 3 FIX)
    jd_parsed = None
    req_hard = required_skills or []
    req_soft = []
    nice_to_have = []

    if jd_text and len(jd_text) >= 30:
        # Extract skills directly from JD text
        jd_skills = _extract_jd_skills(jd_text)
        if not req_hard:
            req_hard = jd_skills["hard"]
        req_soft = jd_skills["soft"]

        # Also classify the JD to get its category (BUG 4 FIX)
        jd_prediction = classifier.predict(jd_text)
        jd_category = jd_prediction["category"]

        # Try Claude AI for deeper parsing (graceful fallback)
        try:
            from claude_api import parse_jd_with_claude
            jd_parsed = parse_jd_with_claude(jd_text)
            if jd_parsed.get("required_hard_skills"):
                req_hard = jd_parsed["required_hard_skills"]
            if jd_parsed.get("required_soft_skills"):
                req_soft = jd_parsed["required_soft_skills"]
            if jd_parsed.get("nice_to_have_skills"):
                nice_to_have = jd_parsed["nice_to_have_skills"]
        except Exception:
            jd_parsed = {
                "job_title": jd_category,
                "experience_level": "Mid",
                "required_hard_skills": req_hard,
                "required_soft_skills": req_soft,
                "nice_to_have_skills": [],
                "ai_powered": False,
            }
    else:
        jd_category = resume_category

    # Step 4: Compute 5-axis scores (BUG 7 FIX — real calculations)
    content_result = compute_content_score(resume_text)
    skills_result = compute_skills_score(resume_text, req_hard, req_soft, nice_to_have)
    format_result = compute_format_score(resume_text)
    sections_result = compute_sections_score(resume_text, entities)
    style_result = compute_style_score(resume_text)
    composite = compute_composite_score(content_result, skills_result, format_result, sections_result, style_result)

    # Step 5: Quality & ATS scores
    quality = score_resume_quality(resume_text)
    ats = check_ats_compatibility(resume_text)
    bias_flags = detect_bias(resume_text)

    # Step 6: Build result
    result = {
        "candidate_name": entities["name"],
        "category": resume_category,
        "jd_category": jd_category,
        "confidence": resume_confidence,
        "match_score": composite["composite_score"],
        "composite": composite,
        "content_score": content_result,
        "skills_score": skills_result,
        "format_score": format_result,
        "sections_score": sections_result,
        "style_score": style_result,
        "ats_score": ats["score"],
        "quality_score": quality,
        "entities": entities,
        "jd_parsed": jd_parsed,
        "skills_match": {
            "found": [s["skill"] for s in skills_result.get("hard_skills", []) if s.get("found")],
            "missing": skills_result.get("missing_hard", []),
            "bonus": [s["skill"] for s in skills_result.get("nice_to_have", []) if s.get("found")],
            "match_percentage": skills_result.get("match_percentage", 0),
        },
        "top_categories": cleaned.get("top_categories", []),
        "top_features": cleaned.get("top_features", []),
        "bias_flags": [{"phrase": b["phrase"], "category": b["category"],
                        "explanation": b["explanation"]} for b in bias_flags],
        "resume_text": resume_text,
        "cleaned_text": cleaned.get("cleaned_text", resume_text[:500]),
        "processing_time_ms": round((time.time() - start) * 1000, 1),
    }

    # Step 7: Generate recommendations
    result["recommendations"] = generate_recommendations(result, quality, ats)

    return _validate_response(result)


@app.post("/api/screen")
async def screen_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    required_skills: Optional[str] = Form(None),
    preferred_skills: Optional[str] = Form(None),
    min_experience: Optional[int] = Form(0),
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Screen a single resume (file upload or text)."""
    # Get resume text
    text = None
    filename = None
    if file:
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 5MB)")
        text = extract_text(contents, file.filename)
        filename = file.filename
    elif resume_text:
        text = resume_text
    else:
        raise HTTPException(400, "Provide a file or resume_text")
    
    if len(text.strip()) < 50:
        raise HTTPException(400, "Resume text too short (min 50 characters)")
    
    # Parse skills lists
    req_skills = json.loads(required_skills) if required_skills else []
    pref_skills = json.loads(preferred_skills) if preferred_skills else []
    
    result = _process_resume(text, job_description, req_skills, pref_skills, min_experience or 0)
    
    # Save to history if authenticated
    if user:
        try:
            record = ScreeningResult(
                user_id=user.id,
                candidate_name=result.get("candidate_name", ""),
                filename=filename,
                category=result["category"],
                confidence=result["confidence"],
                match_score=result["match_score"],
                ats_score=result["ats_score"],
                quality_score=result["quality_score"]["total"],
                resume_text=text[:5000],
                job_description=job_description[:2000] if job_description else None,
                result_json=result,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
        except Exception as e:
            print(f"[DB] Failed to save history: {e}")
    
    return result


@app.post("/api/screen/text")
async def screen_text(
    body: ScreenTextRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Screen resume from raw text (JSON body)."""
    result = _process_resume(
        body.resume_text, body.job_description,
        body.required_skills, body.preferred_skills, body.min_experience
    )
    
    if user:
        try:
            record = ScreeningResult(
                user_id=user.id,
                candidate_name=result.get("candidate_name", ""),
                category=result["category"],
                confidence=result["confidence"],
                match_score=result["match_score"],
                ats_score=result["ats_score"],
                quality_score=result["quality_score"]["total"],
                resume_text=body.resume_text[:5000],
                job_description=body.job_description[:2000] if body.job_description else None,
                result_json=result,
            )
            db.add(record)
            db.commit()
        except Exception as e:
            print(f"[DB] Failed to save history: {e}")
    
    return result


@app.post("/api/bulk-screen")
async def bulk_screen(
    files: List[UploadFile] = File(...),
    job_description: str = Form(...),
    required_skills: Optional[str] = Form(None),
    preferred_skills: Optional[str] = Form(None),
    min_experience: Optional[int] = Form(0),
):
    """Screen multiple resumes against one job description."""
    if len(files) > 50:
        raise HTTPException(400, "Maximum 50 files allowed")
    
    req_skills = json.loads(required_skills) if required_skills else []
    pref_skills = json.loads(preferred_skills) if preferred_skills else []
    
    candidates = []
    for i, file in enumerate(files):
        try:
            contents = await file.read()
            text = extract_text(contents, file.filename)
            result = _process_resume(text, job_description, req_skills, pref_skills, min_experience or 0)
            candidates.append({
                "rank": 0,
                "filename": file.filename,
                "candidate_name": result["entities"].get("name"),
                "result": result,
            })
        except Exception as e:
            candidates.append({
                "rank": 0,
                "filename": file.filename,
                "candidate_name": None,
                "result": {"error": str(e), "match_score": 0},
            })
    
    # Sort by match score descending
    candidates.sort(key=lambda c: c["result"].get("match_score", 0), reverse=True)
    for i, c in enumerate(candidates):
        c["rank"] = i + 1
    
    scores = [c["result"].get("match_score", 0) for c in candidates if "error" not in c["result"]]
    
    return {
        "candidates": candidates,
        "summary": {
            "total": len(candidates),
            "top_candidate": candidates[0]["candidate_name"] or candidates[0]["filename"] if candidates else None,
            "average_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "max_score": max(scores) if scores else 0,
            "min_score": min(scores) if scores else 0,
        },
        "job_description": job_description[:500],
    }


# ══════════════════════════════════════════════════════
# JOB DESCRIPTION ANALYSIS
# ══════════════════════════════════════════════════════

@app.post("/api/job-description/analyze")
async def analyze_jd(body: JDAnalyzeRequest):
    """Analyze a job description."""
    jd_result = analyze_job_description(body.job_description)
    
    # Predict category for the JD
    jd_pred = classifier.predict(body.job_description)
    
    # Keyword density
    from nlp_pipeline import cleanResume
    cleaned = cleanResume(body.job_description)
    words = cleaned.lower().split()
    word_freq = {}
    for w in words:
        if len(w) > 3:
            word_freq[w] = word_freq.get(w, 0) + 1
    
    top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
    
    return {
        "required_skills": jd_result["required_skills"],
        "nice_to_have_skills": jd_result["nice_to_have_skills"],
        "experience_level": jd_result["experience_level"],
        "category_prediction": jd_pred["category"],
        "keyword_density": [{"keyword": k, "score": v} for k, v in top_keywords],
        "ats_friendliness": min(100, len(jd_result["all_skills"]) * 5 + 40),
        "suggestions": [
            "Include specific technical skills required",
            "Specify years of experience needed",
            "Add both required and nice-to-have sections",
            "Use clear, searchable job title",
        ],
        "ideal_candidate": {
            "category": jd_pred["category"],
            "key_skills": jd_result["required_skills"][:8],
            "experience": jd_result["experience_level"],
        },
    }


# ══════════════════════════════════════════════════════
# CATEGORIES
# ══════════════════════════════════════════════════════

@app.get("/api/categories")
async def get_categories():
    """Return all 25 job categories with descriptions and skills."""
    return [
        {"name": cat, "description": CATEGORY_DESCRIPTIONS.get(cat, {}).get("desc", ""),
         "typical_skills": CATEGORY_DESCRIPTIONS.get(cat, {}).get("skills", [])}
        for cat in CATEGORIES
    ]


# ══════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register(body: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")
    
    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        company=body.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user.id})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name, "company": user.company}
    }


@app.post("/api/auth/login")
async def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    
    token = create_access_token({"sub": user.id})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name, "company": user.company}
    }


@app.get("/api/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return {"id": user.id, "email": user.email, "name": user.name, "company": user.company}


# ══════════════════════════════════════════════════════
# HISTORY & ANALYTICS
# ══════════════════════════════════════════════════════

@app.get("/api/history")
async def get_history(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    records = db.query(ScreeningResult).filter(
        ScreeningResult.user_id == user.id
    ).order_by(ScreeningResult.created_at.desc()).limit(100).all()
    
    return [{
        "id": r.id, "candidate_name": r.candidate_name, "filename": r.filename,
        "category": r.category, "confidence": r.confidence,
        "match_score": r.match_score, "ats_score": r.ats_score,
        "quality_score": r.quality_score, "created_at": r.created_at.isoformat(),
        "job_title": r.job_title,
    } for r in records]


@app.get("/api/history/{record_id}")
async def get_history_detail(record_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    record = db.query(ScreeningResult).filter(
        ScreeningResult.id == record_id, ScreeningResult.user_id == user.id
    ).first()
    if not record:
        raise HTTPException(404, "Record not found")
    return record.result_json


@app.delete("/api/history/{record_id}")
async def delete_history(record_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    record = db.query(ScreeningResult).filter(
        ScreeningResult.id == record_id, ScreeningResult.user_id == user.id
    ).first()
    if not record:
        raise HTTPException(404, "Record not found")
    db.delete(record)
    db.commit()
    return {"ok": True}


@app.post("/api/compare")
async def compare_resumes(body: CompareRequest, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    records = db.query(ScreeningResult).filter(
        ScreeningResult.id.in_(body.screening_ids),
        ScreeningResult.user_id == user.id
    ).all()
    
    if len(records) < 2:
        raise HTTPException(400, "Need at least 2 valid screening records")
    
    return [{
        "id": r.id, "candidate_name": r.candidate_name,
        "category": r.category, "confidence": r.confidence,
        "match_score": r.match_score, "ats_score": r.ats_score,
        "quality_score": r.quality_score,
        "result": r.result_json,
    } for r in records]


@app.get("/api/analytics/dashboard")
async def get_dashboard(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    total = db.query(ScreeningResult).filter(ScreeningResult.user_id == user.id).count()
    
    week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    this_week = db.query(ScreeningResult).filter(
        ScreeningResult.user_id == user.id,
        ScreeningResult.created_at >= week_ago
    ).count()
    
    avg_score = db.query(func.avg(ScreeningResult.match_score)).filter(
        ScreeningResult.user_id == user.id
    ).scalar() or 0
    
    # Category distribution
    cat_counts = db.query(ScreeningResult.category, func.count()).filter(
        ScreeningResult.user_id == user.id
    ).group_by(ScreeningResult.category).all()
    
    # Recent screenings
    recent = db.query(ScreeningResult).filter(
        ScreeningResult.user_id == user.id
    ).order_by(ScreeningResult.created_at.desc()).limit(10).all()
    
    top_cat = max(cat_counts, key=lambda x: x[1])[0] if cat_counts else "N/A"
    
    return {
        "total_screened": total,
        "this_week": this_week,
        "average_score": round(float(avg_score), 1),
        "top_category": top_cat,
        "category_distribution": {cat: count for cat, count in cat_counts},
        "score_distribution": {},
        "recent_screenings": [{
            "id": r.id, "candidate_name": r.candidate_name, "category": r.category,
            "match_score": r.match_score, "created_at": r.created_at.isoformat(),
        } for r in recent],
        "trend_data": [],
    }


# ══════════════════════════════════════════════════════
# CLAUDE AI ENDPOINTS
# ══════════════════════════════════════════════════════

@app.post("/api/analyze-jd-claude")
async def analyze_jd_claude(request: Request):
    """Parse a job description using Claude AI into structured components."""
    body = await request.json()
    jd = body.get("job_description", "")
    if len(jd) < 30:
        raise HTTPException(400, "Job description too short (min 30 chars)")
    try:
        from claude_api import parse_jd_with_claude
        result = parse_jd_with_claude(jd)
        return result
    except Exception as e:
        raise HTTPException(500, f"JD analysis failed: {str(e)}")


@app.post("/api/generate-highlights")
async def gen_highlights(request: Request):
    """Generate AI-powered highlights and improvements for a resume."""
    body = await request.json()
    resume_text = body.get("resume_text", "")
    jd_text = body.get("job_description", "")
    scores = body.get("scores", {})
    if len(resume_text) < 50:
        raise HTTPException(400, "Resume text too short")
    try:
        from claude_api import generate_highlights
        return generate_highlights(resume_text, jd_text, scores)
    except Exception as e:
        return {"highlights": ["Resume submitted successfully"], "improvements": ["Add more detail"], "ai_powered": False}


@app.post("/api/generate-cover-letter")
async def gen_cover_letter(request: Request):
    """Generate a cover letter using Claude AI."""
    body = await request.json()
    resume_text = body.get("resume_text", "")
    jd_text = body.get("job_description", "")
    tone = body.get("tone", "formal")
    length = body.get("length", "short")
    language = body.get("language", "english")
    candidate_name = body.get("candidate_name", "")
    job_title = body.get("job_title", "")
    if len(resume_text) < 50:
        raise HTTPException(400, "Resume text too short")
    try:
        from claude_api import generate_cover_letter
        return generate_cover_letter(resume_text, jd_text, tone, length, language, candidate_name, job_title)
    except Exception as e:
        return {"cover_letter": "Cover letter generation failed. Please try again.", "ai_powered": False}


@app.post("/api/shorten-jd")
async def shorten_jd_endpoint(request: Request):
    """Shorten a job description to key requirements."""
    body = await request.json()
    jd = body.get("job_description", "")
    if len(jd) < 30:
        raise HTTPException(400, "Job description too short (min 30 chars)")
    try:
        from claude_api import shorten_jd
        return shorten_jd(jd)
    except Exception as e:
        return {"shortened": jd[:500], "word_count": len(jd[:500].split()), "ai_powered": False}


@app.post("/api/generate-suggestions")
async def gen_suggestions(request: Request):
    """Generate resume improvement suggestions using Claude AI."""
    body = await request.json()
    resume_text = body.get("resume_text", "")
    jd_text = body.get("job_description", "")
    issues = body.get("issues", {})
    if len(resume_text) < 50:
        raise HTTPException(400, "Resume text too short")
    try:
        from claude_api import generate_suggestions
        return generate_suggestions(resume_text, jd_text, issues)
    except Exception as e:
        return []


@app.post("/api/screen-enhanced")
async def screen_enhanced(request: Request):
    """Enhanced screening with 5-axis scoring — accepts JSON with resume_text and job_description."""
    body = await request.json()
    resume_text = body.get("resume_text", "")
    jd_text = body.get("job_description", "")
    jd_parsed = body.get("jd_parsed", None)

    if len(resume_text) < 50:
        raise HTTPException(400, "Resume text too short (min 50 chars)")

    start = time.time()

    # Classify
    cleaned = cleanResume(resume_text)
    prediction = classifier.predict(cleaned)

    # Extract entities
    entities = {
        "name": extract_name_heuristic(resume_text),
        "email": extract_email(resume_text),
        "phone": extract_phone(resume_text),
        "linkedin": extract_linkedin(resume_text),
        "github": extract_github(resume_text),
        "skills": extract_skills(resume_text),
    }

    # Parse JD if not already parsed
    if not jd_parsed and jd_text:
        try:
            from claude_api import parse_jd_with_claude
            jd_parsed = parse_jd_with_claude(jd_text)
        except Exception:
            jd_parsed = {"required_hard_skills": [], "required_soft_skills": [], "nice_to_have_skills": [], "job_title": "", "experience_level": "Mid"}

    req_hard = jd_parsed.get("required_hard_skills", []) if jd_parsed else []
    req_soft = jd_parsed.get("required_soft_skills", []) if jd_parsed else []
    nice = jd_parsed.get("nice_to_have_skills", []) if jd_parsed else []

    # 5-axis scoring
    from scoring import (compute_content_score, compute_skills_score, compute_format_score,
                         compute_sections_score, compute_style_score, compute_composite_score)

    content_result = compute_content_score(resume_text)
    skills_result = compute_skills_score(resume_text, req_hard, req_soft, nice)
    format_result = compute_format_score(resume_text)
    sections_result = compute_sections_score(resume_text, entities)
    style_result = compute_style_score(resume_text)
    composite = compute_composite_score(content_result, skills_result, format_result, sections_result, style_result)

    # ATS & Quality
    ats = check_ats_compatibility(resume_text)
    quality = score_resume_quality(resume_text)
    bias = detect_bias(resume_text)

    # Top features
    top_features = prediction.get("top_features", [])

    elapsed = round((time.time() - start) * 1000, 1)

    return {
        "category": prediction["category"],
        "confidence": prediction["confidence"],
        "match_score": composite["composite_score"],
        "composite": composite,
        "content_score": content_result,
        "skills_score": skills_result,
        "format_score": format_result,
        "sections_score": sections_result,
        "style_score": style_result,
        "ats_score": ats.get("score", 0) if isinstance(ats, dict) else ats,
        "quality_score": quality,
        "entities": entities,
        "jd_parsed": jd_parsed,
        "top_features": top_features,
        "top_categories": prediction.get("top_categories", []),
        "bias_flags": bias,
        "recommendations": generate_recommendations(
            {"category": prediction["category"], "confidence": prediction["confidence"]},
            quality if isinstance(quality, dict) else {"total": quality},
            ats if isinstance(ats, dict) else {"score": ats}
        ),
        "cleaned_text": cleaned[:500],
        "processing_time_ms": elapsed,
    }


# ══════════════════════════════════════════════════════
# CAREER DNA — Skill Genome & Career Path Predictor
# ══════════════════════════════════════════════════════

@app.post("/api/career-dna")
async def career_dna_analysis(request: Request):
    """Analyze resume and generate Career DNA: skill genome, career predictions,
    skill synergies, and market readiness report."""
    body = await request.json()
    resume_text = body.get("resume_text", "")
    if len(resume_text) < 50:
        raise HTTPException(400, "Resume text too short (min 50 chars)")
    try:
        from career_dna import analyze_career_dna
        result = analyze_career_dna(resume_text)
        return result
    except Exception as e:
        raise HTTPException(500, f"Career DNA analysis failed: {str(e)}")


# ══════════════════════════════════════════════════════
# HEALTH & STATIC FILES
# ══════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "ok", "model_loaded": classifier.is_loaded}


@app.get("/api/dataset-info")
async def dataset_info():
    """Return information about the training dataset sources."""
    try:
        from dataset_pipeline import build_combined_dataset, get_dataset_stats
        df = build_combined_dataset(use_cache=True, use_huggingface=False)
        return get_dataset_stats(df)
    except Exception:
        return {
            "total_samples": 500,
            "categories": 25,
            "sources": {"synthetic_legacy": 500},
            "avg_resume_length": 300,
        }


# Serve frontend static files (for production)
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
