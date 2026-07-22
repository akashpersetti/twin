import { Mail, Linkedin, Github, Rss, Bot } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import GlassCard from '@/components/ui/GlassCard';

export default function Contact() {
  const links = [
    { icon: Mail, label: resume.basics.email, href: `mailto:${resume.basics.email}` },
    { icon: Linkedin, label: resume.basics.linkedin, href: resume.basics.linkedinUrl },
    { icon: Github, label: resume.basics.github, href: resume.basics.githubUrl },
    { icon: Rss, label: resume.basics.devTo, href: resume.basics.devToUrl },
    { icon: Rss, label: resume.basics.hashnode, href: resume.basics.hashnodeUrl },
    { icon: Rss, label: resume.basics.coderLegion, href: resume.basics.coderLegionUrl },
  ];

  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-2xl mx-auto">
        <SectionHeader
          eyebrow="Get in touch"
          title="Contact"
          description="Open to AI engineering roles and collaborations. The fastest way to reach me is below."
        />

        <SectionReveal delay={0.1}>
          <GlassCard className="glass-hover mb-6">
            <ul className="space-y-4">
              {links.map(({ icon: Icon, label, href }) => (
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
                      style={{ background: 'var(--accent-wash)', color: '#2dd4bf' }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="mono text-sm group-hover:underline" style={{ color: 'var(--text-secondary)' }}>
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
              background: 'var(--surface-tint)',
              border: '1px solid var(--accent-soft)',
            }}
          >
            <div
              className="p-3 rounded-xl flex-shrink-0"
              style={{ background: 'var(--bg-base)' }}
            >
              <Bot size={24} color="#2dd4bf" />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Chat with my AI Twin
              </p>
              <p className="text-sm" style={{ color: 'var(--accent-hover)' }}>
                Ask about my experience, projects, or anything else, click the chat button in the bottom-right corner.
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
