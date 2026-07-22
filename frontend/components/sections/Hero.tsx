'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowRight, Github, Linkedin, Mail, PenLine } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { resume } from '@/data/resume';

const downloadFilename = `${resume.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

const SOCIALS = [
  { href: resume.basics.githubUrl,      Icon: Github,   label: 'GitHub' },
  { href: resume.basics.linkedinUrl,    Icon: Linkedin, label: 'LinkedIn' },
  { href: resume.basics.devToUrl,       Icon: PenLine,  label: 'dev.to' },
  { href: 'mailto:akash.hp@icloud.com', Icon: Mail,     label: 'Email' },
];

export default function Hero({ onTwinOpen }: { onTwinOpen?: () => void }) {
  const reduced = useReducedMotion();
  const [showTwinTip, setShowTwinTip] = useState(false);
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  });

  /* One-shot coach-mark nudging first-time visitors toward the twin trigger */
  useEffect(() => {
    if (sessionStorage.getItem('twin_tip_seen')) return;
    const show = setTimeout(() => setShowTwinTip(true), 2200);
    const hide = setTimeout(() => dismissTwinTip(), 8200);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  function dismissTwinTip() {
    setShowTwinTip(false);
    sessionStorage.setItem('twin_tip_seen', '1');
  }

  function handleTwinOpen() {
    dismissTwinTip();
    onTwinOpen?.();
  }

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

          {/* LEFT: cards (mirror of reference) */}
          <motion.div className="order-2 lg:order-1 lg:col-span-5 space-y-6" {...fade(0.35)}>
            {/* Twin trigger card */}
            <div className="relative">
              <AnimatePresence>
                {showTwinTip && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium shadow-lg z-10"
                    style={{ background: 'rgba(9,9,11,0.96)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <span
                      className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r"
                      style={{ background: 'rgba(9,9,11,0.96)', borderColor: 'var(--border)' }}
                    />
                    👋 Psst, try asking my twin something
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={handleTwinOpen}
                className="twin-glow group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/avatar.png" alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-white">Ask my twin anything</span>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: '#a1a1aa' }}>RAG-powered, faithfulness scored live</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>

          {/* RIGHT: text */}
          <div className="order-1 lg:order-2 lg:col-span-7 space-y-8">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-normal leading-[1.02]"
              {...fade(0.05)}
            >
              <span className="bg-gradient-to-br from-white via-zinc-200 to-amber-300/80 bg-clip-text text-transparent">
                Akash Persetti.
              </span>
              <br />
              <span className="text-white">AI that shows its work.</span>
            </motion.h1>

            <motion.p className="max-w-xl text-lg leading-relaxed" style={{ color: '#d4d4d8' }} {...fade(0.15)}>
              Most days I&apos;m wiring LangGraph agents, benchmarking LLMs across providers with
              EvalBench, or shipping FastAPI and Next.js apps serverless on AWS. This site runs on
              a RAG-powered digital twin I built, with its faithfulness scored live.
            </motion.p>

            <motion.p
              className="max-w-xl text-[15px] leading-relaxed border-l border-white/10 pl-4"
              style={{ color: '#71717a' }}
              {...fade(0.22)}
            >
              Evals before vibes: every model claim gets benchmarked.
              M.S. Computer Science, Indiana University Bloomington.
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
