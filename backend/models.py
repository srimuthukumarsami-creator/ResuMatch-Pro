"""SQLAlchemy database models for ResuMatch Pro."""

import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from pathlib import Path

DB_PATH = Path(__file__).parent / "resumatch.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    role = Column(String(50), default="recruiter")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    screenings = relationship("ScreeningResult", back_populates="user")


class ScreeningResult(Base):
    __tablename__ = "screening_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    candidate_name = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    match_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    ats_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    resume_text = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", back_populates="screenings")


def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for FastAPI to get DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
