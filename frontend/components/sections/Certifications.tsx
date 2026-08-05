import { Trophy, BookOpen, Star, Heart } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';

const ACCENT = 'var(--accent)';

export default function Certifications() {
  return (
    <section className="py-24 px-6" style={{ '--hover-tint': '#d1fae5' } as React.CSSProperties}>
      <div className="max-w-4xl mx-auto section-border">
        <SectionHeader icon={Trophy} eyebrow="Credentials" title="Proof of work" note="Verified, not vibes." />

        <div>
          {/* Certifications */}
          <SectionReveal>
            <div className="row">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} color={ACCENT} />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Certifications</h3>
              </div>
              {resume.certifications.map(cert => (
                <div key={cert.title} className="flex flex-col gap-2 mb-4 last:mb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cert.title}</p>
                      <p className="text-sm" style={{ color: 'var(--accent)' }}>{cert.issuer}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cert.details}</p>
                    </div>
                    <span className="tag flex-shrink-0" style={{ background: 'var(--accent-wash)', color: 'var(--accent-ink)' }}>
                      {cert.period}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.topics.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>

          {/* Co-Curricular */}
          <SectionReveal delay={0.1}>
            <div className="row">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} color={ACCENT} />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Co-Curricular Activities</h3>
              </div>
              <ul className="space-y-3">
                {resume.cocurricular.map(item => (
                  <li key={item.title} className="flex gap-3 items-start">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {item.organization} · {item.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>

          {/* Extracurricular + Community Service — side by side, divided by a rule
              (horizontal on mobile where the grid collapses to one column, vertical on desktop) */}
          <SectionReveal delay={0.15}>
            <div className="row grid gap-8 sm:grid-cols-2">
              <div className="border-b pb-8 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-8" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Star size={18} color={ACCENT} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Extracurricular</h3>
                </div>
                <ul className="space-y-3">
                  {resume.extracurricular.map(item => (
                    <li key={item.role} className="flex gap-3 items-start">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.role}</p>
                        <p className="text-sm" style={{ color: 'var(--accent)' }}>{item.organization}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.details}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={18} color={ACCENT} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Community Service</h3>
                </div>
                <ul className="space-y-3">
                  {resume.communityService.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      <div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                        <p className="mono text-xs mt-1" style={{ color: 'var(--accent)' }}>{item.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
