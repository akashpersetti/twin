'use client';

import { motion } from 'framer-motion';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';

const CATEGORY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  languages:   { label: 'Languages',           color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  databases:   { label: 'Databases',           color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  development: { label: 'Development',         color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  ml:          { label: 'Machine Learning',    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  genai:       { label: 'Generative AI & LLMs',color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  agentic:     { label: 'Agentic AI',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cloud:       { label: 'Cloud Platforms',     color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  devops:      { label: 'CI/CD & DevOps',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function Skills() {
  const entries = Object.entries(resume.skills) as [keyof typeof resume.skills, readonly string[]][];

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionReveal>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            Skills
          </h2>
          <div className="h-1 w-16 rounded-full mb-12" style={{ background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
        </SectionReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map(([key, items], gi) => {
            const style = CATEGORY_STYLES[key];
            return (
              <SectionReveal key={key} delay={gi * 0.05}>
                <div className="glass rounded-2xl p-5">
                  <h3
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: style.color }}
                  >
                    {style.label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill, si) => (
                      <motion.span
                        key={skill}
                        className="text-sm px-3 py-1 rounded-full font-medium"
                        style={{ background: style.bg, color: style.color }}
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: si * 0.04, duration: 0.2, ease: 'backOut' }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
