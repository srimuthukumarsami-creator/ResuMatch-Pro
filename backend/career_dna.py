"""
Career DNA & Skill Genome Analyzer
=====================================
Innovation: Transforms resume data into a unique "Skill DNA" fingerprint,
predicts career paths, analyzes skill synergies, and generates learning roadmaps.

This is a novel approach that goes beyond traditional resume scoring —
it provides predictive career intelligence.
"""

import re
import math
from typing import Dict, List, Tuple
from skills_db import TECHNICAL_SKILLS, SOFT_SKILLS, CERTIFICATIONS


# ══════════════════════════════════════════════════════
# CAREER PATH DEFINITIONS — skill requirements per role
# ══════════════════════════════════════════════════════

CAREER_PATHS = {
    "Full Stack Developer": {
        "core_skills": ["JavaScript", "React", "Node.js", "HTML", "CSS", "SQL", "Git"],
        "bonus_skills": ["TypeScript", "Next.js", "MongoDB", "Docker", "GraphQL", "Redux", "REST API"],
        "soft_needs": ["Problem Solving", "Communication", "Teamwork"],
        "growth": "Senior Full Stack → Tech Lead → Engineering Manager",
        "avg_salary": "$95K–$150K",
        "demand": 95,
        "icon": "code",
    },
    "Frontend Engineer": {
        "core_skills": ["JavaScript", "React", "HTML", "CSS", "TypeScript", "Redux"],
        "bonus_skills": ["Vue", "Angular", "Next.js", "Tailwind CSS", "Figma", "Webpack", "Vite"],
        "soft_needs": ["Creativity", "Attention to Detail", "Communication"],
        "growth": "Senior Frontend → UI Architect → Head of Design Engineering",
        "avg_salary": "$85K–$140K",
        "demand": 90,
        "icon": "palette",
    },
    "Backend Engineer": {
        "core_skills": ["Python", "Java", "SQL", "REST API", "Docker", "Git"],
        "bonus_skills": ["Node.js", "Go", "Kubernetes", "Redis", "PostgreSQL", "MongoDB", "Kafka", "gRPC"],
        "soft_needs": ["Analytical Thinking", "Problem Solving"],
        "growth": "Senior Backend → Platform Engineer → VP Engineering",
        "avg_salary": "$90K–$155K",
        "demand": 92,
        "icon": "server",
    },
    "Data Scientist": {
        "core_skills": ["Python", "Machine Learning", "Pandas", "NumPy", "SQL", "scikit-learn"],
        "bonus_skills": ["TensorFlow", "PyTorch", "Deep Learning", "NLP", "R", "Spark", "Tableau", "Jupyter"],
        "soft_needs": ["Analytical Thinking", "Critical Thinking", "Communication", "Presentation"],
        "growth": "Senior Data Scientist → Lead DS → Chief Data Officer",
        "avg_salary": "$100K–$170K",
        "demand": 88,
        "icon": "brain",
    },
    "DevOps Engineer": {
        "core_skills": ["Docker", "Kubernetes", "Linux", "CI/CD", "AWS", "Terraform", "Git"],
        "bonus_skills": ["Jenkins", "Ansible", "Helm", "Nginx", "GitHub Actions", "ArgoCD", "Python", "Bash"],
        "soft_needs": ["Problem Solving", "Communication", "Adaptability"],
        "growth": "Senior DevOps → SRE Lead → Platform Architect",
        "avg_salary": "$95K–$160K",
        "demand": 93,
        "icon": "cloud",
    },
    "Cloud Architect": {
        "core_skills": ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "Linux"],
        "bonus_skills": ["Google Cloud", "Lambda", "S3", "EC2", "CloudFront", "Ansible", "Nginx", "Helm"],
        "soft_needs": ["Strategic Planning", "Leadership", "Communication"],
        "growth": "Senior Cloud → Solutions Architect → CTO",
        "avg_salary": "$120K–$190K",
        "demand": 91,
        "icon": "cloud",
    },
    "Mobile Developer": {
        "core_skills": ["React Native", "Flutter", "JavaScript", "Swift", "Kotlin"],
        "bonus_skills": ["iOS", "Android", "Dart", "TypeScript", "Firebase", "Expo", "SwiftUI"],
        "soft_needs": ["Creativity", "Attention to Detail", "Problem Solving"],
        "growth": "Senior Mobile Dev → Mobile Lead → Head of Mobile",
        "avg_salary": "$85K–$145K",
        "demand": 82,
        "icon": "smartphone",
    },
    "Machine Learning Engineer": {
        "core_skills": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "NumPy"],
        "bonus_skills": ["NLP", "Computer Vision", "Keras", "scikit-learn", "Spark", "Docker", "Kubernetes", "Hugging Face"],
        "soft_needs": ["Analytical Thinking", "Problem Solving", "Critical Thinking"],
        "growth": "Senior ML Engineer → ML Architect → Head of AI",
        "avg_salary": "$110K–$185K",
        "demand": 94,
        "icon": "brain",
    },
    "Cybersecurity Analyst": {
        "core_skills": ["OWASP", "Penetration Testing", "Firewalls", "Linux", "Encryption", "SIEM"],
        "bonus_skills": ["OAuth", "JWT", "SSL/TLS", "Zero Trust", "SOC", "Vulnerability Assessment", "Python", "Bash"],
        "soft_needs": ["Analytical Thinking", "Attention to Detail", "Critical Thinking"],
        "growth": "Senior Security → Security Architect → CISO",
        "avg_salary": "$90K–$160K",
        "demand": 96,
        "icon": "shield",
    },
    "Data Engineer": {
        "core_skills": ["Python", "SQL", "Spark", "Kafka", "Airflow", "AWS"],
        "bonus_skills": ["Hadoop", "Hive", "Flink", "Snowflake", "dbt", "Docker", "PostgreSQL", "Databricks"],
        "soft_needs": ["Problem Solving", "Analytical Thinking", "Communication"],
        "growth": "Senior Data Engineer → Data Architect → VP Data",
        "avg_salary": "$100K–$165K",
        "demand": 89,
        "icon": "database",
    },
    "UI/UX Designer": {
        "core_skills": ["Figma", "UI/UX", "Wireframing", "Prototyping", "HTML", "CSS"],
        "bonus_skills": ["Sketch", "Adobe XD", "Photoshop", "Illustrator", "Tailwind CSS", "React", "After Effects"],
        "soft_needs": ["Creativity", "Communication", "Attention to Detail", "Collaboration"],
        "growth": "Senior Designer → Design Lead → VP Design",
        "avg_salary": "$75K–$130K",
        "demand": 80,
        "icon": "palette",
    },
    "QA / Test Engineer": {
        "core_skills": ["Selenium", "Cypress", "Jest", "Postman", "Git", "SQL"],
        "bonus_skills": ["Playwright", "JUnit", "PyTest", "JMeter", "Appium", "SonarQube", "Docker", "CI/CD"],
        "soft_needs": ["Attention to Detail", "Analytical Thinking", "Communication"],
        "growth": "Senior QA → QA Lead → Director of Quality",
        "avg_salary": "$70K–$120K",
        "demand": 78,
        "icon": "check",
    },
}


# ══════════════════════════════════════════════════════
# SKILL SYNERGY PAIRS — skills that multiply value together
# ══════════════════════════════════════════════════════

SYNERGY_PAIRS = [
    (["React", "Node.js"], "Full Stack JavaScript", 15),
    (["Python", "Machine Learning"], "ML Engineering", 18),
    (["Docker", "Kubernetes"], "Container Orchestration", 14),
    (["AWS", "Terraform"], "Infrastructure as Code", 16),
    (["React", "TypeScript"], "Type-Safe UI", 12),
    (["Python", "SQL"], "Data Analysis", 10),
    (["TensorFlow", "PyTorch"], "Deep Learning Mastery", 15),
    (["Git", "CI/CD"], "DevOps Foundations", 11),
    (["HTML", "CSS", "JavaScript"], "Web Fundamentals", 13),
    (["MongoDB", "Node.js"], "MERN Backend", 12),
    (["PostgreSQL", "Django"], "Python Web Stack", 13),
    (["Flutter", "Dart"], "Cross-Platform Mobile", 14),
    (["Figma", "React"], "Design-to-Code", 16),
    (["Kafka", "Spark"], "Real-Time Data Pipeline", 17),
    (["Linux", "Docker", "Kubernetes"], "Cloud Native Ops", 18),
    (["NLP", "Hugging Face"], "NLP Engineering", 15),
    (["Redis", "PostgreSQL"], "Hybrid Database Architecture", 12),
    (["GraphQL", "React"], "Modern API Frontend", 13),
    (["Jenkins", "Docker"], "CI/CD Pipeline", 12),
    (["Selenium", "Jest"], "Full-Spectrum Testing", 11),
]


def extract_all_skills(resume_text: str) -> Dict[str, List[str]]:
    """Extract ALL skills from resume text organized by category."""
    text_lower = resume_text.lower()
    genome = {}

    for category, skills in TECHNICAL_SKILLS.items():
        found = []
        for skill in skills:
            # Check exact match (case-insensitive)
            if skill.lower() in text_lower:
                found.append(skill)
            # Check common variations
            elif skill.replace(".", "").lower() in text_lower.replace(".", ""):
                found.append(skill)
        if found:
            genome[category] = found

    # Soft skills
    found_soft = [s for s in SOFT_SKILLS if s.lower() in text_lower]
    if found_soft:
        genome["soft_skills"] = found_soft

    # Certifications
    found_certs = [c for c in CERTIFICATIONS if c.lower() in text_lower]
    if found_certs:
        genome["certifications"] = found_certs

    return genome


def compute_skill_dna(genome: Dict[str, List[str]]) -> List[Dict]:
    """
    Compute the Skill DNA fingerprint — a radial data structure showing
    skill density across all categories. Each category gets a 'strength'
    score (0-100) based on how many skills are found vs. total available.
    """
    all_categories = list(TECHNICAL_SKILLS.keys()) + ["soft_skills", "certifications"]
    total_available = {cat: len(skills) for cat, skills in TECHNICAL_SKILLS.items()}
    total_available["soft_skills"] = len(SOFT_SKILLS)
    total_available["certifications"] = len(CERTIFICATIONS)

    dna_segments = []
    for cat in all_categories:
        found = genome.get(cat, [])
        total = total_available.get(cat, 1)
        strength = min(100, int((len(found) / max(total, 1)) * 100))

        # Category display names
        display_names = {
            "programming": "Programming", "web_frontend": "Frontend",
            "web_backend": "Backend", "databases": "Databases",
            "cloud": "Cloud", "devops": "DevOps",
            "data_science": "Data Science", "big_data": "Big Data",
            "mobile": "Mobile", "testing": "Testing",
            "security": "Security", "design": "Design",
            "project_mgmt": "Project Mgmt", "bi_analytics": "BI/Analytics",
            "sap": "SAP", "blockchain": "Blockchain",
            "networking": "Networking", "version_control": "Version Control",
            "os": "Operating Systems", "soft_skills": "Soft Skills",
            "certifications": "Certifications",
        }

        dna_segments.append({
            "category": cat,
            "label": display_names.get(cat, cat.replace("_", " ").title()),
            "strength": strength,
            "skills_found": found,
            "skills_count": len(found),
            "total_available": total,
            "color_hue": (all_categories.index(cat) * 17) % 360,  # Unique color per category
        })

    return dna_segments


def predict_career_paths(genome: Dict[str, List[str]]) -> List[Dict]:
    """
    Predict top career paths based on skill genome.
    Uses a weighted matching algorithm that considers:
    - Core skill matches (high weight)
    - Bonus skill matches (medium weight)
    - Soft skill alignment (low weight)
    """
    all_found_skills = set()
    for skills_list in genome.values():
        all_found_skills.update(skills_list)

    career_scores = []
    for career, reqs in CAREER_PATHS.items():
        # Core skills match
        core_matches = [s for s in reqs["core_skills"] if s in all_found_skills]
        core_score = len(core_matches) / max(len(reqs["core_skills"]), 1)

        # Bonus skills match
        bonus_matches = [s for s in reqs["bonus_skills"] if s in all_found_skills]
        bonus_score = len(bonus_matches) / max(len(reqs["bonus_skills"]), 1)

        # Soft skills match
        soft_matches = [s for s in reqs["soft_needs"] if s in all_found_skills]
        soft_score = len(soft_matches) / max(len(reqs["soft_needs"]), 1)

        # Weighted total (core = 60%, bonus = 25%, soft = 15%)
        fit_score = int((core_score * 0.60 + bonus_score * 0.25 + soft_score * 0.15) * 100)

        # Skills needed to learn
        missing_core = [s for s in reqs["core_skills"] if s not in all_found_skills]
        missing_bonus = [s for s in reqs["bonus_skills"] if s not in all_found_skills]

        career_scores.append({
            "career": career,
            "fit_score": min(100, fit_score),
            "core_match": len(core_matches),
            "core_total": len(reqs["core_skills"]),
            "core_matched": core_matches,
            "bonus_match": len(bonus_matches),
            "bonus_total": len(reqs["bonus_skills"]),
            "bonus_matched": bonus_matches,
            "soft_match": len(soft_matches),
            "soft_matched": soft_matches,
            "missing_core": missing_core,
            "missing_bonus": missing_bonus[:5],  # Top 5 recommended
            "growth_path": reqs["growth"],
            "avg_salary": reqs["avg_salary"],
            "market_demand": reqs["demand"],
            "icon": reqs["icon"],
            "learning_roadmap": _generate_roadmap(missing_core, missing_bonus),
        })

    # Sort by fit score
    career_scores.sort(key=lambda x: x["fit_score"], reverse=True)
    return career_scores[:6]  # Top 6 career paths


def _generate_roadmap(missing_core: List[str], missing_bonus: List[str]) -> List[Dict]:
    """Generate a learning roadmap with phases."""
    roadmap = []

    # Phase 1: Essential (missing core skills)
    if missing_core:
        roadmap.append({
            "phase": "Foundation",
            "duration": f"{len(missing_core) * 2}-{len(missing_core) * 4} weeks",
            "skills": missing_core[:4],
            "priority": "critical",
        })

    # Phase 2: Advanced (remaining core + top bonus)
    remaining_core = missing_core[4:]
    phase2_skills = remaining_core + missing_bonus[:3]
    if phase2_skills:
        roadmap.append({
            "phase": "Advanced",
            "duration": f"{len(phase2_skills) * 2}-{len(phase2_skills) * 3} weeks",
            "skills": phase2_skills[:5],
            "priority": "recommended",
        })

    # Phase 3: Mastery (remaining bonus)
    remaining_bonus = missing_bonus[3:]
    if remaining_bonus:
        roadmap.append({
            "phase": "Mastery",
            "duration": f"{len(remaining_bonus) * 2}-{len(remaining_bonus) * 3} weeks",
            "skills": remaining_bonus[:4],
            "priority": "optional",
        })

    return roadmap


def compute_skill_synergies(genome: Dict[str, List[str]]) -> Dict:
    """
    Analyze skill synergies — combinations of skills that multiply value.
    Returns synergy pairs found and a total synergy score.
    """
    all_found = set()
    for skills_list in genome.values():
        all_found.update(skills_list)

    found_synergies = []
    total_synergy_points = 0

    for skills_combo, label, points in SYNERGY_PAIRS:
        matched = all(s in all_found for s in skills_combo)
        if matched:
            found_synergies.append({
                "skills": skills_combo,
                "label": label,
                "bonus_points": points,
            })
            total_synergy_points += points

    # Compute synergy score (0-100)
    max_possible = sum(p for _, _, p in SYNERGY_PAIRS)
    synergy_score = min(100, int((total_synergy_points / max(max_possible, 1)) * 100 * 3))

    return {
        "synergy_score": synergy_score,
        "synergies_found": found_synergies,
        "synergy_count": len(found_synergies),
        "total_possible": len(SYNERGY_PAIRS),
        "bonus_points": total_synergy_points,
    }


def compute_market_readiness(genome: Dict[str, List[str]], career_predictions: List[Dict]) -> Dict:
    """
    Compute market readiness — how prepared is the candidate for the job market.
    Considers: skill diversity, trending skills, and career fit.
    """
    all_found = set()
    for skills_list in genome.values():
        all_found.update(skills_list)

    total_skills = len(all_found)

    # Trending/in-demand skills (2024-2025 hot skills)
    trending_skills = [
        "Python", "React", "TypeScript", "Docker", "Kubernetes",
        "AWS", "Machine Learning", "Next.js", "Go", "Rust",
        "GraphQL", "Terraform", "CI/CD", "TensorFlow", "Flutter",
    ]
    trending_found = [s for s in trending_skills if s in all_found]

    # Category coverage (how many different categories)
    categories_covered = len(genome)
    total_categories = len(TECHNICAL_SKILLS) + 2  # +soft +certs

    # Diversity score
    diversity = min(100, int((categories_covered / max(total_categories, 1)) * 100 * 2))

    # Trending score
    trending_score = min(100, int((len(trending_found) / max(len(trending_skills), 1)) * 100))

    # Best career fit score
    best_fit = career_predictions[0]["fit_score"] if career_predictions else 0

    # Overall readiness
    readiness = int(diversity * 0.3 + trending_score * 0.4 + best_fit * 0.3)
    readiness = max(0, min(100, readiness))

    return {
        "readiness_score": readiness,
        "total_skills": total_skills,
        "categories_covered": categories_covered,
        "total_categories": total_categories,
        "diversity_score": diversity,
        "trending_score": trending_score,
        "trending_found": trending_found,
        "trending_missing": [s for s in trending_skills if s not in all_found][:8],
        "best_career_fit": best_fit,
        "grade": _readiness_grade(readiness),
    }


def _readiness_grade(score: int) -> Dict:
    """Assign a letter grade based on readiness score."""
    if score >= 85:
        return {"letter": "A+", "label": "Exceptional", "color": "#10B981"}
    elif score >= 75:
        return {"letter": "A", "label": "Excellent", "color": "#34D399"}
    elif score >= 65:
        return {"letter": "B+", "label": "Very Good", "color": "#60A5FA"}
    elif score >= 55:
        return {"letter": "B", "label": "Good", "color": "#818CF8"}
    elif score >= 45:
        return {"letter": "C+", "label": "Average", "color": "#FBBF24"}
    elif score >= 35:
        return {"letter": "C", "label": "Developing", "color": "#F59E0B"}
    else:
        return {"letter": "D", "label": "Needs Growth", "color": "#EF4444"}


def analyze_career_dna(resume_text: str) -> Dict:
    """
    Main entry point — full Career DNA analysis.
    Returns the complete career intelligence report.
    """
    # Step 1: Extract skill genome
    genome = extract_all_skills(resume_text)

    # Step 2: Compute DNA fingerprint
    dna = compute_skill_dna(genome)

    # Step 3: Predict career paths
    careers = predict_career_paths(genome)

    # Step 4: Analyze synergies
    synergies = compute_skill_synergies(genome)

    # Step 5: Market readiness
    readiness = compute_market_readiness(genome, careers)

    # Step 6: Summary stats
    all_skills = set()
    for skills_list in genome.values():
        all_skills.update(skills_list)

    # Find strongest and weakest categories
    active_segments = [s for s in dna if s["strength"] > 0]
    strongest = max(active_segments, key=lambda x: x["strength"]) if active_segments else None
    weakest_active = min(active_segments, key=lambda x: x["strength"]) if len(active_segments) > 1 else None

    return {
        "genome": genome,
        "dna_fingerprint": dna,
        "career_predictions": careers,
        "synergies": synergies,
        "market_readiness": readiness,
        "summary": {
            "total_skills_found": len(all_skills),
            "categories_active": len([s for s in dna if s["strength"] > 0]),
            "strongest_category": strongest["label"] if strongest else "N/A",
            "strongest_score": strongest["strength"] if strongest else 0,
            "weakest_category": weakest_active["label"] if weakest_active else "N/A",
            "top_career": careers[0]["career"] if careers else "N/A",
            "top_career_fit": careers[0]["fit_score"] if careers else 0,
            "synergy_score": synergies["synergy_score"],
            "readiness_grade": readiness["grade"]["letter"],
        },
    }
