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

const half = Math.ceil(STACK.length / 2);
const STACK_ROW_1 = STACK.slice(0, half);
const STACK_ROW_2 = STACK.slice(half);

function MarqueeRow({ items }: { items: { name: string; logoSrc: string }[] }) {
  return (
    <div
      className="relative flex overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div className="animate-marquee flex gap-14 whitespace-nowrap px-4">
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex items-center gap-3.5 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105 cursor-default"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.logoSrc} alt="" aria-hidden width={32} height={32} className="h-8 w-8 shrink-0" />
            <span className="text-2xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsAndStack() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-16 lg:px-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stats card */}
        <div className="relative overflow-hidden border p-8" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                  <Brain className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>Currently</div>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Building &amp; evaluating AI systems</div>
                </div>
              </div>
              <span className="mono text-[10px]" style={{ color: 'var(--text-quaternary)' }}>v26.07</span>
            </div>

            <div className="h-px w-full" style={{ background: 'var(--border)' }} />

            <div className="space-y-2">
              {FOCUS_ROWS.map(({ label, detail }) => (
                <div key={label} className="flex items-center justify-between px-3.5 py-2.5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="mono text-[11px]" style={{ color: 'var(--text-muted-strong)' }}>{detail}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="tag tracking-wide" style={{ color: 'var(--text-muted-strong)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                ACTIVE
              </div>
              <div className="tag tracking-wide" style={{ color: 'var(--text-muted-strong)' }}>
                <Star className="w-3 h-3" style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
                OPEN TO WORK
              </div>
            </div>
          </div>
        </div>

        {/* Marquee card */}
        <div className="relative flex h-full flex-col overflow-hidden border py-8" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <h3 className="px-8 text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Stack &amp; tools I use</h3>
          <div className="flex flex-1 flex-col justify-evenly">
            <MarqueeRow items={STACK_ROW_1} />
            <MarqueeRow items={STACK_ROW_2} />
          </div>
        </div>
      </div>
    </div>
  );
}
