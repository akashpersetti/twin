'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionHeader from '@/components/ui/SectionHeader';

export default function Education() {
  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-4xl mx-auto">
        <SectionHeader eyebrow="Education" title="Formal pretraining" note="The degrees behind the demos." />

        <div>
          {resume.education.map((edu, i) => (
            <motion.div
              key={edu.institution}
              className="row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 mt-0.5" style={{ background: 'var(--accent-wash)' }}>
                    <GraduationCap size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {edu.degree}
                    </h3>
                    <p className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      {edu.institution}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {edu.school}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {edu.location} · {edu.period}
                    </p>
                  </div>
                </div>

                <span
                  className="mono px-3 py-1.5 text-sm font-bold tabular-nums"
                  style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)', border: '1px solid var(--border)' }}
                >
                  GPA {edu.gpa}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Coursework
                </p>
                <div className="flex flex-wrap gap-2">
                  {edu.coursework.map(course => (
                    <span key={course} className="tag">{course}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
