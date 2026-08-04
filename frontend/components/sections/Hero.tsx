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
    <div className="relative min-h-screen w-full flex items-center overflow-hidden">
      {/* Flat background with grain texture */}
      <div className="absolute inset-0 hero-bg" aria-hidden>
        <div className="absolute inset-0 hero-grain" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-32 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-10 items-center lg:items-stretch">

          {/* LEFT: Twin chat panel */}
          <motion.div className="order-2 lg:order-1 lg:col-span-5 h-[70vh] min-h-0" {...fade(0.35)}>
            <TwinPanel />
          </motion.div>

          {/* RIGHT: text */}
          <div className="order-1 lg:order-2 lg:col-span-7 space-y-8">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-normal leading-[1.02]"
              style={{ color: 'var(--text-primary)' }}
              {...fade(0.05)}
            >
              Akash Persetti.
              <br />
              <span style={{ color: 'var(--accent)' }}>AI that shows its work.</span>
            </motion.h1>

            <motion.p className="max-w-xl text-lg leading-relaxed" style={{ color: 'var(--text-muted-strong)' }} {...fade(0.15)}>
              Most days I&apos;m wiring LangGraph agents, benchmarking LLMs across providers with
              EvalBench, or shipping FastAPI and Next.js apps serverless on AWS. This site runs on
              a RAG-powered digital twin I built, with its faithfulness scored live.
            </motion.p>

            <motion.p
              className="max-w-xl text-[15px] leading-relaxed border-l pl-4"
              style={{ color: 'var(--text-tertiary)', borderLeftColor: 'var(--border)' }}
              {...fade(0.22)}
            >
              Evals before vibes: every model claim gets benchmarked.
              M.S. Computer Science, Indiana University Bloomington.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4" {...fade(0.3)}>
              <a
                href="/resume.pdf"
                download={downloadFilename}
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold transition-colors"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
              >
                <Download className="w-4 h-4" />
                View resume
              </a>
              <a
                href="#projects"
                className="group inline-flex items-center justify-center gap-2 border px-8 py-3.5 text-sm font-semibold transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                View projects
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.div className="flex flex-wrap items-center gap-3" {...fade(0.4)}>
              <span className="mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Find me on</span>
              <div className="h-px flex-1 max-w-[40px]" style={{ background: 'var(--border)' }} />
              {SOCIALS.map(({ href, label }) => (
                <IconLinkButton key={label} href={href} label={label} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
