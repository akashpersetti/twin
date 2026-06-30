import { Trophy, BookOpen, Star, Heart } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import GlassCard from '@/components/ui/GlassCard';

const ACCENT = '#0d9488';

export default function Certifications() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader eyebrow="Beyond the resume" title="Certs & Activities" />

        <div className="grid gap-6">
          {/* Certifications */}
          <SectionReveal>
            <GlassCard className="glass-hover">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} color={ACCENT} />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Certifications</h3>
              </div>
              {resume.certifications.map(cert => (
                <div key={cert.title} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cert.title}</p>
                      <p className="text-sm" style={{ color: 'var(--accent)' }}>{cert.issuer}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cert.details}</p>
                    </div>
                    <span
                      className="mono text-xs px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}
                    >
                      {cert.period}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.topics.map(t => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </GlassCard>
          </SectionReveal>

          {/* Co-Curricular */}
          <SectionReveal delay={0.1}>
            <GlassCard className="glass-hover">
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
            </GlassCard>
          </SectionReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Extracurricular */}
            <SectionReveal delay={0.15}>
              <GlassCard className="glass-hover h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={18} color={ACCENT} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Extracurricular</h3>
                </div>
                <ul className="space-y-3">
                  {resume.extracurricular.map(item => (
                    <li key={item.role} className="flex gap-3 items-start">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.role}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--accent)' }}>{item.organization}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.details}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </SectionReveal>

            {/* Community Service */}
            <SectionReveal delay={0.2}>
              <GlassCard className="glass-hover h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={18} color={ACCENT} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Community Service</h3>
                </div>
                <ul className="space-y-3">
                  {resume.communityService.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      <div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {item.description}
                        </p>
                        <p className="mono text-xs mt-1" style={{ color: 'var(--accent)' }}>{item.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
