import { BookOpen, Sparkles, ArrowUpRight } from 'lucide-react';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import GlassCard from '@/components/ui/GlassCard';

const ACCENT = '#2dd4bf';

export default function More() {
  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-4xl mx-auto">
        <SectionHeader eyebrow="Beyond code" title="Beyond the repo" note="Leadership, community, and the rest." />

        <div className="grid md:grid-cols-2 gap-6">
          <SectionReveal>
            <a href="https://blog.akashpersetti.com" target="_blank" rel="noopener noreferrer" className="block h-full">
              <GlassCard className="glass-hover h-full">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} color={ACCENT} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Blog</h3>
                  <ArrowUpRight size={16} style={{ color: 'var(--text-secondary)' }} className="ml-auto" />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Writing on engineering, AI systems, and things I'm learning.
                </p>
                <p className="mono text-xs mt-3" style={{ color: 'var(--accent)' }}>
                  blog.akashpersetti.com
                </p>
              </GlassCard>
            </a>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <a href="/evals" className="block h-full">
              <GlassCard className="glass-hover h-full" style={{ borderColor: 'var(--accent-soft)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} color={ACCENT} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Live Evals Dashboard</h3>
                  <ArrowUpRight size={16} style={{ color: 'var(--text-secondary)' }} className="ml-auto" />
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Faithfulness scores and eval snapshots from this site's own AI twin, tracked live in production.
                </p>
                <span
                  className="mono text-xs px-2 py-1 rounded-full inline-flex items-center gap-1"
                  style={{ background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}
                >
                  <Sparkles size={11} /> for AI engineers &amp; devs
                </span>
              </GlassCard>
            </a>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
