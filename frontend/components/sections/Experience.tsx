'use client';

import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import { Timeline } from '@/components/ui/timeline';
import { Briefcase, ChevronRight, MapPin } from 'lucide-react';

export default function Experience() {
  const entries = resume.experience.map((exp, i) => {
    const current = exp.period.includes('Present');
    const year = exp.period.match(/\d{4}/)?.[0] ?? exp.period;
    return {
      title: current ? `${year} +` : year,
      content: (
        <SectionReveal key={`${exp.role}-${exp.period}`} delay={i * 0.1}>
          <div className="row">
            {/* Header row */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center border" style={{ borderColor: 'var(--border)' }}>
                  <Briefcase className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight leading-snug" style={{ color: 'var(--text-primary)' }}>{exp.role}</h3>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>{exp.company}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                <span
                  className={`tag font-medium ${
                    current
                      ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : ''
                  }`}
                  style={current ? {} : { color: 'var(--text-secondary)' }}
                >
                  {current && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {exp.period}
                </span>
                <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3 h-3" />
                  {exp.location}
                </span>
                <span className="tag" style={{ color: 'var(--text-secondary)' }}>
                  {exp.type}
                </span>
              </div>
            </div>

            {/* Project label */}
            <p className="mono mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-quaternary)' }}>
              Project
            </p>
            <p className="mb-6 text-[15px]" style={{ color: 'var(--text-primary)' }}>{exp.project}</p>

            {/* Bullets */}
            <p className="mono mb-4 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-quaternary)' }}>
              What I built
            </p>
            <ul className="space-y-2.5">
              {exp.bullets.map(b => (
                <li key={b} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent-soft)' }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      ),
    };
  });

  return (
    <section className="py-24 px-6" style={{ '--hover-tint': '#ffe4e6' } as React.CSSProperties}>
      <div className="max-w-5xl mx-auto section-border">
        <SectionHeader
          icon={Briefcase}
          eyebrow="Experience"
          title="Where I've been deployed"
          note="Real products, real users, real constraints."
        />
        <Timeline data={entries} />
      </div>
    </section>
  );
}
