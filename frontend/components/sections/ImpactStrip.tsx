import { Download } from 'lucide-react';
import { resume } from '@/data/resume';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const ICONS: Record<string, React.ReactNode> = {
  download: <Download size={22} strokeWidth={2.5} />,
};

export default function ImpactStrip() {
  return (
    <div style={{ '--hover-tint': '#ede9fe' } as React.CSSProperties}>
      <div
        className="hover-tint max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x"
        style={{ borderColor: 'var(--border)', border: '1px solid var(--border)' }}
      >
        {resume.impact.map(item => (
          <AnimatedCounter
            key={item.label}
            value={item.value}
            unit={item.unit}
            label={item.label}
            icon={'icon' in item ? ICONS[item.icon] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
