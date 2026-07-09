'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Download, ArrowRight, Github } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { resume } from '@/data/resume';
import { EncryptedText } from '@/components/ui/encrypted-text';

const downloadFilename = `${resume.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

export default function Hero() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const gridY = useTransform(scrollY, [0, 500], [0, reduced ? 0 : -80]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Subtle light grid background */}
      <motion.div className="absolute inset-0 bg-grid-mesh" style={{ y: gridY }} />

      {/* Faint teal wash behind the headline */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 46% 38% at 50% 42%, rgba(94,234,212,0.18) 0%, transparent 70%)',
        }}
      />

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
          className="text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6"
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
          I&apos;m {resume.basics.name.split(' ')[0]}, an AI Engineer building an adaptive tutoring
          product at MyEdMaster — plus agentic systems and streaming LLM apps on AWS.
        </motion.p>

        {/* Credential line */}
        <motion.p
          className="mono text-xs sm:text-sm mb-10"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          M.S. Computer Science, Indiana University Bloomington — Graduated May 2026
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
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            View Experience
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="/resume.pdf"
            download={downloadFilename}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg-base)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-soft)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Download size={16} />
            Download Resume
          </a>
          <a
            href="https://github.com/akashpersetti/twin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg-base)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-soft)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Github size={16} />
            Source Code
          </a>
        </motion.div>
      </div>
    </div>
  );
}
