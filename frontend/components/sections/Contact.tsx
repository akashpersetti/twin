import { Mail, Phone, Linkedin, Github, Bot } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import GlassCard from '@/components/ui/GlassCard';

export default function Contact() {
  const links = [
    {
      icon: Mail,
      label: resume.basics.email,
      href: `mailto:${resume.basics.email}`,
      color: '#7c3aed',
    },
    {
      icon: Phone,
      label: resume.basics.phone,
      href: `tel:${resume.basics.phone}`,
      color: '#06b6d4',
    },
    {
      icon: Linkedin,
      label: resume.basics.linkedin,
      href: resume.basics.linkedinUrl,
      color: '#0077b5',
    },
    {
      icon: Github,
      label: resume.basics.github,
      href: resume.basics.githubUrl,
      color: '#7c3aed',
    },
  ];

  return (
    <section className="py-24 px-6" style={{ background: 'rgba(124,58,237,0.03)' }}>
      <div className="max-w-2xl mx-auto">
        <SectionReveal>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            Contact
          </h2>
          <div className="h-1 w-16 rounded-full mb-12" style={{ background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <GlassCard className="mb-6">
            <ul className="space-y-4">
              {links.map(({ icon: Icon, label, href, color }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 group transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ background: `${color}20`, color }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="group-hover:underline" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </GlassCard>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <div
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <div
              className="p-3 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.2)' }}
            >
              <Bot size={24} color="#7c3aed" />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Chat with my AI Twin
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Ask about my experience, projects, or anything else - click the bot button in the bottom-right corner.
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
