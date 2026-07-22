'use client';

import { useState } from 'react';
import { Bot, Sparkles, Brain, Code2, Layers, Database, Cloud, Workflow, ChevronRight } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';

const SKILL_META: { key: keyof typeof resume.skills; title: string; icon: typeof Bot; blurb: string }[] = [
  { key: 'agentic',     title: 'Agentic AI',            icon: Bot,      blurb: 'Multi-agent pipelines that do real work: LangGraph orchestration, MCP tooling, structured handoffs, and retries that only rerun what failed.' },
  { key: 'genai',       title: 'Generative AI & LLMs',  icon: Sparkles, blurb: 'RAG with real retrieval metrics, LLM evaluation as a discipline (EvalBench), and provider-agnostic integrations across OpenAI, Bedrock, and Hugging Face.' },
  { key: 'ml',          title: 'Machine Learning',      icon: Brain,    blurb: 'Classical ML where it beats an LLM: clustering, classification, CNNs, and real-time computer vision with MediaPipe.' },
  { key: 'languages',   title: 'Languages',             icon: Code2,    blurb: 'Python for AI systems, TypeScript for products, SQL for truth. C++ and Java when the problem demands them.' },
  { key: 'development', title: 'Product Engineering',   icon: Layers,   blurb: 'FastAPI backends, Next.js and React frontends, React Native when it needs to be in your pocket. Shipped, not demoed.' },
  { key: 'databases',   title: 'Databases',             icon: Database, blurb: 'Relational when it matters, document when it fits, DynamoDB when it scales, plus vector stores for retrieval.' },
  { key: 'cloud',       title: 'Cloud',                 icon: Cloud,    blurb: 'AWS-first serverless: Lambda, API Gateway, S3, Bedrock. Provisioned as code, torn down as easily.' },
  { key: 'devops',      title: 'CI/CD & DevOps',        icon: Workflow, blurb: 'GitHub Actions pipelines, Docker images, Terraform for AWS and Azure. Deploys are boring by design.' },
];

export default function Skills() {
  const [active, setActive] = useState(0);
  const cur = SKILL_META[active];
  const ActiveIcon = cur.icon;
  const tags = resume.skills[cur.key];

  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Skill-Set"
          title="What I reach for"
          note="Agents first, evals always, then the stack to ship them."
        />

        <SectionReveal>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left rail */}
            <ul className="lg:col-span-5 border-y border-white/[0.06] divide-y divide-white/[0.06]">
              {SKILL_META.map(({ key, title, icon: Icon }, i) => {
                const on = i === active;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      onMouseEnter={() => setActive(i)}
                      className={`w-full flex items-center gap-4 py-4 text-left transition-colors ${on ? 'text-white' : 'hover:text-zinc-300'}`}
                      style={on ? {} : { color: '#71717a' }}
                    >
                      <span className="mono text-[11px] tabular-nums w-7 transition-colors" style={{ color: on ? 'var(--accent)' : '#3f3f46' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-sm font-medium tracking-tight">{title}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-all ${on ? 'opacity-100 translate-x-0 text-white' : 'opacity-0 -translate-x-2'}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Right detail pane */}
            <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
              <div key={active} className="skill-detail relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl" style={{ background: 'rgba(251,191,36,0.04)' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10">
                      <ActiveIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>
                      {String(active + 1).padStart(2, '0')} / {String(SKILL_META.length).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="text-2xl font-medium tracking-tight text-white mb-3">{cur.title}</h3>
                  <p className="text-sm leading-relaxed mb-7" style={{ color: '#a1a1aa' }}>{cur.blurb}</p>

                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span
                        key={t}
                        className="mono inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium"
                        style={{ color: '#d4d4d8' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
