"""Master Skills Database — 500+ technical and soft skills for matching."""

TECHNICAL_SKILLS = {
    "programming": ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Shell", "Bash", "PowerShell", "Lua", "Dart", "Objective-C", "Assembly", "COBOL", "Fortran", "Haskell", "Elixir", "Clojure", "Groovy"],
    "web_frontend": ["HTML", "CSS", "React", "Angular", "Vue", "Next.js", "Nuxt.js", "Svelte", "jQuery", "Bootstrap", "Tailwind CSS", "SASS", "LESS", "Redux", "MobX", "Webpack", "Vite", "Gatsby", "Remix", "Astro"],
    "web_backend": ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Ruby on Rails", "Laravel", "NestJS", "GraphQL", "REST API", "gRPC", "WebSocket"],
    "databases": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "SQL Server", "SQLite", "Cassandra", "DynamoDB", "Firebase", "Neo4j", "MariaDB", "CouchDB", "InfluxDB"],
    "cloud": ["AWS", "Azure", "Google Cloud", "GCP", "Heroku", "DigitalOcean", "Vercel", "Netlify", "EC2", "S3", "Lambda", "CloudFront", "RDS", "ECS", "EKS", "Fargate"],
    "devops": ["Docker", "Kubernetes", "Jenkins", "GitLab CI", "GitHub Actions", "Terraform", "Ansible", "Puppet", "Chef", "Vagrant", "Nginx", "Apache", "CI/CD", "ArgoCD", "Helm"],
    "data_science": ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Keras", "scikit-learn", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "Jupyter", "OpenCV", "NLTK", "spaCy", "Hugging Face", "XGBoost", "LightGBM"],
    "big_data": ["Hadoop", "Spark", "Hive", "Kafka", "Flink", "Airflow", "MapReduce", "HBase", "Pig", "Sqoop", "Presto", "Databricks", "Snowflake", "dbt"],
    "mobile": ["React Native", "Flutter", "SwiftUI", "Android", "iOS", "Xamarin", "Ionic", "Cordova", "Expo"],
    "testing": ["Selenium", "Cypress", "Jest", "Mocha", "JUnit", "TestNG", "PyTest", "Playwright", "Appium", "Postman", "JMeter", "LoadRunner", "SonarQube"],
    "security": ["OWASP", "Penetration Testing", "Firewalls", "SIEM", "IDS/IPS", "Encryption", "SSL/TLS", "OAuth", "JWT", "RBAC", "Zero Trust", "SOC", "Vulnerability Assessment"],
    "design": ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "InDesign", "After Effects", "Premiere Pro", "Canva", "Blender", "UI/UX", "Wireframing", "Prototyping"],
    "project_mgmt": ["JIRA", "Confluence", "Trello", "Asana", "Monday.com", "MS Project", "Notion", "Basecamp", "Smartsheet"],
    "bi_analytics": ["Tableau", "Power BI", "Looker", "Google Analytics", "Mixpanel", "Amplitude", "Metabase", "Superset", "Qlik"],
    "sap": ["SAP ABAP", "SAP HANA", "SAP Fiori", "SAP S/4HANA", "SAP MM", "SAP SD", "SAP FI", "SAP CO", "SAP BW", "SAP PI/PO"],
    "blockchain": ["Solidity", "Ethereum", "Web3.js", "Hardhat", "Truffle", "Smart Contracts", "DeFi", "NFT", "Hyperledger"],
    "networking": ["TCP/IP", "DNS", "DHCP", "VPN", "Load Balancing", "CDN", "HTTP/HTTPS", "REST", "SOAP", "SNMP", "BGP"],
    "version_control": ["Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Mercurial"],
    "os": ["Linux", "Ubuntu", "CentOS", "Windows Server", "macOS", "Unix"],
}

SOFT_SKILLS = [
    "Leadership", "Communication", "Teamwork", "Problem Solving", "Critical Thinking",
    "Time Management", "Adaptability", "Creativity", "Attention to Detail", "Collaboration",
    "Negotiation", "Presentation", "Public Speaking", "Conflict Resolution", "Decision Making",
    "Strategic Planning", "Mentoring", "Coaching", "Emotional Intelligence", "Work Ethic",
    "Self Motivation", "Analytical Thinking", "Project Management", "Agile", "Scrum",
    "Lean", "Six Sigma", "Customer Service", "Stakeholder Management", "Cross-functional",
]

CERTIFICATIONS = [
    "AWS Certified", "Azure Certified", "Google Cloud Certified", "PMP", "CISSP", "CEH",
    "CompTIA Security+", "CompTIA Network+", "CCNA", "CCNP", "ITIL", "Scrum Master",
    "SAFe Agilist", "Kubernetes CKA", "Terraform Associate", "ISTQB", "TOGAF",
    "Six Sigma Green Belt", "Six Sigma Black Belt", "SHRM", "CPA", "CFA",
]

# Flatten all skills for matching
ALL_SKILLS = []
for category_skills in TECHNICAL_SKILLS.values():
    ALL_SKILLS.extend(category_skills)
ALL_SKILLS.extend(SOFT_SKILLS)
ALL_SKILLS.extend(CERTIFICATIONS)
ALL_SKILLS = list(set(ALL_SKILLS))  # Deduplicate


def get_all_skills():
    """Return the complete flat list of all known skills."""
    return ALL_SKILLS


def get_skills_by_category(category_name=None):
    """Return skills grouped by technical category."""
    if category_name and category_name in TECHNICAL_SKILLS:
        return TECHNICAL_SKILLS[category_name]
    return TECHNICAL_SKILLS
