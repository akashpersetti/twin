'use client';

import { motion } from 'framer-motion';
import { Download, ArrowRight, Github } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { resume } from '@/data/resume';
import { EncryptedText } from '@/components/ui/encrypted-text';

const downloadFilename = `${resume.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

/** Infinite marquee — logos in /public/brands/ (single-color #fff for dark UI) */
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

export default function Hero() {
  const reduced = useReducedMotion();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Layered dark background — glow + aurora + grain */}
      <div className="absolute inset-0 hero-bg" aria-hidden>
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute inset-0 hero-aurora" />
        <div className="absolute inset-0 hero-grain" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #09090b, transparent 30%, transparent 75%, rgba(9,9,11,0.6))' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center pt-20">
        {/* Eyebrow / status */}
        <motion.div
          className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full"
          style={{ background: 'var(--accent-wash)', border: '1px solid var(--surface-tint)' }}
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
          <span className="mono text-xs font-semibold tracking-wide" style={{ color: 'var(--accent-hover)' }}>
            AI Engineer @ MyEdMaster · Open to opportunities
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.05] mb-6"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
        >
          <EncryptedText
            text="Building adaptive AI that meets people"
            revealDelayMs={22}
            flipDelayMs={30}
            encryptedClassName="opacity-40"
          />
          <br className="hidden sm:block" />{' '}
          <EncryptedText
            text="where they are."
            revealDelayMs={22}
            flipDelayMs={30}
            encryptedClassName="opacity-40"
            revealedClassName="text-[var(--accent)]"
          />
        </motion.h1>

        {/* Subhead */}
        <motion.p
          className="text-base sm:text-lg max-w-2xl mx-auto mb-4 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.22 }}
        >
          LLM evaluation &amp; agentic systems | Building EvalBench: multi-provider benchmarks for
          structured output, latency/cost, RAG | LangGraph, FastAPI, AWS Bedrock | Open to AI
          Engineer &amp; SWE roles
        </motion.p>

        {/* Credential line */}
        <motion.p
          className="mono text-xs sm:text-sm mb-10"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          M.S. Computer Science, Indiana University Bloomington - Graduated May 2026
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={() => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#fafafa', color: '#09090b' }}
          >
            View Experience
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="/resume.pdf"
            download={downloadFilename}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)' }}
          >
            <Download size={16} />
            Download Resume
          </a>
          <a
            href="https://github.com/akashpersetti/twin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)' }}
          >
            <Github size={16} />
            Source Code
          </a>
        </motion.div>

        {/* Techstack marquee */}
        <motion.div
          className="relative z-10 w-full max-w-4xl mx-auto mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <p className="eyebrow text-center mb-5">Stack I work with</p>
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
                  <img
                    src={item.logoSrc}
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0"
                  />
                  <span className="text-lg font-normal tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
