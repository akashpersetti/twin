import SectionReveal from '@/components/ui/SectionReveal';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  note?: string;
}

export default function SectionHeader({ eyebrow, title, description, note }: SectionHeaderProps) {
  return (
    <SectionReveal>
      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="text-3xl sm:text-5xl font-normal tracking-tight leading-[1.05]" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {description && (
            <p className="max-w-2xl text-base leading-relaxed mt-4" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        {note && (
          <p className="max-w-xs text-sm sm:text-right" style={{ color: '#71717a' }}>
            {note}
          </p>
        )}
      </div>
    </SectionReveal>
  );
}
