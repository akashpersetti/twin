import { resume } from '@/data/resume';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

export default function ImpactStrip() {
  return (
    <div className="glass border-y" style={{ borderColor: 'var(--border-glass)' }}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'var(--border-glass)' }}>
        {resume.impact.map(item => (
          <AnimatedCounter key={item.label} value={item.value} unit={item.unit} label={item.label} />
        ))}
      </div>
    </div>
  );
}
