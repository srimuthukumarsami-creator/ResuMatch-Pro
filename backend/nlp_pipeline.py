"""
Core NLP Pipeline for Resume Screening — Academic Report Traceability
=====================================================================
This module contains the exact algorithms from the academic report:
  - cleanResume() with regex preprocessing steps
  - TfidfVectorizer(sublinear_tf=True, stop_words='english', max_features=1500)
  - OneVsRestClassifier(KNeighborsClassifier())
  - LabelEncoder for 25 job categories
  - train_test_split with 80-20 ratio
  - metrics.classification_report() for evaluation
"""

import re
import os
import numpy as np
import pandas as pd
from pathlib import Path
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn import metrics

# ── 25 Job Categories from the Academic Report ──
CATEGORIES = [
    "Advocate", "Arts", "Automation Testing", "Blockchain",
    "Business Analyst", "Civil Engineer", "Data Science", "Database",
    "DevOps Engineer", "DotNet Developer", "ETL Developer",
    "Electrical Engineering", "HR", "Hadoop", "Health and Fitness",
    "Java Developer", "Mechanical Engineer", "Network Security Engineer",
    "Operations Manager", "PMO", "Python Developer", "SAP Developer",
    "Sales", "Testing", "Web Designing"
]

CATEGORY_DESCRIPTIONS = {
    "Advocate": {"desc": "Legal professionals", "skills": ["Legal Research", "Contract Law", "Litigation", "Compliance"]},
    "Arts": {"desc": "Creative & design professionals", "skills": ["Adobe Creative Suite", "Illustration", "Typography", "UI Design"]},
    "Automation Testing": {"desc": "QA automation engineers", "skills": ["Selenium", "TestNG", "JUnit", "Cypress", "Appium"]},
    "Blockchain": {"desc": "Blockchain developers", "skills": ["Solidity", "Ethereum", "Smart Contracts", "Web3.js"]},
    "Business Analyst": {"desc": "Business analysis professionals", "skills": ["Requirements Gathering", "JIRA", "SQL", "Tableau"]},
    "Civil Engineer": {"desc": "Civil engineering professionals", "skills": ["AutoCAD", "Structural Analysis", "Project Management"]},
    "Data Science": {"desc": "Data scientists & ML engineers", "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Pandas"]},
    "Database": {"desc": "Database administrators & engineers", "skills": ["SQL", "Oracle", "MongoDB", "PostgreSQL", "MySQL"]},
    "DevOps Engineer": {"desc": "DevOps & cloud engineers", "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"]},
    "DotNet Developer": {"desc": ".NET developers", "skills": ["C#", "ASP.NET", ".NET Core", "SQL Server", "Azure"]},
    "ETL Developer": {"desc": "ETL & data pipeline engineers", "skills": ["Informatica", "SSIS", "SQL", "Data Warehousing"]},
    "Electrical Engineering": {"desc": "Electrical engineers", "skills": ["Circuit Design", "MATLAB", "PLC", "AutoCAD"]},
    "HR": {"desc": "Human resources professionals", "skills": ["Recruitment", "Employee Relations", "HRIS", "Payroll"]},
    "Hadoop": {"desc": "Big data engineers", "skills": ["Hadoop", "Spark", "Hive", "MapReduce", "Scala"]},
    "Health and Fitness": {"desc": "Health & fitness professionals", "skills": ["Nutrition", "Personal Training", "CPR", "Wellness"]},
    "Java Developer": {"desc": "Java developers", "skills": ["Java", "Spring Boot", "Hibernate", "Microservices"]},
    "Mechanical Engineer": {"desc": "Mechanical engineers", "skills": ["SolidWorks", "CAD", "FEA", "Thermodynamics"]},
    "Network Security Engineer": {"desc": "Cybersecurity professionals", "skills": ["Firewalls", "SIEM", "Penetration Testing", "ISO 27001"]},
    "Operations Manager": {"desc": "Operations management", "skills": ["Supply Chain", "Lean Six Sigma", "Budgeting"]},
    "PMO": {"desc": "Project management professionals", "skills": ["PMP", "Agile", "Scrum", "MS Project", "Risk Management"]},
    "Python Developer": {"desc": "Python developers", "skills": ["Python", "Django", "Flask", "REST APIs", "PostgreSQL"]},
    "SAP Developer": {"desc": "SAP consultants & developers", "skills": ["SAP ABAP", "SAP HANA", "SAP Fiori", "SAP S/4HANA"]},
    "Sales": {"desc": "Sales professionals", "skills": ["CRM", "Salesforce", "Negotiation", "Lead Generation"]},
    "Testing": {"desc": "QA & testing professionals", "skills": ["Manual Testing", "Test Cases", "Bug Tracking", "JIRA"]},
    "Web Designing": {"desc": "Web designers & frontend devs", "skills": ["HTML", "CSS", "JavaScript", "React", "Figma"]},
}

MODEL_DIR = Path(__file__).parent / "models"


# ══════════════════════════════════════════════════════════════
# STEP 1: Text Cleaning (Exact regex from academic report)
# ══════════════════════════════════════════════════════════════

def cleanResume(resumeText):
    """
    Clean resume text using regex preprocessing.
    
    Academic Report Reference — These are the EXACT regex steps:
    1. Remove URLs
    2. Remove RT|cc markers
    3. Remove hashtags
    4. Remove mentions
    5. Remove punctuation
    6. Remove non-ASCII characters
    7. Remove extra whitespace
    """
    resumeText = re.sub(r'http\S+\s*', ' ', resumeText)           # Step 1
    resumeText = re.sub(r'RT|cc', ' ', resumeText)                 # Step 2
    resumeText = re.sub(r'#\S+', '', resumeText)                   # Step 3
    resumeText = re.sub(r'@\S+', '  ', resumeText)                # Step 4
    resumeText = re.sub(r'[%s]' % re.escape(
        """!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', resumeText) # Step 5
    resumeText = re.sub(r'[^\x00-\x7f]', r' ', resumeText)        # Step 6
    resumeText = re.sub(r'\s+', ' ', resumeText)                   # Step 7
    return resumeText.strip()


# ══════════════════════════════════════════════════════════════
# STEP 2-4: TF-IDF + KNN Classifier
# ══════════════════════════════════════════════════════════════

class ResumeClassifier:
    """Resume classification using TF-IDF vectorization and KNN."""
    
    def __init__(self):
        self.vectorizer = None
        self.classifier = None
        self.label_encoder = None
        self.is_loaded = False

    def train(self, df=None):
        """Train the TF-IDF + KNN pipeline (from academic report).
        
        Uses multi-source dataset pipeline combining:
        - Hugging Face recruitment datasets
        - Synthetic professional resumes from real hiring patterns
        - LinkedIn-style job description data
        - Original academic templates (fallback)
        """
        if df is None:
            try:
                from dataset_pipeline import build_combined_dataset
                df = build_combined_dataset(use_huggingface=True)
                print(f"[Training] Using multi-source dataset: {len(df)} samples")
            except Exception as e:
                print(f"[Training] Multi-source pipeline failed ({e}), using fallback synthetic data")
                df = generate_synthetic_dataset()
        
        df['cleaned'] = df['Resume'].apply(cleanResume)
        
        # LabelEncoder for 25 categories (from report)
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(df['Category'])
        
        # TF-IDF Vectorization (from report)
        self.vectorizer = TfidfVectorizer(
            sublinear_tf=True,
            stop_words='english',
            max_features=1500
        )
        X = self.vectorizer.fit_transform(df['cleaned'])
        
        # 80-20 train-test split (from report)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # OneVsRestClassifier(KNeighborsClassifier()) — from report
        self.classifier = OneVsRestClassifier(KNeighborsClassifier())
        self.classifier.fit(X_train, y_train)
        
        # Evaluation with classification_report (from report)
        y_pred = self.classifier.predict(X_test)
        report = metrics.classification_report(
            y_test, y_pred,
            target_names=self.label_encoder.classes_,
            output_dict=True
        )
        accuracy = metrics.accuracy_score(y_test, y_pred)
        
        # Save models with joblib
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.vectorizer, MODEL_DIR / "tfidf_vectorizer.pkl")
        joblib.dump(self.classifier, MODEL_DIR / "knn_classifier.pkl")
        joblib.dump(self.label_encoder, MODEL_DIR / "label_encoder.pkl")
        
        self.is_loaded = True
        return {"accuracy": accuracy, "report": report, "samples": len(df)}

    def load(self):
        """Load pre-trained models from disk."""
        try:
            self.vectorizer = joblib.load(MODEL_DIR / "tfidf_vectorizer.pkl")
            self.classifier = joblib.load(MODEL_DIR / "knn_classifier.pkl")
            self.label_encoder = joblib.load(MODEL_DIR / "label_encoder.pkl")
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"Model load failed: {e}. Training new model...")
            return False

    def predict(self, resume_text):
        """Predict job category for resume text."""
        if not self.is_loaded:
            if not self.load():
                self.train()
        
        cleaned = cleanResume(resume_text)
        X = self.vectorizer.transform([cleaned])
        
        prediction = self.classifier.predict(X)[0]
        category = self.label_encoder.inverse_transform([prediction])[0]
        
        # Confidence scores
        try:
            probs = self.classifier.predict_proba(X)[0]
            confidence = float(np.max(probs))
            top_idx = np.argsort(probs)[::-1][:5]
            top_categories = [
                {"category": self.label_encoder.inverse_transform([i])[0],
                 "confidence": round(float(probs[i]) * 100, 1)}
                for i in top_idx
            ]
        except Exception:
            confidence = 1.0
            top_categories = [{"category": category, "confidence": 100.0}]
        
        # Top TF-IDF features
        feat_names = self.vectorizer.get_feature_names_out()
        scores = X.toarray()[0]
        top_fi = np.argsort(scores)[::-1][:15]
        top_features = [
            {"keyword": feat_names[i], "score": round(float(scores[i]), 4)}
            for i in top_fi if scores[i] > 0
        ]
        
        return {
            "category": category,
            "confidence": round(confidence * 100, 1),
            "top_categories": top_categories,
            "top_features": top_features,
            "cleaned_text": cleaned
        }


# ══════════════════════════════════════════════════════════════
# Synthetic Training Data Generator
# ══════════════════════════════════════════════════════════════

def generate_synthetic_dataset():
    """Generate synthetic resume dataset for 25 categories."""
    np.random.seed(42)
    samples = []
    
    templates = {
        "Advocate": [
            "Experienced advocate with expertise in criminal law civil litigation corporate law. Handled cases in High Court Supreme Court. Skills in legal research drafting contracts mediation arbitration compliance regulatory affairs. LLB degree from National Law University. Bar Council member.",
            "Legal professional specializing in intellectual property law patent filing trademark registration. Strong background in contract negotiations dispute resolution corporate governance. Published articles in law journals. Represented clients in complex litigation matters.",
        ],
        "Arts": [
            "Creative professional with expertise in graphic design illustration digital art. Proficient in Adobe Photoshop Illustrator InDesign After Effects. Created branding materials marketing campaigns visual identities for Fortune 500 companies. BFA in Visual Arts.",
            "Art director with 8 years experience in advertising agencies. Skills in typography layout design color theory brand identity. Led creative teams on national campaigns. Portfolio includes print digital and multimedia projects.",
        ],
        "Automation Testing": [
            "Automation test engineer with 5 years experience in Selenium WebDriver TestNG JUnit Cucumber BDD. Proficient in Java Python for test scripting. Experience with CI CD pipelines Jenkins. Created automated test frameworks reducing manual testing by 70 percent.",
            "QA automation specialist skilled in Cypress Appium Robot Framework API testing with Postman RestAssured. Strong knowledge of SDLC Agile Scrum methodologies. Implemented test automation strategies for web and mobile applications.",
        ],
        "Blockchain": [
            "Blockchain developer with expertise in Solidity Ethereum smart contracts DeFi protocols. Built decentralized applications using Web3 js Hardhat Truffle. Experience with NFT marketplaces token standards ERC20 ERC721. Knowledge of consensus mechanisms cryptography.",
            "Full stack blockchain engineer proficient in Hyperledger Fabric Solana Rust. Developed cross chain bridges and DeFi lending protocols. Smart contract auditing and security analysis. Published research on blockchain scalability solutions.",
        ],
        "Business Analyst": [
            "Business analyst with 6 years experience in requirements gathering process modeling stakeholder management. Proficient in SQL Tableau JIRA Confluence. Created business requirement documents functional specifications user stories. MBA with concentration in Information Systems.",
            "Senior business analyst specializing in data analytics process improvement digital transformation. Skills in Power BI Excel VBA Visio wireframing. Led cross functional teams in ERP implementation projects. Six Sigma Green Belt certified.",
        ],
        "Civil Engineer": [
            "Civil engineer with expertise in structural design construction management project planning. Proficient in AutoCAD Revit STAAD Pro ETABS. Managed infrastructure projects including bridges highways buildings. Professional Engineer PE license holder.",
            "Senior civil engineer specializing in geotechnical engineering foundation design soil mechanics. Experience with environmental impact assessments site investigations. Managed construction budgets exceeding 50 million dollars.",
        ],
        "Data Science": [
            "Data scientist with 5 years experience in machine learning deep learning NLP computer vision. Proficient in Python TensorFlow PyTorch scikit learn Pandas NumPy. Built recommendation systems predictive models time series forecasting. PhD in Statistics.",
            "Senior data scientist specializing in natural language processing sentiment analysis text classification. Experience with transformers BERT GPT models. Strong background in statistical modeling A B testing experimental design. Published research in top ML conferences.",
        ],
        "Database": [
            "Database administrator with expertise in Oracle PostgreSQL MySQL MongoDB SQL Server. Managed enterprise databases with 99.99 percent uptime. Skills in database design optimization backup recovery replication. Performance tuning reducing query times by 80 percent.",
            "Senior DBA specializing in cloud databases AWS RDS Azure SQL Google Cloud SQL. Experience with database migration sharding partitioning. Implemented data governance policies security protocols encryption.",
        ],
        "DevOps Engineer": [
            "DevOps engineer with expertise in Docker Kubernetes AWS Azure Terraform Ansible. Built CI CD pipelines using Jenkins GitLab CI GitHub Actions. Infrastructure as code monitoring with Prometheus Grafana. Reduced deployment time from hours to minutes.",
            "Senior DevOps specialist proficient in cloud architecture microservices container orchestration. Experience with EKS ECS Lambda serverless. Implemented site reliability engineering practices achieving 99.99 percent availability.",
        ],
        "DotNet Developer": [
            "DotNet developer with 7 years experience in C Sharp ASP NET MVC Web API Entity Framework. Built enterprise applications using NET Core microservices architecture. Proficient in SQL Server Azure DevOps. Experience with Angular React frontend integration.",
            "Senior NET developer specializing in cloud native applications Azure Functions Service Bus. Experience with Blazor MAUI cross platform development. Implemented CQRS event sourcing patterns. Microsoft Certified Azure Developer.",
        ],
        "ETL Developer": [
            "ETL developer with expertise in Informatica PowerCenter SSIS Talend data warehousing. Built data pipelines processing millions of records daily. Proficient in SQL PL SQL stored procedures. Experience with dimensional modeling star schema design.",
            "Senior ETL engineer specializing in cloud based data pipelines AWS Glue Azure Data Factory. Experience with Apache Airflow Spark streaming real time data processing. Implemented data quality frameworks validation rules.",
        ],
        "Electrical Engineering": [
            "Electrical engineer with expertise in power systems circuit design control systems PLC programming. Proficient in MATLAB Simulink AutoCAD Electrical. Designed high voltage transmission systems renewable energy installations. Professional Engineer license.",
            "Senior electrical engineer specializing in embedded systems PCB design FPGA VHDL Verilog. Experience with IoT sensor networks wireless communication protocols. Led product development teams from concept to production.",
        ],
        "HR": [
            "HR professional with 8 years experience in talent acquisition employee engagement performance management. Proficient in SAP SuccessFactors Workday BambooHR. Managed recruitment for organizations with 5000 plus employees. SHRM certified.",
            "Human resources manager specializing in compensation benefits organizational development training. Experience with HRIS implementation employee relations labor law compliance. Reduced employee turnover by 35 percent.",
        ],
        "Hadoop": [
            "Big data engineer with expertise in Hadoop ecosystem HDFS MapReduce Hive Pig Sqoop. Built data lake architectures processing petabytes of data. Proficient in Spark Scala Python. Experience with Kafka Flume real time streaming.",
            "Senior Hadoop developer specializing in HBase Impala Oozie workflow management. Built distributed computing solutions on AWS EMR Azure HDInsight. Experience with data governance metadata management Apache Atlas.",
        ],
        "Health and Fitness": [
            "Certified personal trainer with expertise in strength training nutrition planning wellness coaching. NASM ACE certified. Developed fitness programs for 500 plus clients. Experience in corporate wellness program management health education.",
            "Health and fitness professional specializing in sports science rehabilitation exercise physiology. CPR AED first aid certified. Created wellness curriculum for community health centers. Published research on exercise and mental health.",
        ],
        "Java Developer": [
            "Java developer with 6 years experience in Spring Boot Spring MVC Hibernate microservices REST APIs. Built scalable enterprise applications using Java 17 Maven Gradle. Experience with Apache Kafka RabbitMQ messaging. AWS certified developer.",
            "Senior Java engineer specializing in distributed systems high performance computing. Experience with JPA Criteria API QueryDSL. Built payment processing systems handling millions of transactions. Knowledge of design patterns SOLID principles.",
        ],
        "Mechanical Engineer": [
            "Mechanical engineer with expertise in product design manufacturing processes CAD CAM. Proficient in SolidWorks CATIA Ansys FEA CFD analysis. Designed automotive components aerospace systems. Professional Engineer license.",
            "Senior mechanical engineer specializing in thermal systems HVAC design energy efficiency. Experience with 3D printing rapid prototyping GD T. Led cross functional teams in new product development. Six Sigma Black Belt.",
        ],
        "Network Security Engineer": [
            "Network security engineer with expertise in firewall configuration intrusion detection SIEM. Proficient in Cisco Palo Alto Fortinet security appliances. Conducted penetration testing vulnerability assessments. CISSP CEH certified.",
            "Senior cybersecurity professional specializing in incident response threat hunting SOC operations. Experience with NIST ISO 27001 compliance frameworks. Implemented zero trust architecture reducing security incidents by 60 percent.",
        ],
        "Operations Manager": [
            "Operations manager with 10 years experience in supply chain logistics inventory management. Implemented lean manufacturing Six Sigma methodologies. Managed teams of 50 plus employees. Reduced operational costs by 25 percent through process optimization.",
            "Senior operations director specializing in business process improvement quality assurance. Experience with ERP systems SAP Oracle. Led digital transformation initiatives across multiple facilities. MBA from top business school.",
        ],
        "PMO": [
            "Project management professional with PMP Agile Scrum certifications. Managed portfolio of 20 plus projects with budgets exceeding 10 million. Proficient in MS Project Primavera JIRA Confluence. Experience in risk management stakeholder communication.",
            "Senior PMO director specializing in program management governance frameworks. Implemented PMO best practices across enterprise. Experience with waterfall agile hybrid methodologies. Led organizational change management initiatives.",
        ],
        "Python Developer": [
            "Python developer with 5 years experience in Django Flask FastAPI REST API development. Built scalable web applications microservices. Proficient in PostgreSQL Redis Celery. Experience with Docker containerization AWS deployment.",
            "Senior Python engineer specializing in data engineering automation scripting. Experience with asyncio aiohttp high performance applications. Built ML pipeline orchestration systems. Contributor to open source Python projects.",
        ],
        "SAP Developer": [
            "SAP developer with expertise in ABAP SAP HANA SAP Fiori S4HANA. Configured SAP modules MM SD FI CO PP. Experience with SAP integration technologies RFC BAPI IDoc. SAP certified application associate.",
            "Senior SAP consultant specializing in SAP BW BI analytics reporting. Experience with SAP Cloud Platform integration suite. Led SAP migration projects from ECC to S4HANA. Trained end users on SAP processes.",
        ],
        "Sales": [
            "Sales professional with 8 years experience in B2B SaaS enterprise sales. Exceeded quota by 150 percent consistently. Proficient in Salesforce HubSpot CRM. Skills in negotiation presentation client relationship management pipeline management.",
            "Senior sales manager specializing in strategic partnerships channel sales business development. Built and led high performing sales teams. Experience with account based marketing territory planning. Generated over 20 million in annual revenue.",
        ],
        "Testing": [
            "QA engineer with 5 years experience in manual testing test case design bug tracking. Proficient in JIRA Bugzilla TestRail. Experience with functional regression integration UAT testing. ISTQB certified tester.",
            "Senior test analyst specializing in performance testing load testing security testing. Experience with JMeter LoadRunner OWASP tools. Created test strategies and plans for enterprise applications. Led QA teams across multiple projects.",
        ],
        "Web Designing": [
            "Web designer with expertise in HTML5 CSS3 JavaScript responsive design. Proficient in React Vue Angular frontend frameworks. Skills in Figma Sketch Adobe XD UI UX design. Built websites for 100 plus clients.",
            "Senior frontend developer specializing in modern web technologies TypeScript Next js Tailwind CSS. Experience with accessibility WCAG standards performance optimization. Created design systems component libraries for enterprise applications.",
        ],
    }
    
    # Generate 20 samples per category
    for category, texts in templates.items():
        for i in range(20):
            base = texts[i % len(texts)]
            # Add slight variation
            words = base.split()
            if i > 1:
                np.random.shuffle(words)
                base = ' '.join(words[:int(len(words)*0.9)])
            samples.append({"Category": category, "Resume": base})
    
    return pd.DataFrame(samples)


# ── Singleton classifier instance ──
classifier = ResumeClassifier()


if __name__ == "__main__":
    print("Training Resume Classifier...")
    result = classifier.train()
    print(f"Accuracy: {result['accuracy']:.2%}")
    print(f"Samples: {result['samples']}")
    print("Models saved to:", MODEL_DIR)
    
    # Test prediction
    test = "Python developer with Django Flask REST API PostgreSQL Docker experience"
    pred = classifier.predict(test)
    print(f"\nTest: '{test}'")
    print(f"Predicted: {pred['category']} ({pred['confidence']}%)")
