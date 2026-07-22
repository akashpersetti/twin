'use client';

import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';

const CONFIG = `agentic {
  goal: "Build AI systems that do real work"
  focus: [
    "Multi-agent orchestration (LangGraph)",
    "Structured outputs & LLM evals",
    "RAG with real retrieval metrics",
    "Deploy serverless, measure relentlessly"
  ]
  looking_for: ["AI Engineer", "SWE", "collabs", "hard problems"]
}`;

const TAGS = [
  'LLM evaluation',
  'Agentic systems',
  'Multi-agent pipelines',
  'Structured outputs',
  'RAG architectures',
  'Real-time feedback loops',
];

export default function Objective() {
  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Career Objective"
          title="What I'm building toward"
          description="Shipping AI systems that handle real constraints — orchestration, evaluation, and deployment at scale."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Config Block (left) */}
          <SectionReveal>
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl" style={{ background: 'rgba(251,191,36,0.03)' }} />
              <pre className="relative z-10 font-mono text-xs leading-relaxed overflow-x-auto" style={{ color: '#d4d4d8' }}>
                <code>
                  {CONFIG.split('\n').map((line, i) => {
                    const isBrace = line.includes('{') || line.includes('}');
                    const isKey = line.match(/^\s*\w+:/);
                    const isBracket = line.includes('[') || line.includes(']');

                    return (
                      <div key={i}>
                        <span style={{ color: isBrace || isBracket ? 'rgba(251,191,36,0.8)' : 'inherit' }}>
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            </div>
          </SectionReveal>

          {/* Tag Chips (right) */}
          <SectionReveal delay={0.1}>
            <div className="flex flex-col justify-between h-full gap-6">
              <div className="flex flex-wrap gap-3">
                {TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="mono inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium"
                    style={{ color: '#d4d4d8' }}
                  >
                    {'< '}
                    <span className="font-semibold">{tag}</span>
                    {' />'}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                Excited to join teams tackling multi-agent orchestration, LLM evaluation, and systems that measure their own quality. Open to remote, hybrid, or on-site opportunities.
              </p>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
