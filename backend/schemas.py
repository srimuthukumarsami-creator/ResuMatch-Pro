"""Pydantic schemas for API request/response validation."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


# ── Auth Schemas ──
class UserRegister(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    company: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Screening Request Schemas ──
class ScreenTextRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    job_description: Optional[str] = None
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    min_experience: Optional[int] = 0

class JDAnalyzeRequest(BaseModel):
    job_description: str = Field(..., min_length=50)

class CompareRequest(BaseModel):
    screening_ids: List[int] = Field(..., min_length=2, max_length=5)


# ── Response Schemas ──
class KeywordInfo(BaseModel):
    keyword: str
    score: float

class CategoryResult(BaseModel):
    category: str
    confidence: float

class SkillsMatch(BaseModel):
    found: List[str] = []
    missing: List[str] = []
    bonus: List[str] = []
    match_percentage: float = 0.0

class EntityInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    skills: List[str] = []
    companies: List[str] = []
    education: List[str] = []
    experience_years: Optional[int] = None

class QualityScore(BaseModel):
    total: float = 0.0
    length: float = 0.0
    contact_info: float = 0.0
    skills_section: float = 0.0
    experience_section: float = 0.0
    education_section: float = 0.0
    action_verbs: float = 0.0
    quantified: float = 0.0

class ATSReport(BaseModel):
    score: float = 0.0
    issues: List[Dict] = []
    tips: List[str] = []

class BiasFlag(BaseModel):
    phrase: str
    category: str
    explanation: str

class ScreeningResponse(BaseModel):
    category: str
    confidence: float
    match_score: float = 0.0
    semantic_score: float = 0.0
    ats_score: float = 0.0
    quality_score: QualityScore = QualityScore()
    entities: EntityInfo = EntityInfo()
    skills_match: SkillsMatch = SkillsMatch()
    top_categories: List[CategoryResult] = []
    top_features: List[KeywordInfo] = []
    recommendations: List[str] = []
    bias_flags: List[BiasFlag] = []
    processing_time_ms: float = 0.0
    cleaned_text: str = ""

class BulkCandidateResult(BaseModel):
    rank: int
    filename: str
    candidate_name: Optional[str] = None
    result: ScreeningResponse

class BulkScreeningResponse(BaseModel):
    candidates: List[BulkCandidateResult] = []
    summary: Dict = {}
    job_description: str = ""

class JDAnalysisResponse(BaseModel):
    required_skills: List[str] = []
    nice_to_have_skills: List[str] = []
    experience_level: str = ""
    category_prediction: str = ""
    keyword_density: List[KeywordInfo] = []
    ats_friendliness: float = 0.0
    suggestions: List[str] = []
    ideal_candidate: Dict = {}

class DashboardResponse(BaseModel):
    total_screened: int = 0
    this_week: int = 0
    average_score: float = 0.0
    top_category: str = ""
    category_distribution: Dict = {}
    score_distribution: Dict = {}
    recent_screenings: List[Dict] = []
    trend_data: List[Dict] = []

class CategoryInfo(BaseModel):
    name: str
    description: str
    typical_skills: List[str]
