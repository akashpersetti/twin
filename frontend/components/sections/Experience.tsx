'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Briefcase, MapPin, Calendar } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import GlassCard from '@/components/ui/GlassCard';

export default function Experience() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionReveal>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            Experience
          </h2>
          <div className="h-1 w-16 rounded-full mb-12" style={{ background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
        </SectionReveal>

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px hidden md:block"
            style={{ background: 'var(--border-glass)' }}
          />

          <div className="flex flex-col gap-6">
            {resume.experience.map((exp, i) => (
              <SectionReveal key={exp.company} delay={i * 0.1}>
                <div className="md:pl-12 relative">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2.5 top-6 w-3 h-3 rounded-full border-2 hidden md:block"
                    style={{
                      background: openIndex === i ? '#7c3aed' : 'var(--bg-base)',
                      borderColor: openIndex === i ? '#7c3aed' : 'var(--border-glass)',
                      transform: 'translateX(-50%)',
                    }}
                  />

                  <GlassCard className="cursor-pointer" >
                    <button
                      className="w-full text-left"
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                              {exp.role}
                            </h3>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}
                            >
                              {exp.type}
                            </span>
                          </div>
                          <p className="font-semibold mb-2" style={{ color: '#06b6d4' }}>
                            {exp.company}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} /> {exp.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={13} /> {exp.period}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase size={13} /> {exp.project}
                            </span>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: openIndex === i ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
                        >
                          <ChevronDown size={20} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <ul className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-glass)' }}>
                            {exp.bullets.map((bullet, bi) => (
                              <li key={bi} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed' }} />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
