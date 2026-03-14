import { Trophy, BookOpen, Star, Heart } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import GlassCard from '@/components/ui/GlassCard';

export default function Certifications() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionReveal>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            Certs & Activities
          </h2>
          <div className="h-1 w-16 rounded-full mb-12" style={{ background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
        </SectionReveal>

        <div className="grid gap-6">
          {/* Certifications */}
          <SectionReveal>
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} color="#f59e0b" />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Certifications</h3>
              </div>
              {resume.certifications.map(cert => (
                <div key={cert.title} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cert.title}</p>
                      <p className="text-sm" style={{ color: '#06b6d4' }}>{cert.issuer}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cert.details}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
                    >
                      {cert.period}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.topics.map(t => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}
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
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} color="#06b6d4" />
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Co-Curricular Activities</h3>
              </div>
              <ul className="space-y-3">
                {resume.cocurricular.map(item => (
                  <li key={item.title} className="flex gap-3 items-start">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4' }} />
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
              <GlassCard className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={18} color="#8b5cf6" />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Extracurricular</h3>
                </div>
                <ul className="space-y-3">
                  {resume.extracurricular.map(item => (
                    <li key={item.role} className="flex gap-3 items-start">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.role}
                        </p>
                        <p className="text-sm" style={{ color: '#8b5cf6' }}>{item.organization}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.details}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </SectionReveal>

            {/* Community Service */}
            <SectionReveal delay={0.2}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={18} color="#e11d48" />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Community Service</h3>
                </div>
                <ul className="space-y-3">
                  {resume.communityService.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: '#e11d48' }} />
                      <div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {item.description}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#e11d48' }}>{item.date}</p>
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
