'use client';

import { Brain, Star } from 'lucide-react';

/** Infinite marquee: logos in /public/brands/ */
const STACK: { name: string; logoSrc: string }[] = [
  { name: 'LangGraph',   logoSrc: '/brands/langgraph.svg' },
  { name: 'FastAPI',     logoSrc: '/brands/fastapi.svg' },
  { name: 'AWS Bedrock', logoSrc: '/brands/awsbedrock.svg' },
  { name: 'Terraform',   logoSrc: '/brands/terraform.svg' },
  { name: 'Next.js',     logoSrc: '/brands/nextjs.svg' },
  { name: 'Python',      logoSrc: '/brands/python.svg' },
  { name: 'TypeScript',  logoSrc: '/brands/typescript.svg' },
  { name: 'LangChain',   logoSrc: '/brands/langchain.svg' },
  { name: 'DynamoDB',    logoSrc: '/brands/dynamodb.svg' },
  { name: 'React',       logoSrc: '/brands/react.svg' },
  { name: 'PostgreSQL',  logoSrc: '/brands/postgresql.svg' },
  { name: 'Docker',      logoSrc: '/brands/docker.svg' },
];

const FOCUS_ROWS = [
  { label: 'AI & Agents', detail: 'LangGraph · OpenAI SDK · MCP' },
  { label: 'Evals',       detail: 'EvalBench · LLM-as-judge · RAG' },
  { label: 'Platform',    detail: 'FastAPI · Next.js · AWS · Terraform' },
];

export default function StatsAndStack() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-16 lg:px-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stats card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="pointer-events-none absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: '#71717a' }}>Currently</div>
                  <div className="text-sm text-white">Building &amp; evaluating AI systems</div>
                </div>
              </div>
              <span className="mono text-[10px]" style={{ color: '#52525b' }}>v26.07</span>
            </div>

            <div className="h-px w-full bg-white/[0.08]" />

            <div className="space-y-2">
              {FOCUS_ROWS.map(({ label, detail }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3.5 py-2.5 border border-white/[0.05]">
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: '#a1a1aa' }}>{label}</span>
                  <span className="mono text-[11px]" style={{ color: '#d4d4d8' }}>{detail}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-wide" style={{ color: '#d4d4d8' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                ACTIVE
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-wide" style={{ color: '#d4d4d8' }}>
                <Star className="w-3 h-3" style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
                OPEN TO WORK
              </div>
            </div>
          </div>
        </div>

        {/* Marquee card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-8 backdrop-blur-xl">
          <h3 className="mb-6 px-8 text-sm" style={{ color: '#a1a1aa' }}>Stack &amp; tools I use</h3>
          <div
            className="relative flex overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            }}
          >
            <div className="animate-marquee flex gap-12 whitespace-nowrap px-4">
              {[...STACK, ...STACK].map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="flex items-center gap-2.5 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105 cursor-default"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.logoSrc} alt="" aria-hidden width={24} height={24} className="h-6 w-6 shrink-0" />
                  <span className="text-lg font-medium tracking-tight text-white">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
