'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import { Calendar, RotateCcw } from 'lucide-react';

function FlipCard({ project, index }: { project: typeof resume.projects[number]; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <SectionReveal delay={index * 0.1}>
      {/* Perspective wrapper */}
      <div
        className="cursor-pointer"
        style={{ perspective: '1000px', height: '280px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Front */}
          <div
            className="glass rounded-2xl p-6 absolute inset-0 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div>
              <h3 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                {project.title}
              </h3>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--accent)' }}>
                {project.subtitle}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}
              >
                <Calendar size={10} /> {project.period}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Tap to expand →
              </span>
            </div>
          </div>

          {/* Back */}
          <div
            className="glass rounded-2xl p-5 absolute inset-0 flex flex-col gap-3 overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'var(--bg-alt)',
            }}
          >
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {project.title}
              </span>
              <RotateCcw size={13} style={{ color: 'var(--text-secondary)' }} />
            </div>

            <ul className="flex-1 space-y-2 overflow-y-auto">
              {project.bullets.map((bullet, bi) => (
                <li key={bi} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              {project.tech.map(t => (
                <span
                  key={t}
                  className="mono text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </SectionReveal>
  );
}

export default function Projects() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [expandedMobile, setExpandedMobile] = useState<number | null>(null);

  return (
    <section className="py-24 px-6" style={{ background: 'var(--bg-alt)' }}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Selected work"
          title="Projects"
          description="Agentic systems, LLM products, and ML pipelines, most shipped serverless on AWS via Terraform and GitHub Actions."
        />
        <p className="text-sm mb-8 -mt-6 mono" style={{ color: 'var(--text-secondary)' }}>Tap any card to read the details.</p>

        {/* Desktop: 3-col flip grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {resume.projects.map((project, i) => (
            <FlipCard key={project.title} project={project} index={i} />
          ))}
        </div>

        {/* Mobile: tap-to-expand accordion cards */}
        <div className="md:hidden flex flex-col gap-4">
          {resume.projects.map((project, i) => (
            <div
              key={project.title}
              className="glass rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setExpandedMobile(expandedMobile === i ? null : i)}
            >
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                    {project.title}
                  </h3>
                  <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    {project.subtitle}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                    style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}
                  >
                    <Calendar size={10} /> {project.period}
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: expandedMobile === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg flex-shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ↓
                </motion.span>
              </div>

              <AnimatePresence initial={false}>
                {expandedMobile === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
                      <ul className="mt-3 space-y-2 mb-3">
                        {project.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech.map(t => (
                          <span
                            key={t}
                            className="mono text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
