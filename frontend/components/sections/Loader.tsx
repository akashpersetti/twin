'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Square around the monogram */}
      <div className="relative mb-8 flex items-center justify-center" style={{ width: 220, height: 160 }}>
        {/* Static square outline */}
        <div className="absolute inset-0 border" style={{ borderColor: 'var(--border)' }} />

        {/* Bolder accent line tracing the border — completion drives page load */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <motion.rect
            x="1"
            y="1"
            width="98"
            height="98"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            onAnimationComplete={onComplete}
          />
        </svg>

        {/* Monogram */}
        <motion.div
          className="flex gap-1"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          initial="hidden"
          animate="show"
        >
          {['A', 'H', 'P'].map(letter => (
            <motion.span
              key={letter}
              className="font-display text-7xl font-normal tracking-tight"
              style={{ color: 'var(--accent)' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.p
        className="mono text-[10px] uppercase tracking-[0.3em]"
        style={{ color: 'var(--text-tertiary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Est. 2026 - Bloomington, IN
      </motion.p>
    </motion.div>
  );
}
