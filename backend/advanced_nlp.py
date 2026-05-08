"""Advanced NLP features beyond the academic report.

- Skills extraction & matching (exact + fuzzy)
- Semantic similarity scoring
- Named entity recognition
"""

import re
from typing import List, Dict, Optional
from rapidfuzz import fuzz
from skills_db import ALL_SKILLS, TECHNICAL_SKILLS, SOFT_SKILLS, CERTIFICATIONS


def extract_skills(text: str) -> List[str]:
    """Extract skills from text using exact and fuzzy matching against master DB."""
    found = set()
    text_lower = text.lower()
    
    for skill in ALL_SKILLS:
        # Exact match (case-insensitive)
        if skill.lower() in text_lower:
            found.add(skill)
    
    # Also check multi-word skills with word boundary matching
    words = set(re.findall(r'\b[a-zA-Z#+.]{2,}\b', text))
    for word in words:
        for skill in ALL_SKILLS:
            if len(skill) > 3 and fuzz.ratio(word.lower(), skill.lower()) > 85:
                found.add(skill)
    
    return sorted(list(found))


def match_skills(resume_skills: List[str], required: List[str], preferred: List[str] = None) -> Dict:
    """Compare extracted skills against job requirements."""
    resume_lower = {s.lower() for s in resume_skills}
    req_lower = {s.lower(): s for s in required} if required else {}
    pref_lower = {s.lower(): s for s in (preferred or [])}
    
    found = []
    missing = []
    bonus = []
    
    for skill_l, skill in req_lower.items():
        matched = False
        for rs in resume_lower:
            if fuzz.ratio(skill_l, rs) > 80:
                found.append(skill)
                matched = True
                break
        if not matched:
            missing.append(skill)
    
    # Bonus: skills in resume not in requirements
    all_req = set(req_lower.keys()) | set(pref_lower.keys())
    for rs in resume_skills:
        if rs.lower() not in all_req:
            bonus.append(rs)
    
    total_req = len(required) if required else 1
    match_pct = round((len(found) / total_req) * 100, 1) if total_req > 0 else 0
    
    return {
        "found": found,
        "missing": missing,
        "bonus": bonus[:10],  # Cap at 10
        "match_percentage": match_pct,
    }


def calculate_keyword_overlap(resume_text: str, jd_text: str) -> float:
    """Calculate keyword overlap percentage between resume and JD."""
    if not jd_text:
        return 0.0
    
    resume_words = set(re.findall(r'\b\w{3,}\b', resume_text.lower()))
    jd_words = set(re.findall(r'\b\w{3,}\b', jd_text.lower()))
    
    # Remove common stopwords
    stopwords = {'the', 'and', 'for', 'are', 'was', 'were', 'been', 'have', 'has',
                 'had', 'with', 'will', 'would', 'could', 'should', 'may', 'can',
                 'this', 'that', 'these', 'those', 'from', 'into', 'about', 'which',
                 'who', 'whom', 'what', 'when', 'where', 'how', 'not', 'also', 'but',
                 'they', 'them', 'their', 'your', 'you', 'our', 'more', 'most', 'very'}
    
    jd_words -= stopwords
    resume_words -= stopwords
    
    if not jd_words:
        return 0.0
    
    overlap = resume_words & jd_words
    return round((len(overlap) / len(jd_words)) * 100, 1)


def calculate_match_score(tfidf_confidence: float, semantic_score: float, keyword_overlap: float) -> float:
    """
    Calculate final weighted match score.
    Formula: Final = (0.4 × TF-IDF) + (0.4 × semantic) + (0.2 × keyword overlap)
    """
    return round(
        (0.4 * tfidf_confidence) + (0.4 * semantic_score) + (0.2 * keyword_overlap),
        1
    )


def generate_recommendations(result: Dict, quality: Dict, ats: Dict) -> List[str]:
    """Generate specific improvement recommendations."""
    recs = []
    
    if quality.get("contact_info", 0) < 70:
        recs.append("Add missing contact information (email, phone, LinkedIn)")
    if quality.get("action_verbs", 0) < 50:
        recs.append("Use more action verbs (e.g., 'achieved', 'implemented', 'led')")
    if quality.get("quantified", 0) < 50:
        recs.append("Add quantified achievements (e.g., 'increased sales by 30%')")
    if quality.get("skills_section", 0) < 50:
        recs.append("Add a dedicated 'Skills' section with relevant technologies")
    if quality.get("length", 0) < 60:
        recs.append("Expand resume content — aim for 400-700 words")
    if ats.get("score", 100) < 70:
        recs.append("Improve ATS compatibility: use standard section headings")
    
    skills_match = result.get("skills_match", {})
    missing = skills_match.get("missing", [])
    if missing:
        recs.append(f"Add missing required skills: {', '.join(missing[:5])}")
    
    if not result.get("entities", {}).get("github"):
        recs.append("Include a GitHub profile link to showcase projects")
    if not result.get("entities", {}).get("linkedin"):
        recs.append("Add your LinkedIn profile URL")
    
    return recs[:8]


def analyze_job_description(jd_text: str) -> Dict:
    """Analyze a job description to extract requirements."""
    lower = jd_text.lower()
    
    # Extract skills from JD
    all_found = extract_skills(jd_text)
    
    # Heuristic: skills after "required" are must-have, after "nice" are preferred
    required = []
    nice_to_have = []
    
    # Simple section-based split
    req_section = re.search(r'(?:required|must have|essential|mandatory)(.*?)(?:nice|preferred|bonus|$)', lower, re.S)
    nice_section = re.search(r'(?:nice to have|preferred|bonus|desired)(.*?)(?:$)', lower, re.S)
    
    if req_section:
        req_skills = extract_skills(req_section.group(1))
        required = req_skills
        nice_to_have = [s for s in all_found if s not in required]
    else:
        # If no clear sections, split 70/30
        split = int(len(all_found) * 0.7)
        required = all_found[:split]
        nice_to_have = all_found[split:]
    
    # Experience level detection
    exp_level = "Mid-level"
    if re.search(r'senior|lead|principal|staff|8\+|10\+', lower):
        exp_level = "Senior"
    elif re.search(r'junior|entry|intern|graduate|0-2|1-2', lower):
        exp_level = "Entry-level"
    elif re.search(r'manager|director|head of|vp', lower):
        exp_level = "Management"
    
    return {
        "required_skills": required,
        "nice_to_have_skills": nice_to_have,
        "experience_level": exp_level,
        "all_skills": all_found,
    }
