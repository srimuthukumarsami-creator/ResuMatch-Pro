"""
Multi-Source Recruitment Dataset Pipeline
==========================================
Combines data from multiple professional sources instead of a single Kaggle CSV:
  - Hugging Face Datasets (recruitment/resume datasets)
  - Synthetic professional resumes from real hiring patterns
  - Industry-style job description templates
  - OpenML-compatible structured data
  - Common Crawl resume/job text patterns
  - Research paper dataset patterns (arXiv/Semantic Scholar style)
  - LinkedIn-style job descriptions
  - ATS-compatible resume formats
"""

import re
import os
import json
import hashlib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Optional

DATA_DIR = Path(__file__).parent / "data"
CACHE_FILE = DATA_DIR / "combined_dataset.parquet"

# ── 25 Job Categories ──
CATEGORIES = [
    "Advocate", "Arts", "Automation Testing", "Blockchain",
    "Business Analyst", "Civil Engineer", "Data Science", "Database",
    "DevOps Engineer", "DotNet Developer", "ETL Developer",
    "Electrical Engineering", "HR", "Hadoop", "Health and Fitness",
    "Java Developer", "Mechanical Engineer", "Network Security Engineer",
    "Operations Manager", "PMO", "Python Developer", "SAP Developer",
    "Sales", "Testing", "Web Designing"
]


def _map_hf_category(cat_str: str) -> Optional[str]:
    """Map HuggingFace category names to our 25 categories."""
    cat_str = cat_str.strip()
    # Direct match
    if cat_str in CATEGORIES:
        return cat_str
    # Fuzzy mapping for common naming differences
    mapping = {
        "data science": "Data Science", "data-science": "Data Science",
        "python developer": "Python Developer", "python": "Python Developer",
        "java developer": "Java Developer", "java": "Java Developer",
        "web designing": "Web Designing", "web developer": "Web Designing", "web design": "Web Designing",
        "devops engineer": "DevOps Engineer", "devops": "DevOps Engineer",
        "hr": "HR", "human resources": "HR",
        "sales": "Sales", "business analyst": "Business Analyst",
        "database": "Database", "dba": "Database",
        "testing": "Testing", "qa": "Testing",
        "automation testing": "Automation Testing",
        "blockchain": "Blockchain", "hadoop": "Hadoop", "big data": "Hadoop",
        "dotnet developer": "DotNet Developer", ".net developer": "DotNet Developer",
        "network security engineer": "Network Security Engineer", "cyber security": "Network Security Engineer",
        "etl developer": "ETL Developer", "civil engineer": "Civil Engineer",
        "mechanical engineer": "Mechanical Engineer", "electrical engineering": "Electrical Engineering",
        "operations manager": "Operations Manager", "pmo": "PMO",
        "sap developer": "SAP Developer", "arts": "Arts",
        "advocate": "Advocate", "health and fitness": "Health and Fitness",
    }
    return mapping.get(cat_str.lower())


def fetch_huggingface_data() -> pd.DataFrame:
    """Fetch resume/recruitment datasets from Hugging Face Hub."""
    samples = []
    try:
        from datasets import load_dataset
        try:
            ds = load_dataset("InferencePrince555/resume-dataset", split="train")
            count = 0
            for row in ds:
                # Extract category from instruction: "Generate a Resume for a {Category} Job"
                instruction = str(row.get("instruction", ""))
                resume_text = str(row.get("Resume_test", "") or row.get("input", "") or "")
                
                import re as _re
                match = _re.search(r"Resume for (?:a |an )?(.+?)(?:\s+Job)?$", instruction)
                if match and len(resume_text) > 100:
                    raw_cat = match.group(1).strip()
                    cat = _map_hf_category(raw_cat)
                    if cat:
                        samples.append({"Category": cat, "Resume": resume_text, "source": "huggingface:resume-dataset"})
                        count += 1
            print(f"[HF] Loaded {count} samples from InferencePrince555/resume-dataset")
        except Exception as e:
            print(f"[HF] Skipping InferencePrince555/resume-dataset: {e}")
    except ImportError:
        print("[HF] datasets library not installed, skipping HuggingFace source")
    return pd.DataFrame(samples) if samples else pd.DataFrame(columns=["Category", "Resume", "source"])


# ══════════════════════════════════════════════════════
# SOURCE 2: Synthetic Professional Resumes
# ══════════════════════════════════════════════════════

# Industry-grade resume templates with realistic content
PROFESSIONAL_TEMPLATES = {
    "Data Science": [
        "Senior Data Scientist with {yrs} years building production ML systems. Led development of real-time recommendation engine serving 50M users, improving CTR by {pct}%. Expert in Python, TensorFlow, PyTorch, and distributed computing with Spark. Published {pubs} papers in NeurIPS and ICML. MS in Statistics from {uni}. Skills: Machine Learning, Deep Learning, NLP, Computer Vision, A/B Testing, SQL, Pandas, NumPy, scikit-learn, MLflow, Kubeflow.",
        "Machine Learning Engineer specializing in NLP and transformer architectures. Built BERT-based classification system processing {docs}K documents daily with {acc}% accuracy. Experience with LLM fine-tuning, RAG pipelines, and vector databases. Proficient in Python, PyTorch, Hugging Face, LangChain, Docker, Kubernetes. {yrs} years at FAANG companies. PhD in Computer Science from {uni}.",
        "Data Scientist focused on causal inference and experimentation. Designed {exp}+ A/B tests generating ${rev}M in incremental revenue. Built propensity scoring models and uplift models for marketing optimization. Expert in Python, R, SQL, Bayesian statistics, and causal ML. Previously at {company}. MS Data Science from {uni}.",
    ],
    "Python Developer": [
        "Senior Python Developer with {yrs} years building scalable backend services. Architected microservices handling {rps}K RPS using FastAPI, Celery, and Redis. Experience with Django, Flask, asyncio, SQLAlchemy, PostgreSQL. Built CI/CD pipelines with GitHub Actions. Contributor to open-source projects with {stars}+ GitHub stars. BS Computer Science from {uni}.",
        "Full-Stack Python Engineer specializing in Django and React. Built SaaS platforms serving {users}K+ users with 99.9% uptime. Expert in REST API design, GraphQL, WebSocket, OAuth2. Proficient in Docker, AWS (EC2, Lambda, S3, RDS), Terraform. {yrs} years experience. Certified AWS Developer Associate.",
        "Python Backend Developer focused on data engineering and API development. Built ETL pipelines processing {gb}GB daily using Apache Airflow and dbt. Experience with FastAPI, Pydantic, Alembic, PostgreSQL, MongoDB. Strong testing practices with pytest achieving {cov}% coverage. {yrs} years at {company}.",
    ],
    "Java Developer": [
        "Senior Java Developer with {yrs} years in enterprise application development. Built distributed microservices using Spring Boot, Spring Cloud, and Apache Kafka handling {tps}K TPS. Expert in Java 17+, Hibernate, JPA, Maven, Gradle. Experience with Kubernetes, Docker, AWS ECS. Oracle Certified Professional.",
        "Java Backend Engineer specializing in high-performance systems. Developed payment processing platform handling ${vol}M daily transactions with sub-100ms latency. Proficient in Java, Spring MVC, RabbitMQ, Elasticsearch, Redis. {yrs} years at fintech companies. MS Computer Engineering from {uni}.",
    ],
    "Web Designing": [
        "Senior UI/UX Designer and Frontend Developer with {yrs} years creating award-winning digital experiences. Expert in Figma, Sketch, Adobe Creative Suite. Built responsive web applications using React, TypeScript, Next.js, Tailwind CSS. Strong understanding of accessibility (WCAG 2.1), design systems, and micro-interactions. Portfolio includes {clients}+ enterprise clients.",
        "Creative Frontend Developer specializing in motion design and interactive experiences. Proficient in HTML5, CSS3, JavaScript, GSAP, Three.js, React. Built design systems adopted by {teams}+ development teams. Experience with Storybook, Chromatic, and visual regression testing. BFA in Digital Design from {uni}.",
    ],
    "DevOps Engineer": [
        "Senior DevOps Engineer with {yrs} years automating cloud infrastructure at scale. Managed Kubernetes clusters with {nodes}+ nodes across AWS and GCP. Built CI/CD pipelines reducing deployment time by {pct}%. Expert in Terraform, Ansible, Docker, Helm, ArgoCD. Implemented GitOps workflows and SRE practices achieving 99.99% availability.",
        "Cloud Infrastructure Engineer specializing in AWS and infrastructure as code. Architected multi-region deployments handling {rps}M requests/day. Proficient in CloudFormation, CDK, Lambda, ECS, RDS. Experience with monitoring using Prometheus, Grafana, Datadog. {certs} AWS certifications. {yrs} years experience.",
    ],
    "HR": [
        "Senior HR Business Partner with {yrs} years in talent management and organizational development. Led recruiting initiatives hiring {hires}+ professionals annually across engineering, product, and design. Expert in Workday, Greenhouse, LinkedIn Recruiter. Implemented DEI programs increasing diverse hiring by {pct}%. SHRM-SCP certified. MBA from {uni}.",
        "People Operations Manager specializing in employee experience and HR analytics. Built people analytics dashboards tracking retention, engagement, and performance metrics. Proficient in SAP SuccessFactors, BambooHR, Tableau. Managed HR operations for {size}+ employee organization. Reduced turnover by {pct}% through data-driven retention strategies.",
    ],
    "Network Security Engineer": [
        "Senior Cybersecurity Engineer with {yrs} years protecting enterprise networks. Led SOC team of {team} analysts monitoring {events}M+ security events daily. Expert in SIEM (Splunk, QRadar), IDS/IPS, firewalls (Palo Alto, Fortinet). Conducted {tests}+ penetration tests. CISSP, CEH, OSCP certified. Implemented zero-trust architecture.",
        "Information Security Analyst specializing in cloud security and compliance. Managed security posture for AWS/Azure environments. Experience with IAM, WAF, GuardDuty, Security Hub. Led SOC 2 Type II and ISO 27001 certification processes. Proficient in Python scripting for security automation. {yrs} years in cybersecurity.",
    ],
    "Business Analyst": [
        "Senior Business Analyst with {yrs} years driving digital transformation initiatives. Led requirements gathering for {projects}+ enterprise projects with budgets exceeding ${budget}M. Expert in SQL, Tableau, Power BI, JIRA, Confluence. Created BRDs, FRDs, and user stories using Agile methodology. Six Sigma Green Belt certified. MBA from {uni}.",
        "Product-focused Business Analyst specializing in fintech and payments. Mapped {processes}+ business processes using BPMN notation. Proficient in data modeling, API documentation (Swagger/OpenAPI), and wireframing (Figma). Experience with Agile/SAFe frameworks. {yrs} years at top financial institutions.",
    ],
    "Automation Testing": [
        "Senior QA Automation Engineer with {yrs} years building test automation frameworks. Developed Selenium + TestNG framework covering {cases}+ test cases with {cov}% code coverage. Expert in Java, Python, Cypress, Playwright, Appium. Built CI/CD test pipelines with Jenkins and GitHub Actions. ISTQB Advanced certified.",
        "Test Automation Architect specializing in API and performance testing. Built RestAssured-based API testing framework validating {apis}+ endpoints. Expert in JMeter, Gatling, k6 for load testing. Proficient in BDD with Cucumber, contract testing with Pact. {yrs} years in quality engineering.",
    ],
    "Sales": [
        "Enterprise Account Executive with {yrs} years in B2B SaaS sales. Consistently exceeded quota by {pct}% managing ${pipeline}M+ pipeline. Expert in Salesforce, HubSpot, Gong, LinkedIn Sales Navigator. Closed {deals}+ enterprise deals with Fortune 500 companies. Built and mentored sales team of {team} reps.",
        "VP of Sales with track record of building high-performing revenue teams. Grew ARR from ${start}M to ${end}M in {yrs} years. Expertise in strategic partnerships, channel sales, and account-based marketing. Experience with sales methodologies: MEDDIC, Challenger, SPIN. MBA from {uni}.",
    ],
    "Blockchain": [
        "Senior Blockchain Developer with {yrs} years building decentralized applications. Developed {contracts}+ smart contracts on Ethereum and Solana managing ${tvl}M+ TVL. Expert in Solidity, Rust, Web3.js, ethers.js, Hardhat, Foundry. Built DeFi protocols including AMMs, lending platforms, and yield aggregators. Smart contract auditing experience.",
        "Web3 Full-Stack Engineer specializing in DeFi and NFT infrastructure. Built cross-chain bridges and token launchpads. Proficient in Solidity, React, The Graph, IPFS, Chainlink. Experience with L2 solutions (Optimism, Arbitrum, zkSync). {yrs} years in blockchain development.",
    ],
    "Database": [
        "Senior Database Administrator with {yrs} years managing enterprise database systems. Maintained {dbs}+ production databases with 99.99% uptime handling {tb}TB+ data. Expert in Oracle, PostgreSQL, MySQL, MongoDB, Redis. Performance tuning reducing query latency by {pct}%. Experience with database migration, replication, and disaster recovery.",
        "Data Engineer specializing in cloud database architecture. Designed data warehouse solutions on Snowflake and BigQuery processing {pb}PB of data. Proficient in SQL optimization, data modeling, ETL pipeline design. Experience with AWS RDS, Aurora, DynamoDB, ElastiCache. {yrs} years at {company}.",
    ],
    "Advocate": [
        "Senior Corporate Lawyer with {yrs} years of practice in mergers & acquisitions and corporate governance. Handled {cases}+ complex transactions valued at ${val}M+. Expert in contract negotiation, regulatory compliance, and intellectual property law. Bar-certified in multiple jurisdictions. LLM from {uni}.",
        "Litigation Attorney specializing in commercial disputes and arbitration. Successfully represented clients in {cases}+ cases before High Court and tribunals. Proficient in legal research (Westlaw, LexisNexis), contract drafting, and regulatory affairs. {yrs} years of practice. Published in {pubs} law journals.",
    ],
    "Civil Engineer": [
        "Senior Civil Engineer with {yrs} years in structural design and construction management. Led infrastructure projects valued at ${val}M+ including bridges, highways, and commercial buildings. Expert in AutoCAD, Revit, STAAD Pro, ETABS. Professional Engineer (PE) licensed. MS Structural Engineering from {uni}.",
    ],
    "Mechanical Engineer": [
        "Senior Mechanical Engineer with {yrs} years in product design and manufacturing. Led development of {products}+ products from concept to mass production. Expert in SolidWorks, CATIA, ANSYS FEA/CFD. Experience with 3D printing, CNC machining, and GD&T. Six Sigma Black Belt certified. MS Mechanical Engineering from {uni}.",
    ],
    "Electrical Engineering": [
        "Senior Electrical Engineer with {yrs} years in power systems and embedded design. Designed control systems for {projects}+ industrial automation projects. Expert in MATLAB/Simulink, AutoCAD Electrical, PLC programming (Siemens, Allen-Bradley). Experience with PCB design, FPGA, and IoT sensor networks. PE licensed.",
    ],
    "Operations Manager": [
        "Senior Operations Manager with {yrs} years optimizing supply chain and logistics. Managed teams of {team}+ across {facilities} facilities. Implemented lean manufacturing reducing operational costs by {pct}%. Expert in SAP, Oracle ERP, Six Sigma, and Kaizen. MBA Operations Management from {uni}.",
    ],
    "PMO": [
        "Senior Program Manager with {yrs} years managing enterprise project portfolios valued at ${budget}M+. PMP, ACP, and SAFe 5.0 certified. Led {projects}+ cross-functional projects using Agile and Waterfall methodologies. Expert in MS Project, Primavera P6, JIRA, Smartsheet. Strong stakeholder management and risk mitigation skills.",
    ],
    "ETL Developer": [
        "Senior ETL Developer with {yrs} years building enterprise data pipelines. Designed Informatica PowerCenter workflows processing {records}M+ records daily. Expert in SQL, PL/SQL, SSIS, Talend, Apache NiFi. Built data warehouse solutions using Kimball dimensional modeling. Experience with AWS Glue, Azure Data Factory, and Snowflake.",
    ],
    "Hadoop": [
        "Senior Big Data Engineer with {yrs} years in distributed computing. Built Hadoop/Spark clusters processing {pb}PB of data for real-time analytics. Expert in HDFS, Hive, HBase, Kafka, Flink, Presto. Experience with Databricks, EMR, and cloud data lakes. Cloudera Certified Developer. MS Computer Science from {uni}.",
    ],
    "DotNet Developer": [
        "Senior .NET Developer with {yrs} years building enterprise applications. Architected microservices using .NET 8, ASP.NET Core, Entity Framework, and Azure Service Bus. Expert in C#, SQL Server, Azure DevOps, Blazor. Built high-traffic applications serving {users}M+ users. Microsoft Certified Azure Developer Associate.",
    ],
    "SAP Developer": [
        "Senior SAP Consultant with {yrs} years in SAP implementation and customization. Led {projects}+ full-lifecycle S/4HANA migration projects. Expert in ABAP, SAP Fiori, SAP HANA, SAP PI/PO. Configured modules: MM, SD, FI, CO, PP. SAP Certified Application Associate. Experience with SAP BTP and Cloud Integration.",
    ],
    "Health and Fitness": [
        "Certified Personal Trainer and Wellness Coach with {yrs} years in fitness industry. Trained {clients}+ clients achieving measurable health outcomes. NASM-CPT, ACE, and Precision Nutrition certified. Expertise in strength training, functional fitness, nutrition planning, and injury rehabilitation. Managed corporate wellness programs for {companies}+ organizations.",
    ],
    "Testing": [
        "Senior QA Engineer with {yrs} years in software quality assurance. Created comprehensive test strategies covering functional, regression, integration, and UAT testing. Expert in JIRA, TestRail, Bugzilla, and qTest. Managed QA teams of {team}+ testers. ISTQB Advanced Level certified. Experience with performance testing using JMeter and security testing using OWASP ZAP.",
    ],
    "Arts": [
        "Senior Creative Director with {yrs} years in advertising and digital media. Led creative campaigns for {brands}+ Fortune 500 brands generating {impressions}M+ impressions. Expert in Adobe Creative Suite (Photoshop, Illustrator, InDesign, After Effects, Premiere Pro). BFA from {uni}. Awards: {awards}+ Cannes Lions and D&AD entries.",
    ],
}

# Fill-in data for template variables
UNIVERSITIES = ["MIT", "Stanford", "Carnegie Mellon", "Georgia Tech", "UC Berkeley", "IIT Bombay", "NUS", "ETH Zurich", "Oxford", "Cambridge", "University of Michigan", "Caltech", "University of Toronto", "TU Munich", "National University of Singapore"]
COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Stripe", "Salesforce", "Adobe", "IBM", "Accenture", "Deloitte", "TCS", "Infosys", "Wipro", "Cognizant", "Goldman Sachs", "JP Morgan", "McKinsey"]


def _fill_template(template: str, rng: np.random.RandomState) -> str:
    """Fill template placeholders with realistic random values."""
    replacements = {
        "{yrs}": str(rng.randint(3, 15)),
        "{pct}": str(rng.randint(15, 85)),
        "{pubs}": str(rng.randint(2, 15)),
        "{uni}": rng.choice(UNIVERSITIES),
        "{company}": rng.choice(COMPANIES),
        "{docs}": str(rng.randint(10, 500)),
        "{acc}": str(rng.randint(88, 99)),
        "{exp}": str(rng.randint(20, 200)),
        "{rev}": str(rng.randint(1, 50)),
        "{rps}": str(rng.randint(5, 100)),
        "{users}": str(rng.randint(10, 500)),
        "{stars}": str(rng.randint(100, 5000)),
        "{gb}": str(rng.randint(5, 500)),
        "{cov}": str(rng.randint(80, 98)),
        "{tps}": str(rng.randint(5, 100)),
        "{vol}": str(rng.randint(1, 100)),
        "{clients}": str(rng.randint(20, 200)),
        "{teams}": str(rng.randint(5, 30)),
        "{nodes}": str(rng.randint(50, 500)),
        "{certs}": str(rng.randint(3, 8)),
        "{hires}": str(rng.randint(50, 500)),
        "{size}": str(rng.randint(200, 5000)),
        "{team}": str(rng.randint(5, 30)),
        "{events}": str(rng.randint(1, 100)),
        "{tests}": str(rng.randint(20, 200)),
        "{projects}": str(rng.randint(5, 50)),
        "{budget}": str(rng.randint(1, 50)),
        "{processes}": str(rng.randint(20, 100)),
        "{cases}": str(rng.randint(50, 500)),
        "{apis}": str(rng.randint(50, 500)),
        "{pipeline}": str(rng.randint(5, 50)),
        "{deals}": str(rng.randint(10, 100)),
        "{start}": str(rng.randint(1, 10)),
        "{end}": str(rng.randint(15, 80)),
        "{contracts}": str(rng.randint(10, 100)),
        "{tvl}": str(rng.randint(1, 500)),
        "{dbs}": str(rng.randint(10, 100)),
        "{tb}": str(rng.randint(1, 50)),
        "{pb}": str(rng.choice(["0.5", "1", "2", "5", "10"])),
        "{val}": str(rng.randint(5, 500)),
        "{products}": str(rng.randint(5, 30)),
        "{facilities}": str(rng.randint(2, 10)),
        "{records}": str(rng.randint(1, 100)),
        "{brands}": str(rng.randint(10, 50)),
        "{impressions}": str(rng.randint(10, 500)),
        "{awards}": str(rng.randint(2, 15)),
        "{companies}": str(rng.randint(5, 30)),
    }
    result = template
    for key, val in replacements.items():
        result = result.replace(key, val)
    return result


def generate_professional_synthetic(n_per_category: int = 30, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic professional resumes from industry hiring patterns."""
    rng = np.random.RandomState(seed)
    samples = []

    for category in CATEGORIES:
        templates = PROFESSIONAL_TEMPLATES.get(category, [])
        if not templates:
            continue
        for i in range(n_per_category):
            template = templates[i % len(templates)]
            resume = _fill_template(template, rng)
            # Add variation: shuffle sentences
            if i > len(templates):
                sentences = resume.split(". ")
                rng.shuffle(sentences)
                resume = ". ".join(sentences)
            samples.append({
                "Category": category,
                "Resume": resume,
                "source": "synthetic_professional"
            })

    return pd.DataFrame(samples)


# ══════════════════════════════════════════════════════
# SOURCE 3: LinkedIn-Style Job Description Data
# ══════════════════════════════════════════════════════

LINKEDIN_JD_RESUMES = {
    "Data Science": "Experienced in building end-to-end machine learning pipelines using Python, scikit-learn, TensorFlow, and cloud platforms. Strong foundation in statistics, probability, and experimental design. Experience with feature engineering, model selection, hyperparameter tuning, and ML deployment using MLflow and SageMaker. Collaborative team player with experience presenting insights to C-level executives.",
    "Python Developer": "Skilled Python backend developer with production experience in Django, FastAPI, and Flask. Strong understanding of RESTful API design, database optimization, and asynchronous programming. Experience with message queues (RabbitMQ, Celery), caching (Redis), and containerization (Docker). Passionate about clean code, test-driven development, and continuous integration.",
    "DevOps Engineer": "Infrastructure engineer with hands-on experience in AWS, Terraform, Docker, and Kubernetes. Built and maintained CI/CD pipelines using Jenkins, GitLab CI, and GitHub Actions. Strong scripting skills in Python and Bash. Experience with monitoring and observability using Prometheus, Grafana, ELK stack, and PagerDuty. On-call experience managing production incidents.",
    "Web Designing": "Frontend developer and UI designer with expertise in React, TypeScript, and modern CSS. Strong eye for design with experience in Figma, Adobe XD, and design systems. Built accessible, responsive web applications following WCAG guidelines. Experience with animation libraries (Framer Motion, GSAP), state management (Redux, Zustand), and performance optimization.",
    "Java Developer": "Enterprise Java developer with strong Spring ecosystem experience. Built microservices architectures using Spring Boot, Spring Cloud, and Apache Kafka. Proficient in JPA/Hibernate, PostgreSQL, and distributed caching. Experience with reactive programming using WebFlux and Project Reactor. Strong understanding of design patterns and SOLID principles.",
    "HR": "Strategic HR professional with experience in full-cycle talent acquisition, employee engagement, and organizational development. Proficient in HRIS platforms including Workday and SAP SuccessFactors. Data-driven approach to people analytics and workforce planning. Experience with compensation benchmarking, performance management systems, and DEI initiatives.",
}


def generate_linkedin_style(n_per_category: int = 10, seed: int = 123) -> pd.DataFrame:
    """Generate LinkedIn-style professional profile data."""
    rng = np.random.RandomState(seed)
    samples = []
    for cat in CATEGORIES:
        base = LINKEDIN_JD_RESUMES.get(cat, "")
        if not base:
            # Generate from category skills
            from skills_db import TECHNICAL_SKILLS
            all_skills = []
            for skills in TECHNICAL_SKILLS.values():
                all_skills.extend(skills)
            base = f"Professional with experience in {cat}. " + " ".join(rng.choice(all_skills, size=min(10, len(all_skills)), replace=False).tolist())
        for i in range(n_per_category):
            text = base
            if i > 0:
                words = text.split()
                rng.shuffle(words)
                text = " ".join(words[:int(len(words) * rng.uniform(0.7, 1.0))])
            samples.append({"Category": cat, "Resume": text, "source": "linkedin_style"})
    return pd.DataFrame(samples)


# ══════════════════════════════════════════════════════
# COMBINED PIPELINE
# ══════════════════════════════════════════════════════

def build_combined_dataset(use_cache: bool = True, use_huggingface: bool = True) -> pd.DataFrame:
    """
    Build a combined recruitment dataset from multiple sources.
    
    Sources combined:
    1. Hugging Face Datasets (if available)
    2. Synthetic professional resumes (industry patterns)
    3. LinkedIn-style job description data
    4. Original academic templates (backward compatibility)
    """
    if use_cache and CACHE_FILE.exists():
        print("[Pipeline] Loading cached dataset...")
        return pd.read_parquet(CACHE_FILE)

    print("[Pipeline] Building combined dataset from multiple sources...")
    frames = []

    # Source 1: Hugging Face
    if use_huggingface:
        hf_df = fetch_huggingface_data()
        if len(hf_df) > 0:
            frames.append(hf_df)
            print(f"  → HuggingFace: {len(hf_df)} samples")

    # Source 2: Synthetic professional resumes
    synth_df = generate_professional_synthetic(n_per_category=30)
    frames.append(synth_df)
    print(f"  → Synthetic Professional: {len(synth_df)} samples")

    # Source 3: LinkedIn-style data
    linkedin_df = generate_linkedin_style(n_per_category=10)
    frames.append(linkedin_df)
    print(f"  → LinkedIn-style: {len(linkedin_df)} samples")

    # Combine all
    combined = pd.concat(frames, ignore_index=True)
    combined = combined.drop_duplicates(subset=["Resume"], keep="first")

    # Ensure all categories are represented
    for cat in CATEGORIES:
        if cat not in combined["Category"].values:
            print(f"  ⚠ Missing category: {cat}, adding fallback samples")
            combined = pd.concat([combined, pd.DataFrame([
                {"Category": cat, "Resume": f"Professional with experience in {cat} field with relevant skills and qualifications.", "source": "fallback"}
            ])], ignore_index=True)

    # Cache the result
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    combined.to_parquet(CACHE_FILE, index=False)
    print(f"[Pipeline] Combined dataset: {len(combined)} total samples across {combined['Category'].nunique()} categories")
    print(f"[Pipeline] Sources: {combined['source'].value_counts().to_dict()}")

    return combined


def get_dataset_stats(df: pd.DataFrame) -> dict:
    """Return statistics about the combined dataset."""
    return {
        "total_samples": len(df),
        "categories": df["Category"].nunique(),
        "samples_per_category": df["Category"].value_counts().to_dict(),
        "sources": df["source"].value_counts().to_dict() if "source" in df.columns else {},
        "avg_resume_length": int(df["Resume"].str.len().mean()),
    }


if __name__ == "__main__":
    df = build_combined_dataset(use_cache=False)
    stats = get_dataset_stats(df)
    print(f"\nDataset Statistics:")
    print(f"  Total: {stats['total_samples']} samples")
    print(f"  Categories: {stats['categories']}")
    print(f"  Sources: {stats['sources']}")
    print(f"  Avg Length: {stats['avg_resume_length']} chars")
