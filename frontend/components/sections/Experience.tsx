'use client';

import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import { Briefcase, ChevronRight, MapPin } from 'lucide-react';

export default function Experience() {
  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Experience"
          title="Where I've been deployed"
          note="Real products, real users, real constraints."
        />

        <div className="flex flex-col gap-6">
          {resume.experience.map((exp, i) => {
            const current = exp.period.includes('Present');
            return (
              <SectionReveal key={`${exp.role}-${exp.period}`} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  {/* Ambient glows */}
                  <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(251,191,36,0.04)' }} aria-hidden />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(56,189,248,0.04)' }} aria-hidden />

                  <div className="relative z-10 p-8 sm:p-10">
                    {/* Header row */}
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between mb-8">
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10">
                          <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight text-white leading-snug">{exp.role}</h3>
                          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>{exp.company}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            current
                              ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : 'border border-white/[0.08] bg-white/[0.03]'
                          }`}
                          style={current ? {} : { color: '#a1a1aa' }}
                        >
                          {current && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {exp.period}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px]" style={{ color: '#a1a1aa' }}>
                          <MapPin className="w-3 h-3" />
                          {exp.location}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px]" style={{ color: '#a1a1aa' }}>
                          {exp.type}
                        </span>
                      </div>
                    </div>

                    {/* Project label */}
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: '#52525b' }}>
                      Project
                    </p>
                    <p className="mb-6 text-[15px] text-white">{exp.project}</p>

                    {/* Bullets */}
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: '#52525b' }}>
                      What I built
                    </p>
                    <ul className="space-y-2.5">
                      {exp.bullets.map(b => (
                        <li key={b} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: '#a1a1aa' }}>
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(251,191,36,0.6)' }} />
                          {b}
                        </li>
                      ))}
                    </ul>
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
