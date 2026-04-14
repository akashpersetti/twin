export const resume = {
  basics: {
    name: "Akash Hadagali Persetti",
    title: "MS Computer Science Student | Aspiring ML + AI Engineer",
    location: "Bloomington, IN",
    address: "421 W Hoosier Court Ave, Bloomington, IN - 47404",
    email: "hadagalipersettiakash@gmail.com",
    phone: "812-837-7651",
    linkedin: "linkedin.com/in/akash-hp",
    linkedinUrl: "https://linkedin.com/in/akash-hp",
    github: "github.com/akashpersetti",
    githubUrl: "https://github.com/akashpersetti",
    website: "https://akashpersetti.com",
  },

  impact: [
    { value: 60, unit: "%", label: "Manual effort reduced (Sentinel)" },
    { value: 30, unit: "%", label: "Miscounting errors cut (ML Intern)" },
    { value: 25, unit: "%", label: "Organic search visibility lift (Web Development Intern)" },
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
      company: "Squadcast Labs",
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
      title: "Wingman",
      subtitle: "Personal AI Co-Worker",
      period: "Jan 2026 – Feb 2026",
      tech: [
        "LangGraph",
        "GPT-4o-mini",
        "DynamoDB",
        "FastAPI",
        "Mangum",
        "Docker",
        "Terraform",
        "GitHub Actions",
        "AWS",
      ],
      bullets: [
        "Built a self-evaluating agentic system using LangGraph and GPT-4o-mini where a worker model executes tasks with tools while a structured-output evaluator checks each response against user-defined success criteria, retrying with injected feedback for up to 5 turns before surfacing a final answer",
        "Achieved fully stateless Lambda execution by reconstructing LangGraph state from DynamoDB on every request instead of using a persistent checkpointer, eliminating cold-start graph state issues and making the agent safe for serverless deployment",
        "Enabled broad task automation across 5 tool domains (web search via Serper, Wikipedia, Python REPL, file I/O in a sandboxed directory, and Pushover push notifications) by binding all tools to the worker LLM through LangChain’s ToolNode and bind tools interface",
        "Deployed the full stack on AWS with zero long-lived credentials by containerizing FastAPI + Mangum in a Docker image pushed to ECR, serving a Next.js static frontend from S3, and provisioning Lambda, API Gateway v2, DynamoDB, and CloudFront via Terraform, with every release automated through GitHub Actions OIDC",
      ],
    },
    {
      title: "Twin",
      subtitle: "AI Digital Twin on Personal Website",
      period: "Feb 2026 – Mar 2026",
      tech: ["FastAPI", "Next.js", "AWS Bedrock", "Claude Sonnet 4", "Terraform", "GitHub Actions"],
      bullets: [
        "Deployed a serverless AI digital twin accessible to any website visitor by building a streaming full-stack application with FastAPI, Next.js, and AWS Bedrock (Claude Sonnet 4), grounding responses in a persona assembled from a LinkedIn PDF, career summary, and communication style guide parsed at Lambda cold-start via pypdf and resources.py",
        "Reduced deployment to a single command across 3 environments (dev, test, prod) by wiring GitHub Actions with AWS OIDC (zero long-lived credentials) to automate the full pipeline: Docker build→Lambda upload→Terraform workspace apply→Next.js static export→S3 sync→CloudFront invalidation",
        "Prevented hallucination and prompt-injection attacks by engineering a strict system prompt in context.py that forbids information invention, blocks jailbreak attempts, and constrains all responses to verified context, keeping the persona factual and professional",
        "Maintained per-user conversation history at near-zero storage cost by persisting chat turns as session-keyed JSON to a private S3 bucket in prod and local filesystem in dev, with session IDs generated client-side and routed through API Gateway to the Bedrock converse stream handler",
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
    databases: ["MySQL", "MongoDB", "PostgreSQL", "DynamoDB"],
    development: ["JavaScript", "TypeScript", "Node.js", "React", "HTML", "CSS", "FastAPI", "Next.js", "Webflow"],
    ml: ["Clustering Algorithms & Classification Models", "CNN", "MediaPipe"],
    genai: [
      "Retrieval-Augmented Generation (RAG) Systems",
      "LangChain Framework",
      "Vector Databases (ChromaDB)",
      "LLM Evaluation",
      "Hugging Face Framework",
    ],
    agentic: ["OpenAI Agents SDK", "CrewAI", "LangGraph", "AutoGen", "Model Context Protocol (MCP)", "Strands Agents", "n8n"],
    cloud: [
      "AWS (Lambda, S3, CloudFront, Bedrock, DynamoDB, ECR, API Gateway, EC2, VPC, Aurora, App Runner, Amplify, SageMaker)",
      "Google Cloud Platform (GCP)",
      "Microsoft Azure",
    ],
    devops: ["GitHub Actions", "Docker", "Terraform (AWS/Azure)"],
  },

  education: [
    {
      degree: "Master of Science (M.S.) in Computer Science",
      institution: "Indiana University Bloomington",
      school: "Luddy School of Informatics, Computing and Engineering",
      location: "Bloomington, Indiana, United States",
      period: "Aug 2024 – May 2026 (Expected)",
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
      degree: "Bachelor of Engineering (B.Eng.) in Computer Science and Engineering",
      institution: "The National Institute of Engineering, Mysuru, India",
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
