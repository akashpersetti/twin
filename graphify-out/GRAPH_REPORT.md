# Graph Report - .  (2026-07-14)

## Corpus Check
- 119 files · ~187,470 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 638 nodes · 851 edges · 50 communities (32 shown, 18 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.83)
- Token cost: 267,153 input · 0 output

## Community Hubs (Navigation)
- Frontend Root Layout & Shell
- Twin Backend Chat Pipeline
- Akash Persona Profile & Projects
- Twin Retrieval Eval Suite
- Blog Frontend Dependencies
- Blog Frontend TS Config
- Frontend TS Config
- Blog Lambda CRUD API
- Frontend Lint & Tailwind Config
- Profile Retrieval Index Pipeline
- Blog Server Unit Tests
- Frontend UI Dependencies
- shadcn Component Config
- Bedrock Client & Live Judge Lambda
- Blog Post Pages & Rendering
- Eval Metrics (Recall/nDCG)
- Resume: Roles, Education, Certs
- Evals Dashboard Frontend
- Retrieval Unit Tests
- Server Live-Eval Capture Tests
- Eval Snapshot Upload Tests
- Blog Admin UI
- Resume Auto-Update Script
- Navbar & Mobile Drawer
- EncryptedText UI Effect
- Blog Frontend Root Layout
- GradientText UI Component
- Avatar Image & Site Owner
- Blog Frontend Next Config
- Next.js Env Types
- Blog Frontend PostCSS Config
- Frontend ESLint Config
- Frontend Next Config
- Frontend PostCSS Config
- Deploy Shell Script
- Destroy Shell Script
- python-dotenv Dependency
- python-multipart Dependency
- pyyaml Dependency
- App Icon / Favicon
- File Icon (Next.js Boilerplate)
- Globe Icon (Next.js Boilerplate)
- Window Icon (Next.js Boilerplate)
- Backend Package

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
- `frontend README (create-next-app bootstrap)` --conceptually_related_to--> `Twin - AI Digital Twin Project`  [AMBIGUOUS]
  frontend/README.md → README.md
- `server.call_bedrock` --shares_data_with--> `Twin (Streaming AI Digital Twin)`  [INFERRED]
  evals/REPORT.md → backend/data/akash_persetti_profile.txt
- `amazon.titan-embed-text-v2:0` --shares_data_with--> `Twin (Streaming AI Digital Twin)`  [INFERRED]
  evals/REPORT.md → backend/data/akash_persetti_profile.txt
- `Deploy Digital Twin Workflow (deploy.yml)` --semantically_similar_to--> `Deploy Blog Workflow (blog-deploy.yml)`  [INFERRED] [semantically similar]
  .github/workflows/deploy.yml → .github/workflows/blog-deploy.yml
- `Deploy Digital Twin Workflow (deploy.yml)` --conceptually_related_to--> `Working-directory constraint: run from backend/ due to relative data paths`  [INFERRED]
  .github/workflows/deploy.yml → evals/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI/CD Deploy Pipeline: Lambda + Terraform + Frontend + Blog Sync** — github_workflows_deploy_yml_deploy_job, readme_scripts_deploy_sh, readme_terraform_iac, github_workflows_blog_deploy_yml_deploy_blog_job [EXTRACTED 1.00]
- **Persona System Prompt Assembly from Four Source Files** — readme_persona_system, readme_backend_data_facts_json, readme_backend_data_summary_txt, readme_backend_data_style_txt, readme_backend_data_linkedin_pdf [EXTRACTED 1.00]
- **Streaming Chat Flow: Frontend to Backend to Bedrock** — readme_frontend_twin_tsx, readme_backend_server_py, readme_ai_model_claude_sonnet4, readme_streaming_architecture [EXTRACTED 1.00]
- **Twin Persona Assembly Pipeline (profile + summary + style -> Bedrock system prompt)** — backend_data_akash_persetti_profile_akash_hadagali_persetti, backend_data_summary_digital_twin_persona_summary, backend_data_style_communication_style_guide, backend_data_akash_persetti_profile_persona_assembly_lambda_cold_start [INFERRED 0.85]
- **Eval Harness Source-Material Gap (run_eval, judge_answer, facts.json, summary.txt)** — evals_report_run_eval_py, evals_report_judge_answer, evals_report_facts_json, backend_data_summary_digital_twin_persona_summary, evals_report_context_py [EXTRACTED 1.00]
- **Backend Runtime/Deployment Stack (FastAPI + Mangum + boto3 + pypdf on Lambda)** — backend_requirements_fastapi, backend_requirements_mangum, backend_requirements_boto3, backend_requirements_pypdf [INFERRED 0.85]

## Communities (50 total, 18 thin omitted)

### Community 0 - "Frontend Root Layout & Shell"
Cohesion: 0.07
Nodes (23): inter, jetbrainsMono, metadata, ScrollProgress(), Hero(), LoaderProps, CATEGORY_LABELS, mdComponents (+15 more)

### Community 1 - "Twin Backend Chat Pipeline"
Cohesion: 0.07
Nodes (37): prompt(), build_bedrock_messages(), call_bedrock(), capture_live_eval(), chat(), chat_stream(), ChatRequest, ChatResponse (+29 more)

### Community 2 - "Akash Persona Profile & Projects"
Cohesion: 0.06
Nodes (45): Akash Hadagali Persetti, ask_other_model tool, ask_the_panel tool, Graph-Based Debt Simplification Algorithm, Hallucination and Prompt-Injection Hardening, Indiana University Bloomington (M.S. Computer Science), LangGraph Worker-Evaluator State Machine, Laxora.ai (+37 more)

### Community 3 - "Twin Retrieval Eval Suite"
Cohesion: 0.06
Nodes (41): evals/judge.py (LLM-judge faithfulness), evals/queries.json (35 queries), evals/REPORT.md, evals/results/results.json, evals/run_eval.py, evals/tests/ (unit tests, no AWS calls), Twin Retrieval Eval Suite, Working-directory constraint: run from backend/ due to relative data paths (+33 more)

### Community 4 - "Blog Frontend Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, gray-matter, highlight.js, next, react, react-dom, react-markdown, rehype-highlight (+30 more)

### Community 5 - "Blog Frontend TS Config"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+22 more)

### Community 6 - "Frontend TS Config"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 7 - "Blog Lambda CRUD API"
Cohesion: 0.16
Nodes (25): create_post(), CreatePostRequest, delete_post(), DeleteRequest, find_post_key(), get_admin_token(), get_github_pat(), get_post() (+17 more)

### Community 8 - "Frontend Lint & Tailwind Config"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 9 - "Profile Retrieval Index Pipeline"
Cohesion: 0.15
Nodes (19): build_index(), main(), Chunk, chunk_profile_text(), cosine_similarity(), embed_text(), get_bedrock_client(), get_chunk() (+11 more)

### Community 10 - "Blog Server Unit Tests"
Cohesion: 0.13
Nodes (13): auth(), Pin cached SSM values and bucket name for every test., reset_state(), test_create_post_writes_to_drafts(), test_delete_removes_file(), test_delete_requires_confirm_flag(), test_get_post_not_found_returns_404(), test_get_post_returns_body() (+5 more)

### Community 11 - "Frontend UI Dependencies"
Cohesion: 0.10
Nodes (21): clsx, framer-motion, dependencies, clsx, framer-motion, lucide-react, motion, next (+13 more)

### Community 12 - "shadcn Component Config"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 13 - "Bedrock Client & Live Judge Lambda"
Cohesion: 0.14
Nodes (6): handler(), process_record(), _s3_event(), test_handler_processes_all_records_in_event(), _build_judge_prompt(), judge_answer()

### Community 14 - "Blog Post Pages & Rendering"
Cohesion: 0.21
Nodes (13): Home(), generateMetadata(), generateStaticParams(), PostPage(), PostBody(), sanitizeMarkdown(), PostCard(), CONTENT_DIR (+5 more)

### Community 16 - "Resume: Roles, Education, Certs"
Cohesion: 0.21
Nodes (17): AI Engineer at MyEdMaster LLC (Jun 2026 - Present), Akash Hadagali Persetti, Certification: Introduction to Machine Learning - NPTEL / IIT Madras (2023), Certification: Proficient AI Engineer - Ed Donner / The AI Engineer track (2026), M.S. Computer Science, Indiana University Bloomington (2026), B.Eng. Computer Science and Engineering, The National Institute of Engineering, Mysuru (2020-2024), Machine Learning Intern at MyEdMaster LLC (Jun 2025 - Aug 2025), mcp-second-opinion - Open-Source MCP Server on PyPI (+9 more)

### Community 17 - "Evals Dashboard Frontend"
Cohesion: 0.17
Nodes (6): DateRange, groupByDay(), LiveEntry, LiveFaithfulnessChart(), QueryResult, SnapshotSummary

### Community 18 - "Retrieval Unit Tests"
Cohesion: 0.19
Nodes (4): _sample_index(), test_get_chunk_raises_for_unknown_id(), test_get_chunk_returns_matching_chunk(), test_retrieve_ranks_by_similarity_with_given_index()

### Community 19 - "Server Live-Eval Capture Tests"
Cohesion: 0.25
Nodes (5): _fake_chunk(), test_capture_live_eval_failure_does_not_raise(), test_capture_live_eval_noop_when_bucket_unset(), test_capture_live_eval_writes_expected_shape(), test_chat_endpoint_still_200s_when_capture_fails()

### Community 20 - "Eval Snapshot Upload Tests"
Cohesion: 0.27
Nodes (6): _avg(), build_snapshot(), _category_stats(), compute_aggregate(), main(), upload_snapshot()

### Community 21 - "Blog Admin UI"
Cohesion: 0.31
Nodes (9): authHeader(), BlogManager(), btnStyle(), inputStyle(), Post, PostDetail, PostForm, slugify() (+1 more)

### Community 22 - "Resume Auto-Update Script"
Cohesion: 0.50
Nodes (8): AsyncOpenAI, Path, extract_pdf_text(), main(), update_facts_json(), update_resume_ts(), update_summary_txt(), validate_ts()

### Community 23 - "Navbar & Mobile Drawer"
Cohesion: 0.28
Nodes (5): MobileDrawerProps, NavItem, NAV_ITEMS, Navbar(), useScrollSpy()

### Community 24 - "EncryptedText UI Effect"
Cohesion: 0.52
Nodes (5): EncryptedText(), EncryptedTextProps, generateGibberishPreservingSpaces(), generateRandomCharacter(), cn()

### Community 25 - "Blog Frontend Root Layout"
Cohesion: 0.40
Nodes (3): inter, jetbrainsMono, metadata

### Community 27 - "Avatar Image & Site Owner"
Cohesion: 0.67
Nodes (3): Avatar Photo, Portfolio Website (frontend), Site Owner / Portfolio Subject

## Ambiguous Edges - Review These
- `Twin - AI Digital Twin Project` → `frontend README (create-next-app bootstrap)`  [AMBIGUOUS]
  frontend/README.md · relation: conceptually_related_to
- `backend/data/facts.json` → `backend/data/profile_index.json (embedding index)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Twin - Streaming AI Digital Twin` → `M.S. Computer Science, Indiana University Bloomington (2026)`  [AMBIGUOUS]
  frontend/public/resume.pdf · relation: conceptually_related_to

## Knowledge Gaps
- **183 isolated node(s):** `backend`, `inter`, `jetbrainsMono`, `metadata`, `CONTENT_DIR` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Twin - AI Digital Twin Project` and `frontend README (create-next-app bootstrap)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `backend/data/facts.json` and `backend/data/profile_index.json (embedding index)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Twin - Streaming AI Digital Twin` and `M.S. Computer Science, Indiana University Bloomington (2026)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `Frontend UI Dependencies` to `Frontend Lint & Tailwind Config`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `build_bedrock_messages()` (e.g. with `prompt()` and `test_greet_sentinel_skips_retrieval_and_uses_summary_chunk()`) actually correct?**
  _`build_bedrock_messages()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Fire-and-forget GitHub Actions repository_dispatch.`, `Return S3 key (drafts/ or published/) or None if not found.`, `backend` to the rest of the system?**
  _202 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Root Layout & Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._