'use client';

import { motion } from 'framer-motion';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';

const CATEGORY_LABELS: Record<string, string> = {
  languages:   'Languages',
  databases:   'Databases',
  development: 'Development',
  ml:          'Machine Learning',
  genai:       'Generative AI & LLMs',
  agentic:     'Agentic AI',
  cloud:       'Cloud Platforms',
  devops:      'CI/CD & DevOps',
};

export default function Skills() {
  const entries = Object.entries(resume.skills) as [keyof typeof resume.skills, readonly string[]][];

  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          eyebrow="Toolbox"
          title="Skills"
          description="The languages, frameworks, and platforms I reach for when building and shipping AI systems."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map(([key, items], gi) => (
            <SectionReveal key={key} delay={gi * 0.05}>
              <div className="glass glass-hover p-5 h-full">
                <h3 className="eyebrow mb-3">{CATEGORY_LABELS[key]}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill, si) => (
                    <motion.span
                      key={skill}
                      className="mono text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: '#d4d4d8',
                        border: '1px solid var(--border)',
                      }}
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
          ))}
        </div>
      </div>
    </section>
  );
}
