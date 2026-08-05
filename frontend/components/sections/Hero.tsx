'use client';

import { motion } from 'framer-motion';
import { Download, ArrowRight } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { resume } from '@/data/resume';
import TwinPanel from '@/components/widgets/TwinPanel';
import IconLinkButton from '@/components/ui/IconLinkButton';

const downloadFilename = `${resume.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

const SOCIALS = [
  { href: resume.basics.githubUrl, label: 'GitHub' },
  { href: resume.basics.linkedinUrl, label: 'LinkedIn' },
  { href: resume.basics.devToUrl, label: 'dev.to' },
  { href: 'mailto:akash.hp@icloud.com', label: 'Email' },
];

export default function Hero() {
  const reduced = useReducedMotion();
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  });

  return (
    <div className="relative w-full overflow-hidden">
      {/* Flat background with grain texture */}
      <div className="absolute inset-0 hero-bg" aria-hidden>
        <div className="absolute inset-0 hero-grain" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl w-full px-6 py-20 lg:px-12">
        <div className="grid grid-cols-1 border lg:grid-cols-12" style={{ borderColor: 'var(--border)' }}>
          {/* Left: Twin panel — big cell, spans the full row height */}
          <motion.div
            className="lg:col-span-6 h-[420px] lg:h-[560px] border-b lg:border-b-0 lg:border-r"
            style={{ borderColor: 'var(--border)' }}
            {...fade(0.15)}
          >
            <TwinPanel />
          </motion.div>

          {/* Right: two stacked cells, divided by a rule */}
          <div className="lg:col-span-6 flex flex-col">
            <motion.div
              className="flex-1 px-6 py-8 sm:px-10 sm:py-10 border-b flex items-center"
              style={{ borderColor: 'var(--border)' }}
              {...fade(0.05)}
            >
              <h1
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-normal leading-[1.08]"
                style={{ color: 'var(--text-primary)' }}
              >
                Akash Persetti.
                <br />
                <span style={{ color: 'var(--accent)' }}>AI that shows its work.</span>
              </h1>
            </motion.div>

            <motion.div className="flex-1 px-6 py-8 sm:px-10 sm:py-10 space-y-6" {...fade(0.22)}>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted-strong)' }}>
                Most days I&apos;m wiring LangGraph agents, benchmarking LLMs across providers with
                EvalBench, or shipping FastAPI and Next.js apps serverless on AWS. This site runs on
                a RAG-powered digital twin I built, with its faithfulness scored live.
              </p>

              <p
                className="text-sm leading-relaxed border-l pl-4"
                style={{ color: 'var(--text-tertiary)', borderLeftColor: 'var(--border)' }}
              >
                Evals before vibes: every model claim gets benchmarked.
                M.S. Computer Science, Indiana University Bloomington.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/resume.pdf"
                  download={downloadFilename}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors"
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
                >
                  <Download className="w-4 h-4" />
                  View resume
                </a>
                <a
                  href="#projects"
                  className="group inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  View projects
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Find me on</span>
                <div className="h-px flex-1 max-w-[40px]" style={{ background: 'var(--border)' }} />
                {SOCIALS.map(({ href, label }) => (
                  <IconLinkButton key={label} href={href} label={label} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
