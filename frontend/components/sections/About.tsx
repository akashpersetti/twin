'use client';

import { motion } from 'framer-motion';
import SectionReveal from '@/components/ui/SectionReveal';

const COMMITS = [
  { hash: 'a3f9e12', type: 'feat',     msg: 'join MyEdMaster as AI Engineer: adaptive AI tutoring in production' },
  { hash: 'f81c440', type: 'feat',     msg: 'ship EvalBench, multi-provider LLM benchmarks: structured output, latency/cost, RAG' },
  { hash: '7d2b9ac', type: 'feat',     msg: 'build TerraformAgent: 6-node LangGraph pipeline generating validated IaC' },
  { hash: 'c5e0d71', type: 'feat',     msg: 'deploy digital twin: RAG-backed portfolio with live faithfulness evals' },
  { hash: '92ab3fe', type: 'refactor', msg: 'pivot focus → LLM evaluation & agentic systems' },
  { hash: '0c1d8b4', type: 'init',     msg: 'init: M.S. Computer Science @ Indiana University Bloomington' },
];

const TYPE_COLOR: Record<string, string> = {
  feat:     'var(--term-green)',
  refactor: 'var(--term-sky)',
  fix:      'var(--term-amber)',
  init:     '#71717a',
};

export default function About() {
  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-4xl mx-auto">
        <SectionReveal>
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-3">About</p>
              <h2 className="mono text-2xl sm:text-4xl font-normal tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                git log --author=&quot;Akash&quot;
              </h2>
            </div>
            <p className="text-sm max-w-xs sm:text-right" style={{ color: 'var(--text-secondary)' }}>
              Commit history of what matters. Newest first.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div
            className="mono rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'rgba(9,9,11,0.8)' }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: '#3f3f46' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: '#3f3f46' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: '#3f3f46' }} />
              <span className="ml-4 text-[11px]" style={{ color: '#52525b' }}>~/akash - zsh</span>
            </div>

            {/* Prompt line */}
            <div className="px-5 pt-4 pb-2 text-[12px]" style={{ color: '#71717a' }}>
              <span style={{ color: 'var(--term-green)' }}>akash</span>
              <span style={{ color: '#52525b' }}>@</span>
              <span style={{ color: 'var(--term-sky)' }}>twin</span>
              <span style={{ color: '#52525b' }}> % </span>
              <span style={{ color: 'var(--text-primary)' }}>git log --oneline --author=&quot;Akash&quot;</span>
            </div>

            {/* Commit rows: staggered reveal when scrolled into view */}
            <div className="px-5 pb-2">
              {COMMITS.map(({ hash, type, msg }, i) => (
                <motion.div
                  key={hash}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 * i, ease: 'easeOut' }}
                  className="flex items-baseline gap-3 py-1.5 group"
                  style={{ borderBottom: i === COMMITS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}
                >
                  <span className="shrink-0 w-16 text-[11px] font-medium" style={{ color: 'rgba(251,191,36,0.7)' }}>
                    {hash}
                  </span>
                  <span
                    className="shrink-0 w-16 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: TYPE_COLOR[type] ?? '#71717a' }}
                  >
                    {type}
                  </span>
                  <span
                    className="text-[13px] leading-snug transition-colors group-hover:text-white"
                    style={{ color: '#d4d4d8' }}
                  >
                    {msg}
                    {i === 0 && (
                      <span className="ml-2 text-[10px]" style={{ color: 'var(--term-sky)' }}>
                        (HEAD -&gt; main, origin/main)
                      </span>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Trailing prompt with blinking cursor */}
            <div className="px-5 pb-4 pt-1 text-[12px]">
              <span style={{ color: 'var(--term-green)' }}>akash</span>
              <span style={{ color: '#52525b' }}>@</span>
              <span style={{ color: 'var(--term-sky)' }}>twin</span>
              <span className="cursor-blink" style={{ color: '#52525b' }}> % </span>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
