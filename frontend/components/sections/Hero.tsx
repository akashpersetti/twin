'use client';

import { motion } from 'framer-motion';
import { Download, ArrowRight, Github, Linkedin, Mail, PenLine, Brain, Star } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { resume } from '@/data/resume';

const downloadFilename = `${resume.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

/** Infinite marquee — logos in /public/brands/ */
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

const SOCIALS = [
  { href: resume.basics.githubUrl,      Icon: Github,   label: 'GitHub' },
  { href: resume.basics.linkedinUrl,    Icon: Linkedin, label: 'LinkedIn' },
  { href: resume.basics.devToUrl,       Icon: PenLine,  label: 'dev.to' },
  { href: 'mailto:akash.hp@icloud.com', Icon: Mail,     label: 'Email' },
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
      {/* Layered dark background */}
      <div className="absolute inset-0 hero-bg" aria-hidden>
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute inset-0 hero-aurora" />
        <div className="absolute inset-0 hero-grain" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #09090b, transparent 30%, transparent 75%, rgba(9,9,11,0.6))' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-32 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-10 items-center">

          {/* LEFT — cards (mirror of reference) */}
          <motion.div className="order-2 lg:order-1 lg:col-span-5 space-y-6" {...fade(0.35)}>
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
          </motion.div>

          {/* RIGHT — text */}
          <div className="order-1 lg:order-2 lg:col-span-7 space-y-8">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-normal leading-[1.02]"
              {...fade(0.05)}
            >
              Hello, I&apos;m{' '}
              <span className="bg-gradient-to-br from-white via-zinc-200 to-amber-300/80 bg-clip-text text-transparent">
                Akash Persetti
              </span>
              <br />
              <span className="text-white">AI Engineer</span>
            </motion.h1>

            <motion.p className="max-w-xl text-lg leading-relaxed" style={{ color: '#d4d4d8' }} {...fade(0.15)}>
              AI Engineer at MyEdMaster — building adaptive AI tutoring that assesses what a learner
              already knows and teaches only the gaps. M.S. Computer Science, Indiana University Bloomington.
            </motion.p>

            <motion.p
              className="max-w-xl text-[15px] leading-relaxed border-l border-white/10 pl-4"
              style={{ color: '#71717a' }}
              {...fade(0.22)}
            >
              Day-to-day: LangGraph pipelines, structured outputs, RAG with real retrieval metrics —
              evals before vibes, every model claim gets benchmarked.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4" {...fade(0.3)}>
              <a
                href="/resume.pdf"
                download={downloadFilename}
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: '#fafafa', color: '#09090b' }}
              >
                <Download className="w-4 h-4" />
                View resume
              </a>
              <a
                href="#projects"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20"
              >
                View projects
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.div className="flex flex-wrap items-center gap-5" {...fade(0.4)}>
              <span className="text-xs uppercase tracking-widest" style={{ color: '#71717a' }}>Find me on</span>
              <div className="h-px flex-1 max-w-[40px] bg-white/10" />
              {SOCIALS.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20"
                  style={{ color: '#a1a1aa' }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
