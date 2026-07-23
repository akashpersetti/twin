'use client';

import SectionReveal from '@/components/ui/SectionReveal';

export default function Quote() {
  return (
    <section className="py-20 px-6 section-border">
      <div className="max-w-3xl mx-auto text-center">
        <SectionReveal>
          <p
            className="font-display text-2xl md:text-4xl font-normal tracking-tight leading-[1.15]"
            style={{ color: 'var(--text-primary)' }}
          >
            &ldquo;What are you afraid of losing, when nothing in this world truly belongs to you?&rdquo;
          </p>
          <p className="mono text-xs mt-5 tracking-[0.16em] uppercase" style={{ color: 'var(--text-secondary)' }}>
            — Marcus Aurelius
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
