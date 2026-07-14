# Graph Report - .  (2026-07-14)

## Corpus Check
- 15 files · ~188,243 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 668 nodes · 875 edges · 61 communities (38 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend Root Layout & Sections
- Chat API & Backend Server
- Professional Profile & Projects
- Blog Frontend Dependencies
- Eval Metrics & Retrieval Scoring
- TypeScript Config (Frontend)
- TypeScript Config (Blog Frontend)
- Blog CMS API
- Frontend Dev Tooling (ESLint/Tailwind)
- Profile Indexing & Retrieval
- Blog API Tests
- Frontend UI Animation Deps
- shadcn/ui Component Config
- Bedrock Client & Live Judge
- Blog Post Rendering
- AWS Infrastructure & Deploy Pipeline
- Career History & Credentials
- Retrieval Unit Tests
- Persona Data & Profile System
- Evals Dashboard UI
- Server Evals Endpoint Tests
- Eval Suite & CI Workflows
- Snapshot Upload & Aggregation
- Blog Admin UI
- Resume Sync Script
- Navbar & Mobile Drawer
- Encrypted Text Effect
- Blog Frontend Root Layout
- Chat Endpoints API Reference
- Date Range Filter Widget
- Twin Floating Chat Widget
- Gradient Text Component
- Portfolio Site & Owner
- AI Models & Streaming
- Next.js Config (Frontend)
- Next.js Type Declarations
- PostCSS Config (Frontend)
- ESLint Config (Frontend)
- Next.js Config (Blog Frontend)
- PostCSS Config (Blog Frontend)
- Deploy Shell Script
- Destroy Shell Script
- Python Dotenv Dependency
- Python Multipart Dependency
- PyYAML Dependency
- App Favicon Icon
- Next.js File Icon
- Next.js Globe Icon
- Next.js Window Icon
- Frontend README (Bootstrap)
- Backend Root Node
- Digital Twin Concept
- Twin Project Overview
- Destroy Script File Node
- Terraform Variables File

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `Akash Hadagali Persetti` - 16 edges
4. `build_bedrock_messages()` - 11 edges
5. `auth()` - 11 edges
6. `resume` - 11 edges
7. `SectionReveal()` - 9 edges
8. `useReducedMotion()` - 9 edges
9. `Akash Hadagali Persetti` - 9 edges
10. `Twin (Streaming AI Digital Twin)` - 9 edges

## Surprising Connections (you probably didn't know these)
- `server.call_bedrock` --shares_data_with--> `Twin (Streaming AI Digital Twin)`  [INFERRED]
  evals/REPORT.md → backend/data/akash_persetti_profile.txt
- `amazon.titan-embed-text-v2:0` --shares_data_with--> `Twin (Streaming AI Digital Twin)`  [INFERRED]
  evals/REPORT.md → backend/data/akash_persetti_profile.txt
- `Deploy Digital Twin Workflow (deploy.yml)` --conceptually_related_to--> `Working-directory constraint: run from backend/ due to relative data paths`  [INFERRED]
  .github/workflows/deploy.yml → evals/README.md
- `test_greet_sentinel_skips_retrieval_and_uses_summary_chunk()` --calls--> `build_bedrock_messages()`  [INFERRED]
  backend/tests/test_onboarding.py → backend/server.py
- `test_greet_sentinel_with_name_is_replaced()` --calls--> `build_bedrock_messages()`  [INFERRED]
  backend/tests/test_onboarding.py → backend/server.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Persona System Source Files** — backend_context_file, backend_data_facts_file, backend_data_summary_file, backend_data_style_file, backend_data_linkedin_file [EXTRACTED 1.00]
- **SSE Streaming Chat Request Flow** — readme_aws_api_gateway, readme_aws_lambda, readme_aws_bedrock, readme_aws_s3_memory [EXTRACTED 1.00]
- **Deployment Pipeline Components** — _github_workflows_deploy_file, scripts_deploy_file, terraform_main_file, backend_deploy_file [INFERRED 0.85]
- **CI/CD Deploy Pipeline: Lambda + Terraform + Frontend + Blog Sync** — github_workflows_deploy_yml_deploy_job, readme_scripts_deploy_sh, readme_terraform_iac, github_workflows_blog_deploy_yml_deploy_blog_job [EXTRACTED 1.00]
- **Twin Persona Assembly Pipeline (profile + summary + style -> Bedrock system prompt)** — backend_data_akash_persetti_profile_akash_hadagali_persetti, backend_data_summary_digital_twin_persona_summary, backend_data_style_communication_style_guide, backend_data_akash_persetti_profile_persona_assembly_lambda_cold_start [INFERRED 0.85]
- **Eval Harness Source-Material Gap (run_eval, judge_answer, facts.json, summary.txt)** — evals_report_run_eval_py, evals_report_judge_answer, evals_report_facts_json, backend_data_summary_digital_twin_persona_summary, evals_report_context_py [EXTRACTED 1.00]
- **Backend Runtime/Deployment Stack (FastAPI + Mangum + boto3 + pypdf on Lambda)** — backend_requirements_fastapi, backend_requirements_mangum, backend_requirements_boto3, backend_requirements_pypdf [INFERRED 0.85]

## Communities (61 total, 23 thin omitted)

### Community 0 - "Frontend Root Layout & Sections"
Cohesion: 0.07
Nodes (23): inter, jetbrainsMono, metadata, ScrollProgress(), Hero(), LoaderProps, CATEGORY_LABELS, mdComponents (+15 more)

### Community 1 - "Chat API & Backend Server"
Cohesion: 0.07
Nodes (37): prompt(), build_bedrock_messages(), call_bedrock(), capture_live_eval(), chat(), chat_stream(), ChatRequest, ChatResponse (+29 more)

### Community 2 - "Professional Profile & Projects"
Cohesion: 0.06
Nodes (45): Akash Hadagali Persetti, ask_other_model tool, ask_the_panel tool, Graph-Based Debt Simplification Algorithm, Hallucination and Prompt-Injection Hardening, Indiana University Bloomington (M.S. Computer Science), LangGraph Worker-Evaluator State Machine, Laxora.ai (+37 more)

### Community 3 - "Blog Frontend Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, gray-matter, highlight.js, next, react, react-dom, react-markdown, rehype-highlight (+30 more)

### Community 4 - "Eval Metrics & Retrieval Scoring"
Cohesion: 0.06
Nodes (5): f1_at_k(), precision_at_k(), recall_at_k(), main(), run_all()

### Community 5 - "TypeScript Config (Frontend)"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+22 more)

### Community 6 - "TypeScript Config (Blog Frontend)"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 7 - "Blog CMS API"
Cohesion: 0.16
Nodes (25): create_post(), CreatePostRequest, delete_post(), DeleteRequest, find_post_key(), get_admin_token(), get_github_pat(), get_post() (+17 more)

### Community 8 - "Frontend Dev Tooling (ESLint/Tailwind)"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 9 - "Profile Indexing & Retrieval"
Cohesion: 0.15
Nodes (19): build_index(), main(), Chunk, chunk_profile_text(), cosine_similarity(), embed_text(), get_bedrock_client(), get_chunk() (+11 more)

### Community 10 - "Blog API Tests"
Cohesion: 0.13
Nodes (13): auth(), Pin cached SSM values and bucket name for every test., reset_state(), test_create_post_writes_to_drafts(), test_delete_removes_file(), test_delete_requires_confirm_flag(), test_get_post_not_found_returns_404(), test_get_post_returns_body() (+5 more)

### Community 11 - "Frontend UI Animation Deps"
Cohesion: 0.10
Nodes (21): clsx, framer-motion, dependencies, clsx, framer-motion, lucide-react, motion, next (+13 more)

### Community 12 - "shadcn/ui Component Config"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 13 - "Bedrock Client & Live Judge"
Cohesion: 0.13
Nodes (6): handler(), process_record(), _s3_event(), test_handler_processes_all_records_in_event(), _build_judge_prompt(), judge_answer()

### Community 14 - "Blog Post Rendering"
Cohesion: 0.21
Nodes (13): Home(), generateMetadata(), generateStaticParams(), PostPage(), PostBody(), sanitizeMarkdown(), PostCard(), CONTENT_DIR (+5 more)

### Community 15 - "AWS Infrastructure & Deploy Pipeline"
Cohesion: 0.21
Nodes (17): .github/workflows/deploy.yml, backend/deploy.py, ACM Certificate (TLS), API Gateway (HTTP v2), AWS Bedrock, CloudFront (CDN/HTTPS), IAM Role (Lambda to Bedrock+S3), Lambda (FastAPI/Mangum) (+9 more)

### Community 16 - "Career History & Credentials"
Cohesion: 0.21
Nodes (17): AI Engineer at MyEdMaster LLC (Jun 2026 - Present), Akash Hadagali Persetti, Certification: Introduction to Machine Learning - NPTEL / IIT Madras (2023), Certification: Proficient AI Engineer - Ed Donner / The AI Engineer track (2026), M.S. Computer Science, Indiana University Bloomington (2026), B.Eng. Computer Science and Engineering, The National Institute of Engineering, Mysuru (2020-2024), Machine Learning Intern at MyEdMaster LLC (Jun 2025 - Aug 2025), mcp-second-opinion - Open-Source MCP Server on PyPI (+9 more)

### Community 17 - "Retrieval Unit Tests"
Cohesion: 0.19
Nodes (4): _sample_index(), test_get_chunk_raises_for_unknown_id(), test_get_chunk_returns_matching_chunk(), test_retrieve_ranks_by_similarity_with_given_index()

### Community 18 - "Persona Data & Profile System"
Cohesion: 0.21
Nodes (12): backend/build_profile_index.py, backend/context.py, backend/data/akash_persetti_profile.txt, backend/data/facts.json, backend/data/linkedin.pdf, backend/data/profile_index.json, backend/data/style.txt, backend/data/summary.txt (+4 more)

### Community 19 - "Evals Dashboard UI"
Cohesion: 0.21
Nodes (5): groupByDay(), LiveEntry, LiveFaithfulnessChart(), QueryResult, SnapshotSummary

### Community 20 - "Server Evals Endpoint Tests"
Cohesion: 0.25
Nodes (5): _fake_chunk(), test_capture_live_eval_failure_does_not_raise(), test_capture_live_eval_noop_when_bucket_unset(), test_capture_live_eval_writes_expected_shape(), test_chat_endpoint_still_200s_when_capture_fails()

### Community 21 - "Eval Suite & CI Workflows"
Cohesion: 0.20
Nodes (11): evals/judge.py (LLM-judge faithfulness), evals/queries.json (35 queries), evals/REPORT.md, evals/results/results.json, evals/run_eval.py, evals/tests/ (unit tests, no AWS calls), Twin Retrieval Eval Suite, Working-directory constraint: run from backend/ due to relative data paths (+3 more)

### Community 22 - "Snapshot Upload & Aggregation"
Cohesion: 0.27
Nodes (6): _avg(), build_snapshot(), _category_stats(), compute_aggregate(), main(), upload_snapshot()

### Community 23 - "Blog Admin UI"
Cohesion: 0.31
Nodes (9): authHeader(), BlogManager(), btnStyle(), inputStyle(), Post, PostDetail, PostForm, slugify() (+1 more)

### Community 24 - "Resume Sync Script"
Cohesion: 0.50
Nodes (8): AsyncOpenAI, Path, extract_pdf_text(), main(), update_facts_json(), update_resume_ts(), update_summary_txt(), validate_ts()

### Community 25 - "Navbar & Mobile Drawer"
Cohesion: 0.28
Nodes (5): MobileDrawerProps, NavItem, NAV_ITEMS, Navbar(), useScrollSpy()

### Community 26 - "Encrypted Text Effect"
Cohesion: 0.52
Nodes (5): EncryptedText(), EncryptedTextProps, generateGibberishPreservingSpaces(), generateRandomCharacter(), cn()

### Community 27 - "Blog Frontend Root Layout"
Cohesion: 0.40
Nodes (3): inter, jetbrainsMono, metadata

### Community 28 - "Chat Endpoints API Reference"
Cohesion: 0.67
Nodes (3): backend/lambda_handler.py, backend/server.py, API Reference (chat endpoints)

### Community 30 - "Twin Floating Chat Widget"
Cohesion: 1.00
Nodes (3): frontend/components/twin.tsx, frontend/components/widgets/TwinFloatingButton.tsx, Twin Floating Chat Widget

### Community 32 - "Portfolio Site & Owner"
Cohesion: 0.67
Nodes (3): Avatar Photo, Portfolio Website (frontend), Site Owner / Portfolio Subject

### Community 33 - "AI Models & Streaming"
Cohesion: 0.67
Nodes (3): Claude Sonnet 4 (via Bedrock), Judge Model (Faithfulness Grading), Token Streaming via SSE

## Ambiguous Edges - Review These
- `Twin - Streaming AI Digital Twin` → `M.S. Computer Science, Indiana University Bloomington (2026)`  [AMBIGUOUS]
  frontend/public/resume.pdf · relation: conceptually_related_to

## Knowledge Gaps
- **190 isolated node(s):** `backend`, `inter`, `jetbrainsMono`, `metadata`, `CONTENT_DIR` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Twin - Streaming AI Digital Twin` and `M.S. Computer Science, Indiana University Bloomington (2026)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `Frontend UI Animation Deps` to `Frontend Dev Tooling (ESLint/Tailwind)`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `build_bedrock_messages()` (e.g. with `prompt()` and `test_greet_sentinel_skips_retrieval_and_uses_summary_chunk()`) actually correct?**
  _`build_bedrock_messages()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Fire-and-forget GitHub Actions repository_dispatch.`, `Return S3 key (drafts/ or published/) or None if not found.`, `backend` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Root Layout & Sections` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._
- **Should `Chat API & Backend Server` be split into smaller, more focused modules?**
  _Cohesion score 0.06775510204081632 - nodes in this community are weakly interconnected._
- **Should `Professional Profile & Projects` be split into smaller, more focused modules?**
  _Cohesion score 0.05757575757575758 - nodes in this community are weakly interconnected._