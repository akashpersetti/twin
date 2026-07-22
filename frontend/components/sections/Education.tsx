'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionHeader from '@/components/ui/SectionHeader';
import GlassCard from '@/components/ui/GlassCard';

export default function Education() {
  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-4xl mx-auto">
        <SectionHeader eyebrow="Academic background" title="Education" />

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px hidden md:block"
            style={{ background: 'var(--border)' }}
          />

          <div className="flex flex-col gap-6">
            {resume.education.map((edu, i) => (
              <motion.div
                key={edu.institution}
                className="md:pl-12 relative"
                initial={{ opacity: 0, x: i === 0 ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-2.5 top-6 w-3 h-3 rounded-full border-2 hidden md:block"
                  style={{
                    background: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    transform: 'translateX(-50%)',
                  }}
                />

                <GlassCard>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{ background: 'var(--accent-wash)' }}
                      >
                        <GraduationCap size={20} color="#2dd4bf" />
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

                    {/* GPA badge */}
                    <span
                      className="mono px-3 py-1.5 rounded-lg text-sm font-bold tabular-nums"
                      style={{
                        background: 'var(--accent-wash)',
                        color: 'var(--accent-hover)',
                        border: '1px solid var(--surface-tint)',
                      }}
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
                        <span
                          key={course}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
