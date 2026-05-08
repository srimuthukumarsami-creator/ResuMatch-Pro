"""Utility functions — PDF/DOCX parsing, entity extraction, quality scoring."""

import io
import re


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file bytes."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {str(e)}")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from uploaded file based on extension."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1")
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Use PDF, DOCX, or TXT.")


# ══════════════════════════════════════════════════════
# ENTITY EXTRACTION (BUG 2 FIX — robust extraction)
# ══════════════════════════════════════════════════════

def extract_email(text: str) -> str:
    """Extract email address from full text (case-insensitive)."""
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text, re.IGNORECASE)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    """Extract phone number — handles (415) 555-0192, +1-555-123-4567, etc."""
    patterns = [
        r'\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}',
        r'\+?\d{1,3}[\s.\-]\(?\d{2,4}\)?[\s.\-]?\d{3,4}[\s.\-]?\d{3,4}',
        r'\d{10,12}',
    ]
    for pat in patterns:
        match = re.search(pat, text)
        if match:
            result = match.group(0).strip()
            # Validate: must have at least 7 digits
            digits = re.sub(r'\D', '', result)
            if len(digits) >= 7:
                return result
    return ""


def extract_linkedin(text: str) -> str:
    """Extract LinkedIn URL from full text."""
    match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?', text, re.IGNORECASE)
    return match.group(0) if match else ""


def extract_github(text: str) -> str:
    """Extract GitHub URL from full text."""
    match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', text, re.IGNORECASE)
    return match.group(0) if match else ""


def extract_name_heuristic(text: str) -> str:
    """
    Smart name extraction that NEVER returns a job title.
    Filters out common title words and uses multiple strategies.
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if not lines:
        return ""

    # Job title words — if a candidate segment is mostly these, it's a title not a name
    TITLE_WORDS = {
        'engineer', 'developer', 'manager', 'designer', 'analyst', 'director',
        'lead', 'senior', 'junior', 'intern', 'architect', 'consultant',
        'officer', 'specialist', 'coordinator', 'administrator', 'associate',
        'scientist', 'researcher', 'technician', 'programmer', 'instructor',
        'professor', 'president', 'founder', 'ceo', 'cto', 'cfo', 'vp',
        'head', 'principal', 'staff', 'software', 'backend', 'frontend',
        'fullstack', 'full-stack', 'devops', 'data', 'machine', 'learning',
        'product', 'project', 'program', 'qa', 'test', 'marketing', 'sales',
        'operations', 'support', 'executive', 'assistant', 'python', 'java',
        'javascript', 'react', 'angular', 'cloud', 'systems', 'network',
        'security', 'database', 'mobile', 'web', 'ui', 'ux', 'ml', 'ai',
    }

    # Common section headings to skip
    HEADINGS = {
        'summary', 'objective', 'experience', 'education', 'skills',
        'projects', 'certifications', 'work history', 'employment',
        'professional', 'contact', 'references', 'awards', 'profile',
        'resume', 'curriculum vitae', 'cv', 'about', 'technical',
        'professional summary', 'career objective', 'work experience',
    }

    def is_heading(line):
        low = line.lower().strip().rstrip(':')
        return low in HEADINGS or (line.isupper() and len(line.split()) <= 4)

    def is_job_title(text_segment):
        """Returns True if the segment looks like a job title, not a name."""
        words = text_segment.lower().split()
        if not words:
            return True
        title_count = sum(1 for w in words if w in TITLE_WORDS)
        # If more than half the words are title words, it's a job title
        return title_count >= len(words) * 0.5

    def is_valid_name(text_segment):
        """Returns True if the segment looks like a human name."""
        text_segment = text_segment.strip()
        if not text_segment or len(text_segment) < 3:
            return False
        words = text_segment.split()
        if len(words) < 2 or len(words) > 4:
            return False
        # Must NOT be a job title
        if is_job_title(text_segment):
            return False
        # Each word should start with uppercase, be alphabetic (allow hyphens)
        for w in words:
            if not w[0].isupper():
                return False
            cleaned = w.replace('-', '').replace("'", '')
            if not cleaned.isalpha():
                return False
        # Skip if it looks like a section heading
        if is_heading(text_segment):
            return False
        return True

    def extract_from_line(line):
        """Try to extract a name from a line, splitting by separators."""
        # Split by common separators: | • · — – ,
        parts = re.split(r'\s*[|•·—–]\s*', line)
        if len(parts) == 1:
            # Also try comma but only if there are multiple segments
            comma_parts = line.split(',')
            if len(comma_parts) >= 2:
                parts = comma_parts

        for part in parts:
            part = part.strip()
            # Skip email, phone, URL parts
            if re.search(r'@|http|www\.|\.com|\.org|\.net|\d{5,}', part, re.I):
                continue
            if re.match(r'^[\d\(\+]', part):  # starts with digit/phone
                continue
            if not part:
                continue
            if is_valid_name(part):
                return part
        return None

    # Strategy 1: Pure name line (2-4 capitalized alpha words, no separators)
    for line in lines[:8]:
        if is_heading(line):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and not re.search(r'[@|•·\d{4,}]', line):
            if all(w[0].isupper() and w.replace('-', '').replace("'", '').isalpha() for w in words):
                if not is_job_title(line):
                    return line

    # Strategy 2: Lines with separators (Name | email | phone)
    for line in lines[:6]:
        if is_heading(line):
            continue
        name = extract_from_line(line)
        if name:
            return name

    # Strategy 3: First line before email/phone that looks like a name
    for line in lines[:8]:
        if is_heading(line):
            continue
        if re.search(r'@|http|www\.|\.com', line, re.I):
            continue
        if re.match(r'^[\d\(\+]', line):
            continue
        words = line.split()
        if 2 <= len(words) <= 5:
            # Take first 2-4 capitalized words
            name_words = [w for w in words[:4] if len(w) > 1 and w[0].isupper()
                         and w.replace('-', '').replace("'", '').isalpha()]
            if len(name_words) >= 2:
                candidate = ' '.join(name_words)
                if not is_job_title(candidate):
                    return candidate

    return ""


# ── Resume Quality Scoring ──

ACTION_VERBS = [
    "achieved", "built", "created", "delivered", "designed", "developed",
    "established", "generated", "implemented", "improved", "increased",
    "launched", "led", "managed", "optimized", "orchestrated", "reduced",
    "resolved", "spearheaded", "streamlined", "transformed",
]

SECTION_HEADERS = [
    "experience", "education", "skills", "projects", "certifications",
    "achievements", "summary", "objective", "work history", "employment",
]


def score_resume_quality(text: str) -> dict:
    """Score resume quality across multiple dimensions (0-100 each)."""
    lower = text.lower()
    words = text.split()
    word_count = len(words)

    # Length adequacy (ideal: 300-800 words)
    if word_count < 100:
        length_score = 20
    elif word_count < 300:
        length_score = 50
    elif word_count <= 800:
        length_score = 100
    elif word_count <= 1200:
        length_score = 80
    else:
        length_score = 60

    # Contact info completeness
    contact = 0
    if extract_email(text): contact += 30
    if extract_phone(text): contact += 25
    if extract_linkedin(text): contact += 25
    if extract_name_heuristic(text): contact += 20

    # Skills section
    skills_score = 100 if any(h in lower for h in ["skills", "technical skills", "technologies"]) else 30

    # Experience section
    exp_score = 100 if any(h in lower for h in ["experience", "work history", "employment"]) else 30

    # Education section
    edu_score = 100 if any(h in lower for h in ["education", "academic", "university", "degree"]) else 30

    # Action verbs usage
    verb_count = sum(1 for v in ACTION_VERBS if v in lower)
    action_score = min(100, verb_count * 15)

    # Quantified achievements (numbers with context)
    numbers = re.findall(r'\d+[%$]|\d+\s*(?:percent|million|thousand|users|clients|projects)', lower)
    quant_score = min(100, len(numbers) * 20)

    total = round((length_score + contact + skills_score + exp_score + edu_score + action_score + quant_score) / 7)

    return {
        "total": max(0, min(100, total)), "length": length_score, "contact_info": contact,
        "skills_section": skills_score, "experience_section": exp_score,
        "education_section": edu_score, "action_verbs": action_score, "quantified": quant_score,
    }


def check_ats_compatibility(text: str) -> dict:
    """Check ATS compatibility of resume."""
    issues = []
    tips = []
    score = 100
    lower = text.lower()

    # Check for standard section headings
    found_sections = [h for h in SECTION_HEADERS if h in lower]
    if len(found_sections) < 3:
        issues.append({"severity": "high", "issue": "Missing standard section headings"})
        tips.append("Add clear section headers: Experience, Education, Skills")
        score -= 20

    # Check length
    if len(text.split()) < 150:
        issues.append({"severity": "medium", "issue": "Resume may be too short"})
        tips.append("Expand content to at least 300 words for better ATS parsing")
        score -= 10

    # Check for contact info
    if not extract_email(text):
        issues.append({"severity": "high", "issue": "No email address detected"})
        tips.append("Include a professional email address")
        score -= 15

    if not extract_phone(text):
        issues.append({"severity": "medium", "issue": "No phone number detected"})
        tips.append("Add a contact phone number")
        score -= 5

    # Check for dates (work history)
    dates = re.findall(r'20[0-2]\d|19[9]\d', text)
    if len(dates) < 2:
        issues.append({"severity": "medium", "issue": "Few date references found"})
        tips.append("Include employment dates in MM/YYYY format")
        score -= 10

    return {"score": max(0, score), "issues": issues, "tips": tips}


def detect_bias(text: str) -> list:
    """Flag potentially biased content in resume."""
    flags = []
    lower = text.lower()

    age_patterns = [r'\b(age|born in|date of birth|dob)\b', r'\b(19[4-7]\d|19[8-9]\d)\b']
    for pat in age_patterns:
        match = re.search(pat, lower)
        if match:
            flags.append({
                "phrase": match.group(0), "category": "age",
                "explanation": "Age-related information may lead to unconscious bias"
            })

    gender_words = re.findall(r'\b(he|she|his|her|husband|wife|mr\.|mrs\.|ms\.)\b', lower)
    if gender_words:
        flags.append({
            "phrase": ", ".join(set(gender_words[:3])), "category": "gender",
            "explanation": "Gender indicators may cause unconscious bias in screening"
        })

    return flags
