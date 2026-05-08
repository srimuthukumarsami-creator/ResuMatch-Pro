"""
Claude AI Integration Module
=============================
Handles all Claude API calls for ResuMatch Pro:
  - JD Parsing → structured JSON extraction
  - Highlights & Improvements generation
  - Cover letter generation
  - Resume editor suggestions
  - Style/tone analysis

Uses Anthropic /v1/messages API with claude-sonnet-4-20250514.
Gracefully degrades if API key is missing or call fails.
"""

import os
import json
import httpx
from typing import Optional, Dict, List

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-20250514"
CLAUDE_URL = "https://api.anthropic.com/v1/messages"
MAX_TOKENS = 1500


def _call_claude(system: str, user_prompt: str, max_tokens: int = MAX_TOKENS) -> Optional[str]:
    """Make a call to Claude API. Returns text response or None on failure."""
    if not ANTHROPIC_API_KEY:
        print("[Claude] No ANTHROPIC_API_KEY set — skipping AI call")
        return None
    try:
        resp = httpx.post(
            CLAUDE_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": CLAUDE_MODEL,
                "max_tokens": max_tokens,
                "system": system,
                "messages": [{"role": "user", "content": user_prompt}],
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]
    except Exception as e:
        print(f"[Claude] API call failed: {e}")
        return None


def _parse_json_response(text: Optional[str]) -> Optional[dict]:
    """Extract JSON from Claude response (handles markdown code blocks)."""
    if not text:
        return None
    try:
        # Try direct parse
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try extracting from ```json ... ```
    import re
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    # Try finding first { ... }
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return None


# ══════════════════════════════════════════════════════
# 1. JD PARSING
# ══════════════════════════════════════════════════════

def parse_jd_with_claude(job_description: str) -> dict:
    """Parse a job description into structured components using Claude AI."""
    system = "You are an expert recruiter and job description analyst. Extract structured information from job descriptions. Return ONLY valid JSON."
    prompt = f"""Analyze this job description and extract structured data. Return ONLY a JSON object with these exact keys:

{{
  "job_title": "string",
  "experience_level": "Junior|Mid|Senior|Lead",
  "required_hard_skills": ["skill1", "skill2"],
  "required_soft_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "key_responsibilities": ["resp1", "resp2"],
  "red_flags_to_check": ["flag1", "flag2"]
}}

Job Description:
{job_description[:3000]}"""

    result = _parse_json_response(_call_claude(system, prompt))

    if result:
        return {
            "job_title": result.get("job_title", "Unknown Role"),
            "experience_level": result.get("experience_level", "Mid"),
            "required_hard_skills": result.get("required_hard_skills", []),
            "required_soft_skills": result.get("required_soft_skills", []),
            "nice_to_have_skills": result.get("nice_to_have_skills", []),
            "key_responsibilities": result.get("key_responsibilities", []),
            "red_flags_to_check": result.get("red_flags_to_check", []),
            "ai_powered": True,
        }

    # Fallback: basic keyword extraction
    return _fallback_jd_parse(job_description)


def _fallback_jd_parse(jd: str) -> dict:
    """Fallback JD parsing without Claude AI."""
    import re
    jd_lower = jd.lower()

    # Detect experience level
    level = "Mid"
    if any(w in jd_lower for w in ["senior", "lead", "principal", "staff", "architect"]):
        level = "Senior"
    elif any(w in jd_lower for w in ["junior", "entry", "intern", "graduate", "fresher"]):
        level = "Junior"

    # Extract skills using skills_db
    try:
        from skills_db import TECHNICAL_SKILLS, SOFT_SKILLS
        hard = []
        for cat_skills in TECHNICAL_SKILLS.values():
            for s in cat_skills:
                if s.lower() in jd_lower:
                    hard.append(s)
        soft = [s for s in SOFT_SKILLS if s.lower() in jd_lower]
    except Exception:
        hard, soft = [], []

    return {
        "job_title": "Unknown Role",
        "experience_level": level,
        "required_hard_skills": list(set(hard))[:15],
        "required_soft_skills": list(set(soft))[:10],
        "nice_to_have_skills": [],
        "key_responsibilities": [],
        "red_flags_to_check": [],
        "ai_powered": False,
    }


# ══════════════════════════════════════════════════════
# 2. HIGHLIGHTS & IMPROVEMENTS
# ══════════════════════════════════════════════════════

def generate_highlights(resume_text: str, jd_text: str, scores: dict) -> dict:
    """Generate AI-powered highlights and improvements for the resume."""
    system = "You are an expert resume reviewer. Provide specific, actionable feedback. Return ONLY valid JSON."
    prompt = f"""Review this resume against the job description and provide feedback.

Resume (first 2000 chars):
{resume_text[:2000]}

Job Description (first 1500 chars):
{jd_text[:1500]}

Current scores: {json.dumps(scores)}

Return ONLY this JSON:
{{
  "highlights": ["3 specific things done well - reference actual resume content"],
  "improvements": ["3 specific actionable improvements - be concrete"],
  "voice_analysis": "professional|casual|collaborative",
  "voice_description": "Brief description of the resume's tone"
}}"""

    result = _parse_json_response(_call_claude(system, prompt, max_tokens=800))

    if result:
        return {
            "highlights": result.get("highlights", [])[:3],
            "improvements": result.get("improvements", [])[:3],
            "voice_analysis": result.get("voice_analysis", "professional"),
            "voice_description": result.get("voice_description", "Professional tone detected"),
            "ai_powered": True,
        }

    # Fallback
    return _fallback_highlights(scores)


def _fallback_highlights(scores: dict) -> dict:
    """Generate basic highlights without Claude AI."""
    highlights = []
    improvements = []

    content = scores.get("content_score", 50)
    skills = scores.get("skills_score", 50)
    fmt = scores.get("format_score", 50)
    sections = scores.get("sections_score", 50)

    if content >= 70:
        highlights.append("Resume contains quantified achievements and measurable results")
    else:
        improvements.append("Add more quantified achievements with specific metrics (%, $, numbers)")

    if skills >= 70:
        highlights.append("Strong alignment between your skills and the job requirements")
    else:
        improvements.append("Add more relevant technical skills mentioned in the job description")

    if fmt >= 70:
        highlights.append("Resume formatting follows ATS-friendly best practices")
    else:
        improvements.append("Improve formatting: use consistent date formats and bullet points")

    if sections >= 70:
        highlights.append("All key resume sections are present and well-structured")
    else:
        improvements.append("Add missing sections: ensure Summary, Experience, Education, and Skills are present")

    if len(highlights) < 3:
        highlights.append("Resume is readable and well-organized")
    if len(improvements) < 3:
        improvements.append("Consider adding a portfolio or GitHub link to showcase your work")

    return {
        "highlights": highlights[:3],
        "improvements": improvements[:3],
        "voice_analysis": "professional",
        "voice_description": "Standard professional tone detected",
        "ai_powered": False,
    }


# ══════════════════════════════════════════════════════
# 3. COVER LETTER GENERATION
# ══════════════════════════════════════════════════════

TONE_INSTRUCTIONS = {
    "formal": "Use a formal, traditional business letter tone. Address the hiring manager respectfully.",
    "casual": "Use a friendly, approachable tone while remaining professional. Show personality.",
    "concise": "Be direct and to-the-point. Every sentence must add value. No filler.",
}

LANGUAGE_MAP = {
    "english": "English",
    "spanish": "Spanish",
    "french": "French",
    "german": "German",
    "hindi": "Hindi",
}


def _extract_achievements(resume_text: str) -> list:
    """Extract top bullet-point achievements from resume text."""
    import re
    lines = resume_text.split('\n')
    achievements = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Bullet points with numbers/percentages/$
        if re.match(r'^[-•*→►]', line) or re.match(r'^\d+\.', line):
            if re.search(r'\d+[%$]|\d+\s*(percent|million|thousand|K\b|M\b)', line, re.I):
                clean = re.sub(r'^[-•*→►]\s*', '', line).strip()
                achievements.append(clean)
    return achievements[:5]


def _extract_jd_title(jd_text: str) -> str:
    """Extract job title from JD text."""
    lines = [l.strip() for l in jd_text.split('\n') if l.strip()]
    title_patterns = [
        r'(?:hiring|looking for|seeking)\s+(?:a|an)\s+(.+?)(?:\s+to\b|\s+who\b|\.)',
        r'(?:job title|position|role)\s*[:\-]\s*(.+)',
    ]
    import re
    for pat in title_patterns:
        for line in lines[:10]:
            m = re.search(pat, line, re.I)
            if m:
                return m.group(1).strip()
    # Fallback: first short line that isn't a header
    for line in lines[:5]:
        if 3 <= len(line.split()) <= 8 and not line.startswith(('-', '•', '*')):
            if any(w in line.lower() for w in ['engineer', 'developer', 'manager', 'designer', 'analyst', 'scientist']):
                return line
    return ""


def generate_cover_letter(
    resume_text: str,
    jd_text: str,
    tone: str = "formal",
    length: str = "short",
    language: str = "english",
    candidate_name: str = "",
    job_title: str = "",
) -> dict:
    """Generate a cover letter using Claude AI with REAL data from resume and JD."""
    word_target = 250 if length == "short" else 350
    tone_inst = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["formal"])
    lang = LANGUAGE_MAP.get(language, "English")

    # Extract real data
    achievements = _extract_achievements(resume_text)
    if not job_title:
        job_title = _extract_jd_title(jd_text)
    if not job_title:
        job_title = "the advertised position"

    # Extract skills from JD for the prompt
    try:
        from skills_db import TECHNICAL_SKILLS
        jd_lower = jd_text.lower()
        jd_skills = []
        for cat_skills in TECHNICAL_SKILLS.values():
            for s in cat_skills:
                if s.lower() in jd_lower and s not in jd_skills:
                    jd_skills.append(s)
        jd_skills = jd_skills[:8]
    except Exception:
        jd_skills = []

    achievements_str = '; '.join(achievements[:3]) if achievements else 'experienced professional with proven results'
    skills_str = ', '.join(jd_skills[:6]) if jd_skills else 'relevant technical skills'

    system = f"""You are a professional cover letter writer. Write in {lang}. {tone_inst}
CRITICAL RULES:
- NEVER use generic phrases like 'my background and experience' or 'I am excited about the opportunity'
- ALWAYS use the candidate's REAL name: {candidate_name or 'the candidate'}
- ALWAYS reference REAL achievements from the resume
- ALWAYS mention REAL skills from the job description
- Sign the letter with the candidate's real name"""

    prompt = f"""Write a {tone} cover letter of approximately {word_target} words.

Candidate Name: {candidate_name}
Job Title: {job_title}
Top Achievements from Resume: {achievements_str}
Required Skills from JD: {skills_str}
Company Context: {jd_text[:300]}

Resume excerpt:
{resume_text[:1500]}

Return ONLY this JSON:
{{
  "cover_letter": "the full cover letter text",
  "word_count": number
}}"""

    result = _parse_json_response(_call_claude(system, prompt, max_tokens=1200))

    if result and result.get("cover_letter"):
        return {
            "cover_letter": result["cover_letter"],
            "word_count": result.get("word_count", len(result["cover_letter"].split())),
            "tone": tone,
            "language": language,
            "ai_powered": True,
        }

    # Fallback — uses REAL extracted data, never generic text
    return {
        "cover_letter": _fallback_cover_letter(candidate_name, job_title, achievements, jd_skills),
        "word_count": 220,
        "tone": tone,
        "language": language,
        "ai_powered": False,
    }


def _fallback_cover_letter(name: str, title: str, achievements: list, jd_skills: list) -> str:
    """Template-based cover letter using REAL extracted data — never generic."""
    name = name or "Candidate"
    title = title or "the advertised position"

    # Build achievement paragraph
    if achievements:
        ach_lines = '\n'.join(f"  - {a}" for a in achievements[:3])
        ach_para = f"In my recent roles, I have delivered measurable results:\n{ach_lines}"
    else:
        ach_para = "Throughout my career, I have consistently delivered results and contributed to team success through hands-on technical work."

    # Build skills paragraph
    if jd_skills:
        skills_str = ', '.join(jd_skills[:5])
        skills_para = f"I bring hands-on experience with {skills_str}, which directly aligns with your requirements for this role."
    else:
        skills_para = "My technical toolkit aligns well with the requirements outlined in your job description."

    return f"""Dear Hiring Manager,

I am {name}, and I am writing to apply for the {title} role. My professional experience and technical expertise make me a strong fit for this position.

{ach_para}

{skills_para}

I am eager to bring this track record of impact to your team and contribute from day one. I would welcome the opportunity to discuss how my qualifications align with your needs in more detail.

Thank you for your consideration.

Best regards,
{name}"""


# ══════════════════════════════════════════════════════
# 3b. SHORTEN JD (FIX 7)
# ══════════════════════════════════════════════════════

def shorten_jd(jd_text: str) -> dict:
    """Shorten a job description to key requirements using Claude AI."""
    system = "You are a concise job description summarizer."
    prompt = f"""Summarize this job description to the key requirements only, in under 150 words.
Keep: job title, required skills, experience level, key responsibilities.
Remove: company background, benefits, culture fluff, legal disclaimers.

Job Description:
{jd_text[:3000]}

Return ONLY this JSON:
{{
  "shortened": "the shortened JD text",
  "word_count": number
}}"""

    result = _parse_json_response(_call_claude(system, prompt, max_tokens=500))

    if result and result.get("shortened"):
        return {
            "shortened": result["shortened"],
            "word_count": result.get("word_count", len(result["shortened"].split())),
            "ai_powered": True,
        }

    # Fallback: keep only lines with skills or numbers
    return _fallback_shorten(jd_text)


def _fallback_shorten(jd_text: str) -> dict:
    """Shorten JD by keeping only skill/requirement lines."""
    import re
    lines = jd_text.split('\n')
    kept = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        # Keep lines with skills, numbers, or requirement keywords
        if re.search(r'\d+\s*\+?\s*year|required|must have|experience|skill', lower):
            kept.append(line)
        elif re.match(r'^[-•*]\s*', line):
            kept.append(line)
        elif any(w in lower for w in ['python', 'java', 'docker', 'aws', 'sql', 'react', 'api', 'ci/cd', 'kubernetes']):
            kept.append(line)
        elif len(line.split()) <= 6 and not lower.startswith(('we ', 'our ', 'the ')):
            kept.append(line)
    shortened = '\n'.join(kept[:20]) if kept else jd_text[:500]
    return {
        "shortened": shortened,
        "word_count": len(shortened.split()),
        "ai_powered": False,
    }


# ══════════════════════════════════════════════════════
# 4. RESUME SUGGESTIONS
# ══════════════════════════════════════════════════════

def generate_suggestions(resume_text: str, jd_text: str, report_issues: dict) -> list:
    """Generate specific resume improvement suggestions using Claude AI."""
    system = "You are an expert resume coach. Provide specific, actionable suggestions. Return ONLY valid JSON."
    prompt = f"""Based on this resume analysis, generate specific improvement suggestions.

Resume (first 2000 chars):
{resume_text[:2000]}

JD (first 1000 chars):
{jd_text[:1000]}

Issues found: {json.dumps(report_issues)}

Return ONLY a JSON array of suggestion objects:
[
  {{
    "id": "unique_id",
    "section": "Experience|Skills|Summary|Education|Format",
    "severity": "high|medium|low",
    "title": "Short title",
    "description": "What to fix and how",
    "example": "Optional example of improved text"
  }}
]

Generate 3-6 suggestions, ordered by importance."""

    text = _call_claude(system, prompt, max_tokens=1000)
    if text:
        # Try to parse as JSON array
        try:
            arr = json.loads(text)
            if isinstance(arr, list):
                return arr[:6]
        except json.JSONDecodeError:
            pass
        parsed = _parse_json_response(text)
        if parsed and isinstance(parsed, list):
            return parsed[:6]

    # Fallback suggestions
    return _fallback_suggestions(report_issues)


def _fallback_suggestions(issues: dict) -> list:
    """Generate basic suggestions without Claude AI."""
    suggestions = []
    idx = 0

    missing_skills = issues.get("missing_skills", [])
    if missing_skills:
        idx += 1
        suggestions.append({
            "id": f"sug_{idx}",
            "section": "Skills",
            "severity": "high",
            "title": f"Add {len(missing_skills)} missing required skills",
            "description": f"The job description requires these skills that are missing from your resume: {', '.join(missing_skills[:5])}. Add them to your Skills section if you have experience with them.",
            "example": None,
        })

    if issues.get("low_quantified", False):
        idx += 1
        suggestions.append({
            "id": f"sug_{idx}",
            "section": "Experience",
            "severity": "high",
            "title": "Add quantified achievements",
            "description": "Your experience section lacks measurable results. Add numbers, percentages, and dollar amounts to demonstrate impact.",
            "example": "Led team of 8 engineers, reducing deployment time by 40% and saving $200K annually",
        })

    if issues.get("missing_summary", False):
        idx += 1
        suggestions.append({
            "id": f"sug_{idx}",
            "section": "Summary",
            "severity": "medium",
            "title": "Add a professional summary",
            "description": "A 2-3 sentence summary at the top of your resume helps recruiters quickly understand your value proposition.",
            "example": None,
        })

    if issues.get("short_resume", False):
        idx += 1
        suggestions.append({
            "id": f"sug_{idx}",
            "section": "Experience",
            "severity": "medium",
            "title": "Expand your experience details",
            "description": "Your resume is shorter than recommended. Add more bullet points under each role describing your responsibilities and achievements.",
            "example": None,
        })

    if not suggestions:
        suggestions.append({
            "id": "sug_1",
            "section": "Format",
            "severity": "low",
            "title": "Consider adding a portfolio link",
            "description": "Adding a GitHub profile or portfolio website helps recruiters see your work firsthand.",
            "example": None,
        })

    return suggestions


# ══════════════════════════════════════════════════════
# 5. STYLE ANALYSIS
# ══════════════════════════════════════════════════════

BUZZWORDS = [
    "synergy", "rockstar", "ninja", "guru", "passionate",
    "detail-oriented", "self-starter", "team player",
    "go-getter", "think outside the box", "game-changer",
    "results-driven", "proactive", "dynamic",
    "hardworking", "motivated", "leveraged",
]


def analyze_style(resume_text: str) -> dict:
    """Analyze resume style: voice tone and buzzword detection."""
    text_lower = resume_text.lower()

    # Buzzword detection
    found_buzzwords = [bw for bw in BUZZWORDS if bw in text_lower]

    buzzword_result = {
        "pass": len(found_buzzwords) == 0,
        "found": found_buzzwords,
        "count": len(found_buzzwords),
        "message": "No clichés detected — great!" if not found_buzzwords else f"Found {len(found_buzzwords)} overused buzzwords/clichés",
    }

    return {
        "buzzwords": buzzword_result,
        "voice": {
            "tone": "professional",
            "description": "Standard professional tone",
        },
    }
