export const resume = {
  basics: {
    name: "Akash Hadagali Persetti",
    title: "AI Engineer | M.S. Computer Science",
    location: "Bloomington, IN",
    address: "421 W Hoosier Court Ave, Bloomington, IN - 47404",
    email: "hadagalipersettiakash@gmail.com",
    linkedin: "linkedin.com/in/akash-hp",
    linkedinUrl: "https://linkedin.com/in/akash-hp",
    github: "github.com/akashpersetti",
    githubUrl: "https://github.com/akashpersetti",
    website: "https://akashpersetti.com",
    devTo: "dev.to/akashpersetti",
    devToUrl: "https://dev.to/akashpersetti",
    hashnode: "akashpersetti.hashnode.dev",
    hashnodeUrl: "https://akashpersetti.hashnode.dev",
    coderLegion: "coderlegion.com/user/akashpersetti",
    coderLegionUrl: "https://coderlegion.com/user/akashpersetti",
  },

  impact: [
    { value: 60, unit: "%", label: "Manual effort reduced (Sentinel)" },
    { value: 30, unit: "%", label: "Miscounting errors cut (ML Intern)" },
    { value: 25, unit: "%", label: "Organic search visibility lift (Web Development Intern)" },
  ],

  experience: [
    {
      role: "AI Engineer",
      company: "MyEdMaster LLC",
      location: "Leesburg, Virginia, United States",
      type: "Remote",
      period: "Jun 2026 - Present",
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
      period: "Jun 2025 - Aug 2025",
      project: "Virtual Coach for Exercise Assessment",
      bullets: [
        "Built a real-time computer-vision exercise-assessment system that cut repetition miscounting by roughly 30% and reached over 92% count accuracy across 3 exercise types (Kettlebell Front Raise, Seated Leg Extensions, Jack Knives) by adding calibration routines and motion-consistency checks in Python and MediaPipe, lowering estimated coach intervention time by about 40%.",
        "Held form-detection latency under 100ms per frame by engineering real-time pose-landmark extraction and joint-angle calculations, delivering sub-second corrective feedback so users could self-correct during live sessions without instructor oversight.",
      ],
    },
  ],

  projects: [
    {
      title: "TerraformAgent",
      subtitle: "Multi-Agent IaC Generator",
      period: "Not specified",
      githubUrl: "https://github.com/akashpersetti/terraform-agent",
      liveUrl: "https://terraform-agent.akashpersetti.com",
      tech: [
        "LangGraph",
        "FastAPI",
        "Step Functions",
      ],
      bullets: [
        "Built a 6-node LangGraph pipeline (orchestrator, researcher, parallel domain subagents, aggregator, reviewer, evaluator) that turns a natural-language infrastructure request into validated Terraform, with a conditional edge that reruns only the domains a review flags for up to a capped number of targeted retries.",
        "Gated output on a real evaluator that writes the generated code to disk and runs terraform fmt and terraform validate against a provider cache baked into the Docker image, reaching full offline validation by copying the read-only cache into a writable path once per execution environment.",
        "Hardened the review step with a multi-LLM fan-out (reusing my mcp-second-opinion pattern) that queries OpenAI and Anthropic in parallel and blocks on any security veto, falling back to single-LLM review so a provider outage degrades quality instead of failing the run.",
        "Deployed the containerized service on Lambda and Step Functions with JWT authentication, DynamoDB state, SQS failure handling, and Secrets Manager; provisioned the stack through Terraform and GitHub Actions OIDC, with 94 passing tests and no long-lived AWS credentials.",
      ],
    },
    {
      title: "EvalBench",
      subtitle: "Multi-Provider LLM Eval Platform",
      period: "Not specified",
      githubUrl: "https://github.com/akashpersetti/evalbench",
      liveUrl: "https://evalbench.akashpersetti.com",
      tech: [
        "FastAPI",
        "LiteLLM",
        "Next.js",
        "Terraform",
      ],
      bullets: [
        "Architected a pluggable-suite eval harness where every benchmark emits one shared MetricRecord contract persisted to a single JSON-column table, so adding a suite is a three-file change that never touches the runner, store, or dashboard core.",
        "Shipped 3 benchmark suites on that harness: structured-output reliability (schema-valid rate, retries-to-valid, retry-only cost accounting), latency/cost with pairwise judge scoring, and RAG with recall@k, nDCG@k, and faithfulness across swappable chunking strategies.",
        "Ran 27 evaluation runs across 75 tasks and 7 model/config variants, surfacing an 8-point first-attempt schema-validity gap between providers on structured output and a p95 latency spread of 6.0s vs 9.4s; found that semantic chunking doubled RAG context precision (0.13 to 0.26) over fixed-window at comparable faithfulness.",
        "Hand-implemented statistically honest aggregation, attaching 95% Wilson intervals to proportions and binomial order-statistic intervals to p95 latency, with per-metric sample sizes on every leaderboard cell so no aggregate renders as a bare mean.",
        "Deployed serverless on AWS: dual Lambda (API plus async runner), API Gateway v2, CloudFront, DynamoDB run tracking, and SES magic-link auth; backed by 262 passing tests using injected LiteLLM callables and temporary SQLite databases, running the full suite with no provider calls or model cost.",
      ],
    },
    {
      title: "Wingman",
      subtitle: "Self-Evaluating Agentic Co-Worker",
      period: "Not specified",
      githubUrl: "https://github.com/akashpersetti/wingman",
      liveUrl: "https://wingman.akashpersetti.com",
      tech: [
        "LangGraph",
        "FastAPI",
        "Lambda",
        "DynamoDB",
      ],
      bullets: [
        "Designed a worker-evaluator state machine in LangGraph where a structured-output evaluator checks worker responses against user-defined criteria and reinjects feedback for up to 5 retry turns, raising answer-validity rates before surfacing a result.",
        "Made the agent serverless-safe by reconstructing LangGraph state from DynamoDB on every request instead of an in-memory checkpointer, eliminating cold-start state loss across Lambda invocations.",
        "Integrated 5 tool domains through LangChain ToolNode and bind tools: web search (Serper), Wikipedia, sandboxed Python REPL, sandboxed file I/O, and Pushover notifications, and shipped the full serverless stack (containerized FastAPI on ECR, Lambda, API Gateway v2, CloudFront) via the same OIDC pipeline.",
      ],
    },
    {
      title: "Twin",
      subtitle: "AI Digital Twin + Live Eval Dashboard",
      period: "Not specified",
      githubUrl: "https://github.com/akashpersetti/twin",
      liveUrl: "https://akashpersetti.com",
      tech: [
        "FastAPI",
        "Next.js",
        "AWS Bedrock",
        "Lambda",
        "S3",
      ],
      bullets: [
        "Built a streaming personal-website agent using Titan-embedding retrieval over a persona corpus, grounded in a profile assembled at Lambda cold-start from a LinkedIn PDF, career summary, and style guide (parsed via pypdf) and injected into a Bedrock Claude Sonnet system prompt.",
        "Shipped a public evals dashboard scoring retrieval quality (recall@k, nDCG@k) on 35 labeled queries per push and LLM-judged faithfulness on live traffic via an S3-event-driven judge Lambda that adds zero latency to chat responses.",
        "Cut full-stack deployment to a single command across dev, test, and prod by chaining Docker build, Lambda upload, Terraform apply, Next.js export, S3 sync, and CloudFront invalidation through GitHub Actions and AWS OIDC.",
      ],
    },
    {
      title: "mcp-second-opinion",
      subtitle: "Open-Source MCP Server, Published to PyPI",
      period: "Not specified",
      liveUrl: "https://pypi.org/project/mcp-second-opinion",
      tech: ["Python"],
      bullets: [
        "Built and published an MIT-licensed MCP server that lets any MCP-aware agent consult rival LLMs (OpenAI, Gemini, Anthropic, Grok) mid-conversation, exposing two tools: one to query a single model and one to fan out to all enabled providers in parallel and compare answers.",
        "Unified four provider APIs behind a single LiteLLM interface, returning per-call latency, token counts, and cost; gracefully disables providers with no API key instead of failing, and ships as a pip-installable CLI (71 downloads in its first month) registered through standard MCP client config.",
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
      period: "Aug 2024 - May 2026 (Graduated)",
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
      period: "2020 - 2024",
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
      period: "Oct 2022 - Jan 2023",
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
