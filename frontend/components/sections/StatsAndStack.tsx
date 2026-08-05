'use client';

import { Brain, Star } from 'lucide-react';

/** Infinite marquee: logos in /public/brands/. `whiteLogo: true` marks SVGs
    that are pure white fill/stroke with no background shape of their own —
    invisible against the light-mode white page background, so they need the
    `.invert-in-light` filter (see globals.css). */
const STACK: { name: string; logoSrc: string; whiteLogo?: boolean }[] = [
  { name: 'LangGraph',   logoSrc: '/brands/langgraph.svg', whiteLogo: true },
  { name: 'FastAPI',     logoSrc: '/brands/fastapi.svg' },
  { name: 'AWS Bedrock', logoSrc: '/brands/awsbedrock.svg', whiteLogo: true },
  { name: 'Terraform',   logoSrc: '/brands/terraform.svg' },
  { name: 'Next.js',     logoSrc: '/brands/nextjs.svg' },
  { name: 'Python',      logoSrc: '/brands/python.svg' },
  { name: 'TypeScript',  logoSrc: '/brands/typescript.svg' },
  { name: 'LangChain',   logoSrc: '/brands/langchain.svg', whiteLogo: true },
  { name: 'DynamoDB',    logoSrc: '/brands/dynamodb.svg', whiteLogo: true },
  { name: 'React',       logoSrc: '/brands/react.svg' },
  { name: 'PostgreSQL',  logoSrc: '/brands/postgresql.svg', whiteLogo: true },
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

function MarqueeRow({ items }: { items: { name: string; logoSrc: string; whiteLogo?: boolean }[] }) {
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
            className="flex items-center gap-3.5 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 cursor-default"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.logoSrc}
              alt=""
              aria-hidden
              width={32}
              height={32}
              className={`h-8 w-8 shrink-0 ${item.whiteLogo ? 'invert-in-light' : ''}`}
            />
            <span className="text-2xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsAndStack() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl w-full px-6 py-16 section-border" style={{ '--hover-tint': '#fce7f3' } as React.CSSProperties}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Stats */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center" style={{ border: '1px solid var(--border)' }}>
                <Brain className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>Currently</div>
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Building &amp; evaluating AI systems</div>
              </div>
            </div>
            <span className="mono text-[10px]" style={{ color: 'var(--text-quaternary)' }}>v26.07</span>
          </div>

          <div>
            {FOCUS_ROWS.map(({ label, detail }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</span>
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

        {/* Stack marquee */}
        <div className="flex flex-col justify-center border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-16" style={{ borderColor: 'var(--border)' }}>
          <h3 className="mb-4 text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Stack &amp; tools I use</h3>
          <div className="flex flex-col justify-evenly gap-4">
            <MarqueeRow items={STACK_ROW_1} />
            <MarqueeRow items={STACK_ROW_2} />
          </div>
        </div>
      </div>
    </div>
  );
}
