export const DEMO_RESUME = `John Smith
john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | github.com/jsmith

SUMMARY
Experienced Data Scientist with 5 years of expertise in machine learning, deep learning, and statistical analysis. Proficient in Python, TensorFlow, PyTorch, and scikit-learn. Built recommendation systems and predictive models that increased revenue by 25%.

EXPERIENCE
Senior Data Scientist | TechCorp Inc. | Jan 2021 - Present
- Built ML pipeline processing 10M records daily using Python and Spark
- Developed NLP sentiment analysis model achieving 92% accuracy
- Led team of 4 data scientists on recommendation engine project
- Reduced customer churn by 18% through predictive modeling
- Increased revenue by $2M annually via personalized recommendations

Data Scientist | DataWorks LLC | Jun 2019 - Dec 2021
- Created time series forecasting models for inventory optimization
- Implemented A/B testing framework used across 50+ experiments
- Built dashboards in Tableau for executive decision-making
- Achieved 35% improvement in forecast accuracy

EDUCATION
M.S. Computer Science | Stanford University | 2019
B.S. Statistics | UC Berkeley | 2017

SKILLS
Python, Machine Learning, TensorFlow, PyTorch, SQL, Pandas, NumPy, NLP, Deep Learning, scikit-learn, Spark, Tableau, R, Docker, AWS, Git

CERTIFICATIONS
AWS Machine Learning Specialty | Google Professional Data Engineer`;

export const DEMO_JD = `We are looking for a Senior Data Scientist to join our growing AI team.

Required Skills:
- Python, Machine Learning, TensorFlow, SQL, Pandas
- Experience with NLP and deep learning
- Strong statistical analysis background
- 3+ years of experience
- Communication and teamwork skills

Nice to Have:
- Spark, Kubernetes, Scala
- Cloud certifications (AWS/GCP)
- Published research`;

export const DEMO_RESULT = {
  category: "Data Science",
  confidence: 94.2,
  match_score: 78,
  composite: {
    composite_score: 78,
    breakdown: { content: 82, skills: 75, format: 80, sections: 85, style: 90 },
    weights: { content: 25, skills: 30, format: 20, sections: 15, style: 10 },
    radar_data: [
      { axis: "Content", score: 82 },
      { axis: "Skills", score: 75 },
      { axis: "Format", score: 80 },
      { axis: "Sections", score: 85 },
      { axis: "Style", score: 90 },
    ],
  },
  content_score: {
    score: 82,
    word_count: 280,
    quantified_count: 6,
    action_verb_count: 8,
    details: {
      measurable_results: { pass: true, count: 6, message: "Found 6 quantified achievements" },
      word_count_check: { pass: true, count: 280, message: "280 words — within recommended range" },
    },
  },
  skills_score: {
    score: 75,
    match_percentage: 75,
    hard_found: 5, hard_total: 6,
    soft_found: 2, soft_total: 2,
    missing_hard: ["Kubernetes"],
    missing_soft: [],
    hard_skills: [
      { skill: "Python", found: true, resume_freq: 3 },
      { skill: "Machine Learning", found: true, resume_freq: 2 },
      { skill: "TensorFlow", found: true, resume_freq: 2 },
      { skill: "SQL", found: true, resume_freq: 1 },
      { skill: "Pandas", found: true, resume_freq: 1 },
      { skill: "NLP", found: true, resume_freq: 2 },
    ],
    soft_skills: [
      { skill: "Communication", found: true, resume_freq: 0 },
      { skill: "Teamwork", found: true, resume_freq: 0 },
    ],
    nice_to_have: [
      { skill: "Spark", found: true },
      { skill: "Kubernetes", found: false },
      { skill: "Scala", found: false },
    ],
  },
  format_score: {
    score: 80,
    date_formatting: { pass: true, dates_found: 4, message: "Found 4 properly formatted dates" },
    resume_length: { pass: true, word_count: 280, message: "280 words — within recommended range" },
    bullet_points: { pass: true, count: 9, message: "Found 9 bullet-point lines" },
  },
  sections_score: {
    score: 85,
    overall_pass: true,
    present_count: 9,
    total_count: 10,
    message: "9/10 sections present — all core sections found",
    sections: {
      name: { present: true, value: "John Smith" },
      email: { present: true, value: "john.smith@email.com" },
      phone: { present: true, value: "(555) 123-4567" },
      portfolio: { present: true, value: "github.com/jsmith" },
      summary: { present: true, value: "Detected" },
      experience: { present: true, value: "Detected" },
      education: { present: true, value: "Detected" },
      skills: { present: true, value: "Detected" },
      certifications: { present: true, value: "Detected" },
      projects: { present: false, value: "Not found" },
    },
  },
  style_score: {
    score: 90,
    voice: { tone: "professional", description: "Clear, results-oriented professional tone", pass: true },
    buzzwords: { pass: true, found: [], count: 0, message: "No clichés detected" },
  },
  ats_score: 82,
  quality_score: { total: 74 },
  entities: {
    name: "John Smith", email: "john.smith@email.com", phone: "(555) 123-4567",
    linkedin: "linkedin.com/in/johnsmith", github: "github.com/jsmith",
    skills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "SQL", "Pandas", "NumPy", "NLP", "Deep Learning", "scikit-learn", "Spark", "Tableau", "R", "Docker", "AWS", "Git"],
  },
  jd_parsed: {
    job_title: "Senior Data Scientist",
    experience_level: "Senior",
    required_hard_skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Pandas", "NLP"],
    required_soft_skills: ["Communication", "Teamwork"],
    nice_to_have_skills: ["Spark", "Kubernetes", "Scala"],
    ai_powered: true,
  },
  top_categories: [
    { category: "Data Science", confidence: 94.2 },
    { category: "Python Developer", confidence: 3.1 },
  ],
  top_features: [
    { keyword: "machine", score: 0.412 }, { keyword: "learning", score: 0.398 },
    { keyword: "python", score: 0.356 }, { keyword: "data", score: 0.321 },
    { keyword: "model", score: 0.287 }, { keyword: "tensorflow", score: 0.245 },
    { keyword: "analysis", score: 0.198 },
  ],
  recommendations: [
    "Add Kubernetes experience or certification to match JD requirement",
    "Include a Projects section to showcase personal or research work",
    "Expand cloud certifications section",
  ],
  bias_flags: [],
  processing_time_ms: 42.3,
  cleaned_text: "John Smith john smith email com 555 123 4567 linkedin com in johnsmith github com jsmith SUMMARY Experienced Data Scientist with 5 years of expertise...",
};
