# ResuMatch Pro 🎯

**AI-Powered Resume Screening using NLP & Machine Learning**

> Screen Smarter. Hire Better.

ResuMatch Pro classifies resumes into **25 job categories** using TF-IDF vectorization and KNN classification. Built with **FastAPI** (Python) and **React** (Vite + Tailwind CSS v4).

---

## ✨ Features

- 🧠 **AI Classification** — TF-IDF + KNN classifies resumes into 25 categories
- 📊 **Match Scoring** — Compare resumes against job descriptions with skill matching
- 📋 **ATS Checker** — Applicant Tracking System compatibility analysis
- 📁 **File Support** — Upload PDF, DOCX, or paste text
- 👥 **Bulk Screening** — Screen up to 50 resumes at once with ranked results
- 🔍 **JD Analyzer** — Extract required skills and keywords from job descriptions
- 📈 **Dashboard** — Charts and analytics for screening history
- 🔐 **Auth** — JWT-based user accounts with screening history
- 🎯 **Demo Mode** — Test with pre-built sample data
- ⚡ **Fast** — Sub-second processing time

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Uvicorn |
| ML/NLP | scikit-learn, TF-IDF, KNN, NLTK |
| Frontend | React, Vite, Tailwind CSS v4, Framer Motion |
| Charts | Recharts |
| Database | SQLite + SQLAlchemy |
| Auth | JWT (python-jose) + bcrypt |

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python nlp_pipeline.py          # Train the model
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the frontend proxies API calls to the backend.

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI routes
│   ├── nlp_pipeline.py      # TF-IDF + KNN classifier
│   ├── advanced_nlp.py      # Skills matching, keyword analysis
│   ├── models.py            # SQLAlchemy models
│   ├── auth.py              # JWT authentication
│   ├── schemas.py           # Pydantic schemas
│   ├── utils.py             # PDF/DOCX parsing, quality scoring
│   └── skills_db.py         # 500+ skills database
│
└── frontend/
    └── src/
        ├── pages/           # 12 pages (Landing, Screener, Bulk, etc.)
        ├── components/      # Navbar, ScoreRing, FileUploadZone, etc.
        ├── api/             # Axios client with JWT interceptor
        └── context/         # Auth context
```

## 🧪 NLP Pipeline

```
Resume Text → cleanResume() → TF-IDF(1500 features) → KNN → Category (25 classes)
```

1. **Clean**: Remove URLs, hashtags, mentions, punctuation, non-ASCII
2. **Vectorize**: `TfidfVectorizer(sublinear_tf=True, max_features=1500)`
3. **Classify**: `OneVsRestClassifier(KNeighborsClassifier())`
4. **Evaluate**: 80-20 split, classification_report

## 📝 25 Job Categories

Advocate · Arts · Automation Testing · Blockchain · Business Analyst · Civil Engineer · Data Science · Database · DevOps Engineer · DotNet Developer · ETL Developer · Electrical Engineering · HR · Hadoop · Health and Fitness · Java Developer · Mechanical Engineer · Network Security Engineer · Operations Manager · PMO · Python Developer · SAP Developer · Sales · Testing · Web Designing

## 📄 License

MIT — Built for CS Engineering Final Project
