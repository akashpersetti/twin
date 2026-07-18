export const resume = {
  basics: {
    name: "Akash Hadagali Persetti",
    title: "AI Engineer | M.S. Computer Science",
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
      role: "Software Development Intern",
      company: "Humaximus Inc.",
      location: "Dallas, TX",
      type: "Remote/Hybrid",
      period: "Jul 2026 – Present",
      project: "Healthcare Coordination Platform",
      bullets: [
        "Contributing frontend, backend, API-integration, and workflow-debugging work to an early-stage healthcare coordination platform preparing its MVP for pilot partnerships; researching FHIR, HL7, and EHR integration requirements to guide implementation, working across GitHub and Jira.",
      ],
    },
    {
      role: "AI Engineer",
      company: "MyEdMaster LLC",
      location: "Leesburg, Virginia, United States",
      type: "Remote",
      period: "Jun 2026 – Present",
      project: "Adaptive AI Tutoring Product",
      bullets: [
        "Building an adaptive AI tutoring product that assesses a learner’s existing knowledge of a target topic or certification and generates a customized, real-time training program covering only the gaps, using Python, LLMs (OpenAI SDK), and MySQL.",
        "Developed the initial assessment and curriculum-generation services using structured outputs, Pydantic validation schemas, and automated test cases, keeping generated coursework grounded and aligned to certification requirements while enabling rapid prototype iteration toward a QA-approved milestone.",
      ],
    },
    {
      role: "Machine Learning Intern",
      company: "MyEdMaster LLC",
      location: "Leesburg, Virginia, United States",
      type: "Remote",
      period: "Jun 2025 – Aug 2025",
      project: "Virtual Coach for Exercise Assessment",
      bullets: [
        "Built a real-time computer-vision exercise-assessment system that cut repetition miscounting by roughly 30% and reached over 92% count accuracy across 3 exercise types (Kettlebell Front Raise, Seated Leg Extensions, Jack Knives) by adding calibration routines and motion-consistency checks in Python and MediaPipe, lowering estimated coach intervention time by about 40%.",
        "Held form-detection latency under 100ms per frame by engineering real-time pose-landmark extraction and joint-angle calculations, delivering sub-second corrective feedback so users could self-correct during live sessions without instructor oversight.",
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
      title: "TerraformAgent",
      subtitle: "Multi-Agent IaC Generator",
      period: "Not specified",
      tech: [
        "LangGraph",
        "FastAPI",
        "Step Functions",
      ],
      bullets: [
        "Built a 6-node LangGraph pipeline (orchestrator, researcher, parallel domain subagents, aggregator, reviewer, evaluator) that turns a natural-language infrastructure request into validated Terraform.",
        "Gated output on a real evaluator that writes the generated code to disk and runs terraform fmt and terraform validate against a provider cache baked into the Docker image, reaching full offline validation by copying the read-only cache into a writable path once per execution environment.",
        "Hardened the review step with a multi-LLM fan-out that queries OpenAI and Anthropic in parallel and blocks on any security veto, falling back to single-LLM review.",
        "Deployed the containerized service on Lambda and Step Functions with JWT authentication, DynamoDB state, SQS failure handling, and Secrets Manager; provisioned the stack through Terraform and GitHub Actions OIDC.",
      ],
    },
    {
      title: "EvalBench",
      subtitle: "Multi-Provider LLM Eval Platform",
      period: "Not specified",
      tech: [
        "FastAPI",
        "LiteLLM",
        "Next.js",
        "Terraform",
      ],
      bullets: [
        "Architected a pluggable-suite eval harness where every benchmark emits one shared MetricRecord contract persisted to a single JSON-column table.",
        "Shipped 3 benchmark suites on that harness: structured-output reliability, latency/cost with pairwise judge scoring, and RAG with recall@k, nDCG@k, and faithfulness across swappable chunking strategies.",
        "Ran 27 evaluation runs across 75 tasks and 7 model/config variants, exposing an 8-point first-attempt schema-validity gap between providers on structured output.",
        "Deployed serverless on AWS: dual Lambda (API plus async runner), API Gateway v2, CloudFront, DynamoDB run tracking, and SES magic-link auth.",
      ],
    },
    {
      title: "Wingman",
      subtitle: "Self-Evaluating Agentic Co-Worker",
      period: "Not specified",
      tech: [
        "LangGraph",
        "FastAPI",
        "Lambda",
        "DynamoDB",
      ],
      bullets: [
        "Designed a worker-evaluator state machine in LangGraph where a structured-output evaluator checks worker responses against user-defined criteria and reinjects feedback for up to 5 retry turns.",
        "Made the agent serverless-safe by reconstructing LangGraph state from DynamoDB on every request instead of an in-memory checkpointer.",
        "Integrated 5 tool domains through LangChain ToolNode and bind tools, shipped the full serverless stack via the same OIDC pipeline.",
      ],
    },
    {
      title: "Twin",
      subtitle: "AI Digital Twin + Live Eval Dashboard",
      period: "Not specified",
      tech: [
        "FastAPI",
        "Next.js",
        "AWS Bedrock",
        "Lambda",
        "S3",
      ],
      bullets: [
        "Built a streaming personal-website agent using Titan-embedding retrieval over a persona corpus, grounded in a profile assembled at Lambda cold-start from a LinkedIn PDF and style guide.",
        "Shipped a public evals dashboard scoring retrieval quality on 35 labeled queries per push and LLM-judged faithfulness on live traffic.",
        "Cut full-stack deployment to a single command across dev, test, and prod.",
      ],
    },
    {
      title: "mcp-second-opinion",
      subtitle: "Open-Source MCP Server, Published to PyPI",
      period: "Not specified",
      tech: ["Python"],
      bullets: [
        "Built and published an MIT-licensed MCP server that lets any MCP-aware agent consult rival LLMs mid-conversation.",
        "Unified four provider APIs behind a single LiteLLM interface, returning per-call latency, token counts, and cost; gracefully disables providers with no API key instead of failing.",
      ],
    },
  ],

  skills: {
    languages: ["Python", "TypeScript", "JavaScript", "C++", "Java", "SQL"],
    databases: ["MySQL", "MongoDB", "PostgreSQL", "DynamoDB", "NeonDB"],
    development: ["JavaScript", "TypeScript", "Node.js", "React", "React Native (Expo)", "HTML", "CSS", "FastAPI", "Next.js", "Webflow"],
    ml: ["Clustering Algorithms & Classification Models", "CNN", "MediaPipe", "scikit-learn"],
    genai: [
      "Retrieval-Augmented Generation (RAG) Systems",
      "LangChain Framework",
      "Vector Databases (ChromaDB)",
      "LLM Evaluation",
      "Hugging Face Framework",
      "OpenAI",
      "AWS Bedrock (Claude Sonnet)",
    ],
    agentic: ["OpenAI Agents SDK", "CrewAI", "LangGraph", "AutoGen", "Model Context Protocol (MCP)", "Strands Agents", "n8n", "LangChain"],
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
      period: "Aug 2024 – May 2026 (Graduated)",
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
      title: "Proficient AI Engineer",
      issuer: "Ed Donner / The AI Engineer track",
      period: "2026",
      details: "Advanced AI engineering coursework and projects",
      topics: [],
    },
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
