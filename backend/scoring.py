"""
Enhanced 5-Axis Scoring System
================================
Calculates weighted composite scores across 5 dimensions:
  - Content (25%)  — measurable results, word count, action verbs
  - Skills (30%)   — required skills match from JD
  - Format (20%)   — date formatting, length, bullet points
  - Sections (15%) — completeness of required sections
  - Style (10%)    — tone, no clichés/buzzwords
"""

import re
from typing import Dict, List, Optional


# ── Action verbs commonly used in strong resumes ──
ACTION_VERBS = {
    "achieved", "built", "created", "delivered", "designed", "developed",
    "drove", "engineered", "established", "executed", "generated",
    "implemented", "improved", "increased", "launched", "led", "managed",
    "optimized", "orchestrated", "pioneered", "reduced", "scaled",
    "spearheaded", "streamlined", "transformed", "architected", "automated",
    "collaborated", "coordinated", "defined", "deployed", "directed",
}

BUZZWORDS = [
    "synergy", "rockstar", "ninja", "guru", "passionate",
    "detail-oriented", "self-starter", "team player", "go-getter",
    "think outside the box", "game-changer", "results-driven",
    "proactive", "dynamic", "hardworking", "motivated", "leveraged",
]

REQUIRED_SECTIONS = ["name", "email", "phone", "summary", "experience", "education", "skills"]
SECTION_PATTERNS = {
    "summary": r"\b(summary|objective|profile|about)\b",
    "experience": r"\b(experience|employment|work history|professional)\b",
    "education": r"\b(education|academic|qualification|degree|university|college)\b",
    "skills": r"\b(skills|technologies|technical|competencies|proficiencies)\b",
    "projects": r"\b(projects|portfolio)\b",
    "certifications": r"\b(certifications?|licenses?|credentials?)\b",
}


def compute_content_score(resume_text: str) -> Dict:
    """Content score (25% weight): measurable results, word count, action verbs."""
    words = resume_text.split()
    word_count = len(words)
    text_lower = resume_text.lower()

    # Count quantified achievements (numbers with context)
    quant_patterns = [
        r'\d+%', r'\$\d+', r'\d+\s*(million|billion|thousand|k\b|m\b)',
        r'(increased|reduced|improved|grew|saved|generated|delivered)\s+.*?\d+',
    ]
    quantified_count = 0
    for pat in quant_patterns:
        quantified_count += len(re.findall(pat, text_lower))

    # Count action verbs
    action_count = sum(1 for v in ACTION_VERBS if f" {v} " in f" {text_lower} " or text_lower.startswith(v))

    # Score components
    word_score = min(100, max(0, (word_count - 100) / 5)) if word_count >= 100 else word_count
    quant_score = min(100, quantified_count * 20)
    verb_score = min(100, action_count * 10)

    total = int(word_score * 0.3 + quant_score * 0.4 + verb_score * 0.3)
    total = max(0, min(100, total))

    return {
        "score": total,
        "word_count": word_count,
        "quantified_count": quantified_count,
        "action_verb_count": action_count,
        "word_score": int(word_score),
        "details": {
            "measurable_results": {
                "pass": quantified_count >= 3,
                "count": quantified_count,
                "message": f"Found {quantified_count} quantified achievements" if quantified_count >= 3 else f"Only {quantified_count} quantified results found — aim for 3+",
            },
            "word_count_check": {
                "pass": 200 <= word_count <= 1200,
                "count": word_count,
                "message": "Resume length is within recommended range" if 200 <= word_count <= 1200 else ("Resume is too short — add more detail" if word_count < 200 else "Resume may be too long — consider condensing"),
            },
        },
    }


def compute_skills_score(resume_text: str, required_hard: List[str], required_soft: List[str], nice_to_have: List[str] = None) -> Dict:
    """Skills score (30% weight): match against JD requirements."""
    from rapidfuzz import fuzz
    text_lower = resume_text.lower()

    def find_skill(skill, text):
        if skill.lower() in text:
            return True
        # Fuzzy match for variations
        words = text.split()
        for i in range(len(words)):
            chunk = " ".join(words[i:i+3])
            if fuzz.ratio(skill.lower(), chunk) >= 80:
                return True
        return False

    # Count skill frequency in resume
    def count_freq(skill, text):
        return text.lower().count(skill.lower())

    hard_results = []
    for skill in required_hard:
        found = find_skill(skill, text_lower)
        hard_results.append({
            "skill": skill,
            "found": found,
            "resume_freq": count_freq(skill, text_lower) if found else 0,
        })

    soft_results = []
    for skill in required_soft:
        found = find_skill(skill, text_lower)
        soft_results.append({
            "skill": skill,
            "found": found,
            "resume_freq": count_freq(skill, text_lower) if found else 0,
        })

    nice_results = []
    for skill in (nice_to_have or []):
        found = find_skill(skill, text_lower)
        nice_results.append({"skill": skill, "found": found})

    hard_found = sum(1 for r in hard_results if r["found"])
    soft_found = sum(1 for r in soft_results if r["found"])
    total_req = len(required_hard) + len(required_soft)
    total_found = hard_found + soft_found

    match_pct = int((total_found / max(total_req, 1)) * 100)
    score = max(0, min(100, match_pct))

    return {
        "score": score,
        "hard_skills": hard_results,
        "soft_skills": soft_results,
        "nice_to_have": nice_results,
        "hard_found": hard_found,
        "hard_total": len(required_hard),
        "soft_found": soft_found,
        "soft_total": len(required_soft),
        "match_percentage": match_pct,
        "missing_hard": [r["skill"] for r in hard_results if not r["found"]],
        "missing_soft": [r["skill"] for r in soft_results if not r["found"]],
    }


def compute_format_score(resume_text: str) -> Dict:
    """Format score (20% weight): date formatting, length, bullet points."""
    words = resume_text.split()
    word_count = len(words)

    # Date format check
    date_patterns = [
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}\b',
        r'\b\d{4}\s*[-–—]\s*(Present|\d{4})\b',
        r'\b\d{1,2}/\d{4}\b',
    ]
    dates_found = sum(len(re.findall(p, resume_text, re.IGNORECASE)) for p in date_patterns)
    date_pass = dates_found >= 2

    # Resume length
    length_pass = 200 <= word_count <= 1200

    # Bullet points
    bullet_patterns = [r'^[\-\•\*\→\►]', r'^\d+\.', r'^[a-z]\)']
    lines = resume_text.split('\n')
    bullet_count = sum(1 for line in lines if any(re.match(p, line.strip()) for p in bullet_patterns))
    bullet_pass = bullet_count >= 3

    checks = [date_pass, length_pass, bullet_pass]
    score = int((sum(checks) / len(checks)) * 100)

    return {
        "score": score,
        "date_formatting": {
            "pass": date_pass,
            "dates_found": dates_found,
            "message": f"Found {dates_found} properly formatted dates" if date_pass else "Inconsistent or missing date formats — use 'Month Year' format",
        },
        "resume_length": {
            "pass": length_pass,
            "word_count": word_count,
            "message": f"{word_count} words — within recommended range" if length_pass else f"{word_count} words — {'too short, add more detail' if word_count < 200 else 'consider condensing'}",
        },
        "bullet_points": {
            "pass": bullet_pass,
            "count": bullet_count,
            "message": f"Found {bullet_count} bullet-point lines" if bullet_pass else f"Only {bullet_count} bullet points — use more for readability",
        },
    }


def compute_sections_score(resume_text: str, entities: Dict) -> Dict:
    """Sections score (15% weight): completeness of required sections."""
    text_lower = resume_text.lower()

    section_checks = {}

    # Name
    name = entities.get("name", "")
    section_checks["name"] = {"present": bool(name), "value": name or "Not found"}

    # Email
    email = entities.get("email", "")
    section_checks["email"] = {"present": bool(email), "value": email or "Not found"}

    # Phone
    phone = entities.get("phone", "")
    section_checks["phone"] = {"present": bool(phone), "value": phone or "Not found"}

    # Portfolio/GitHub
    github = entities.get("github", "")
    linkedin = entities.get("linkedin", "")
    portfolio = github or linkedin
    section_checks["portfolio"] = {"present": bool(portfolio), "value": portfolio or "Not found"}

    # Text sections
    for section_name, pattern in SECTION_PATTERNS.items():
        found = bool(re.search(pattern, text_lower))
        section_checks[section_name] = {"present": found, "value": "Detected" if found else "Not found"}

    present_count = sum(1 for v in section_checks.values() if v["present"])
    total = len(section_checks)
    core_sections = ["name", "email", "experience", "education", "skills"]
    core_present = sum(1 for s in core_sections if section_checks.get(s, {}).get("present", False))

    score = int((present_count / max(total, 1)) * 100)
    overall_pass = core_present >= 4

    return {
        "score": score,
        "overall_pass": overall_pass,
        "sections": section_checks,
        "present_count": present_count,
        "total_count": total,
        "message": f"{present_count}/{total} sections present" + (" — all core sections found" if overall_pass else " — missing core sections"),
    }


def compute_style_score(resume_text: str, voice_data: Optional[Dict] = None) -> Dict:
    """Style score (10% weight): tone and buzzword check."""
    text_lower = resume_text.lower()

    # Buzzword detection
    found_buzzwords = [bw for bw in BUZZWORDS if bw in text_lower]
    buzzword_pass = len(found_buzzwords) == 0

    # Basic tone analysis
    voice = voice_data or {"tone": "professional", "description": "Standard professional tone"}

    buzzword_score = 100 if buzzword_pass else max(0, 100 - len(found_buzzwords) * 15)
    voice_score = 80  # Default professional

    score = int(buzzword_score * 0.5 + voice_score * 0.5)

    return {
        "score": max(0, min(100, score)),
        "voice": {
            "tone": voice.get("tone", "professional"),
            "description": voice.get("description", "Professional tone"),
            "pass": True,
        },
        "buzzwords": {
            "pass": buzzword_pass,
            "found": found_buzzwords,
            "count": len(found_buzzwords),
            "message": "No clichés detected" if buzzword_pass else f"Found {len(found_buzzwords)} overused buzzwords: {', '.join(found_buzzwords[:5])}",
        },
    }


def compute_composite_score(content: Dict, skills: Dict, fmt: Dict, sections: Dict, style: Dict) -> Dict:
    """Compute the weighted composite score from all 5 axes."""
    weights = {
        "content": 0.25,
        "skills": 0.30,
        "format": 0.20,
        "sections": 0.15,
        "style": 0.10,
    }

    scores = {
        "content": content["score"],
        "skills": skills["score"],
        "format": fmt["score"],
        "sections": sections["score"],
        "style": style["score"],
    }

    composite = sum(scores[k] * weights[k] for k in weights)
    composite = max(0, min(100, int(composite)))

    return {
        "composite_score": composite,
        "breakdown": scores,
        "weights": {k: int(v * 100) for k, v in weights.items()},
        "radar_data": [
            {"axis": "Content", "score": scores["content"]},
            {"axis": "Skills", "score": scores["skills"]},
            {"axis": "Format", "score": scores["format"]},
            {"axis": "Sections", "score": scores["sections"]},
            {"axis": "Style", "score": scores["style"]},
        ],
    }
