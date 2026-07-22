import SectionReveal from '@/components/ui/SectionReveal';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export default function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <SectionReveal>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="text-3xl sm:text-5xl font-medium tracking-tighter mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed mb-12" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {!description && <div className="mb-12" />}
    </SectionReveal>
  );
}
