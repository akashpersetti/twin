export const resume = {
  basics: {
    name: "Akash Hadagali Persetti",
    title: "MS Computer Science Student | ML + AI Engineer",
    location: "Bloomington, IN",
    address: "421 W Hoosier Court Ave, Bloomington, IN - 47404",
    email: "hadagalipersettiakash@gmail.com",
    phone: "812-837-7651",
    linkedin: "linkedin.com/in/akash-hp",
    linkedinUrl: "https://linkedin.com/in/akash-hp",
    github: "github.com/akashpersetti",
    githubUrl: "https://github.com/akashpersetti",
    website: "https://d3ezo1pi74ktc5.cloudfront.net",
  },

  impact: [
    { value: 60, unit: "%", label: "Manual effort reduced (Sentinel)" },
    { value: 30, unit: "%", label: "Miscounting errors cut (ML Intern)" },
    { value: 25, unit: "%", label: "Organic search visibility lift" },
  ],

  experience: [
    {
      role: "Machine Learning Intern",
      company: "MyEdMaster LLC",
      location: "Leesburg, Virginia, United States",
      type: "Remote",
      period: "Jun 2025 – Aug 2025",
      project: "Virtual Coach for Exercise Assessment",
      bullets: [
        "Reduced repetition miscounting errors by ~30% by implementing calibration routines and motion consistency checks using Python and MediaPipe, achieving over 92% counting accuracy across 3 exercise types",
        "Cut form-detection latency to under 100ms per frame by engineering real-time pose landmark extraction and joint angle calculations, enabling sub-second corrective feedback during live exercise sessions",
        "Eliminated manual exercise review by building an end-to-end posture assessment pipeline that automated form validation across all tracked exercises (Kettlebell Front Raise, Seated Leg Extensions, Jack Knives)",
        "Reduced coach intervention time by an estimated 40% by developing automatic repetition counting with real-time corrective feedback, allowing users to self-correct form during live exercise sessions without instructor oversight",
      ],
    },
    {
      role: "Web Development Intern",
      company: "Squadcast Labs Private Limited",
      location: "Bengaluru, India",
      type: "Remote",
      period: "Oct 2023 – May 2024",
      project: "SEO-Driven Web Performance and Content Optimization",
      bullets: [
        "Increased organic search visibility by an estimated 25% by designing and developing 18+ responsive landing and solution pages in Webflow with Core Web Vitals optimization, reducing average page load time below 2.5 seconds",
        "Boosted projected monthly organic traffic by 20% by authoring and optimizing 38 SEO-targeted blog pages through structured keyword research and on-page optimization, directly improving domain keyword rankings",
        "Improved Largest Contentful Paint (LCP) scores by ~15% by implementing script-delay techniques to defer and optimize third-party scripts, reducing render-blocking resource load time across all high-traffic pages",
        "Identified and resolved 10+ performance bottlenecks by conducting SEO analysis using Google Search Console and PageSpeed Insights, directly improving Core Web Vitals scores across key landing pages",
      ],
    },
  ],

  projects: [
    {
      title: "Sentinel",
      subtitle: "AI-Powered Task Automation Agent",
      period: "Jan 2026 – Feb 2026",
      tech: ["LangGraph", "GPT-4o-mini", "SQLite", "Playwright", "MCP", "Python"],
      bullets: [
        "Reduced manual effort for repetitive multi-step workflows by an estimated 60% by building a self-evaluating autonomous agent using LangGraph and GPT-4o-mini, with a worker-evaluator loop that converges task completion in under 3 refinement cycles on average",
        "Achieved zero-overhead session continuity by integrating persistent memory via SQLite and LangGraph checkpointing, enabling fully resumable agentic workflows across separate user sessions",
        "Delivered broad task automation across 6+ domains (browser automation, code execution, web search, file I/O, Wikipedia, push notifications) by orchestrating Playwright, Python REPL, and external APIs within a unified tool-calling architecture",
        "Improved tool extensibility by designing the agent around Model Context Protocol (MCP), enabling plug-and-play integration of new tool servers without changes to core agent logic",
      ],
    },
    {
      title: "Twin",
      subtitle: "AI Digital Twin on Personal Website",
      period: "Feb 2026 – Mar 2026",
      tech: ["FastAPI", "Next.js", "AWS Bedrock", "Claude Sonnet", "Terraform", "GitHub Actions"],
      bullets: [
        "Enabled any website visitor to interact with a real-time AI persona by building a serverless full-stack application using FastAPI (Python), Next.js, and AWS Bedrock (Claude Sonnet 4 / Amazon Nova / Google Gemma 27B), grounding the LLM in a persona assembled from a LinkedIn PDF, career summary, biographical facts, and a communication style guide",
        "Cut cold-start Lambda packaging time by targeting the official AWS Lambda Python 3.12 Docker image via a custom deploy.py script, producing a fully compatible lambda-deployment.zip that reduced deployment friction and eliminated runtime compatibility errors",
        "Achieved zero-credential CI/CD deployments by configuring GitHub Actions with AWS OIDC authentication, automating the full pipeline (Lambda build → Terraform apply → Next.js static export → S3 sync → CloudFront cache invalidation) across dev, test, and prod environments via Terraform workspaces",
        "Reduced hallucination risk and jailbreak exposure by engineering a persona-grounding system prompt with strict rules against information invention, topic drift, and prompt-injection attacks, ensuring all responses stayed factual and professional",
        "Maintained per-user conversation context across sessions at near-zero cost by persisting chat history as JSON to a private S3 bucket (prod) or local filesystem (dev), with session IDs generated on the frontend and passed through API Gateway to Lambda",
      ],
    },
    {
      title: "Retail Sales Trend Analysis",
      subtitle: "Consumer Behavior Prediction",
      period: "Sep 2024 – Dec 2024",
      tech: ["Python", "Scikit-learn", "Logistic Regression", "Random Forest", "Apriori", "Collaborative Filtering"],
      bullets: [
        "Achieved 85%+ classification accuracy in predicting sales volatility by applying Logistic Regression, Decision Tree, and Random Forest models to state-level U.S. retail data, enabling early identification of high-risk sales periods",
        "Surfaced 12+ cross-promotional product associations by implementing Apriori association rule mining on transaction datasets, generating actionable bundle and shelf-placement recommendations",
        "Improved recommendation relevance by ~18% over a popularity baseline by developing collaborative filtering pipelines, enabling personalized product suggestions at the consumer segment level",
      ],
    },
  ],

  skills: {
    languages: ["Python", "C++", "Java"],
    databases: ["MySQL", "MongoDB", "PostgreSQL"],
    development: ["JavaScript", "TypeScript", "Node.js", "React", "HTML", "CSS", "FastAPI", "Next.js"],
    ml: ["Clustering Algorithms & Classification Models", "CNN", "MediaPipe"],
    genai: ["Retrieval-Augmented Generation (RAG) Systems", "LangChain Framework", "Vector Databases (ChromaDB)", "LLM Evaluation", "Hugging Face Framework"],
    agentic: ["OpenAI Agents SDK", "CrewAI", "LangGraph", "AutoGen", "Model Context Protocol (MCP)", "Strands Agents", "n8n"],
    cloud: ["Amazon Web Services (AWS)", "Google Cloud Platform (GCP)", "Microsoft Azure"],
    devops: ["GitHub Actions", "Docker", "Terraform (AWS/Azure)"],
  },

  education: [
    {
      degree: "Master of Science (M.S.) in Computer Science",
      institution: "Indiana University Bloomington",
      school: "Luddy School of Informatics, Computing and Engineering",
      location: "Bloomington, Indiana, United States",
      period: "2024 – Present",
      gpa: "3.8 / 4.0",
      coursework: [
        "Applied Algorithms",
        "Applied Machine Learning",
        "Data Mining",
        "Advanced Database Concepts",
        "Cloud Computing",
        "Software Engineering",
        "Computer Networks",
        "Security for Networked Systems",
      ],
    },
    {
      degree: "Bachelor of Engineering (B.E.) in Computer Science and Engineering",
      institution: "The National Institute of Engineering, Mysuru",
      school: "Autonomous under Visvesvaraya Technological University",
      location: "Mysuru, India",
      period: "2020 – 2024",
      gpa: "3.7 / 4.0",
      coursework: [
        "Computer Networks",
        "Data Structures and Algorithms",
        "Operating Systems",
        "Unix/Linux",
        "Cryptography",
        "Theory of Computation",
      ],
    },
  ],

  certifications: [
    {
      title: "Introduction to Machine Learning",
      issuer: "NPTEL / IIT Madras",
      period: "Oct 2022 – Jan 2023",
      details: "Completed a 12-week online course covering neural networks, regression, and KNN",
      topics: ["Neural Networks", "Regression", "KNN"],
    },
  ],

  cocurricular: [
    {
      title: "Seminar on Green Computing",
      organization: "The National Institute of Engineering, Mysuru",
      date: "Dec 2023",
    },
    {
      title: "Two-Day Workshop on Artificial Intelligence",
      organization: "Indian Institute of Technology Bombay, Mumbai",
      date: "Dec 2022",
    },
  ],

  extracurricular: [
    {
      role: "Supervisor",
      organization: "Bookmarket Eatery (IU Dining and Hospitality), Indiana University Bloomington",
      details: "Oversaw daily operations and staff scheduling",
    },
  ],

  communityService: [
    {
      description: "Taught basic computer skills and Microsoft Office to 80 underprivileged students at Railway Workshop Government School, Mysuru, improving digital literacy access in an underserved community",
      date: "Oct 2022",
    },
  ],
} as const;
