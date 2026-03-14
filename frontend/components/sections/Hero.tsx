'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Download, ChevronDown } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import { useReducedMotion } from '@/hooks/useReducedMotion';


export default function Hero() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const gridY = useTransform(scrollY, [0, 500], [0, reduced ? 0 : -150]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Grid background */}
      <motion.div className="absolute inset-0 bg-grid-mesh" style={{ y: gridY }} />

      {/* Radial spotlight - stronger now */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 50% 40% at 50% 48%, rgba(124,58,237,0.22) 0%, transparent 65%)',
            'radial-gradient(ellipse 30% 25% at 50% 46%, rgba(6,182,212,0.10) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Name */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-black mb-4 leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {['Akash', 'Hadagali Persetti'].map((line, i) => (
            <motion.span
              key={line}
              className="block"
              initial={{ opacity: 0, y: reduced ? 0 : 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduced ? 0 : i * 0.15, ease: 'easeOut' }}
            >
              {line}
            </motion.span>
          ))}
        </motion.h1>

        {/* Title */}
        <motion.p
          className="text-xl sm:text-2xl font-semibold mb-8"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.58 }}
        >
          <GradientText>MS Computer Science Student · ML + AI Engineer</GradientText>
        </motion.p>

        {/* Tagline */}
        <motion.p
          className="text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.72 }}
        >
          Building agentic AI systems, real-time ML pipelines, and full-stack applications.
          Currently pursuing my M.S. at Indiana University Bloomington.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.86 }}
        >
          <button
            onClick={() => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.45), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            View Experience
          </button>
          <a
            href="/resume.pdf"
            download="Akash_Hadagali_Persetti_Resume.pdf"
            className="px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            style={{
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25), 0 1px 2px rgba(255,255,255,0.04) inset',
            }}
          >
            <Download size={16} />
            Download Resume
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={reduced ? {} : { y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ color: 'var(--text-secondary)' }}
      >
        <ChevronDown size={24} />
      </motion.div>
    </div>
  );
}
