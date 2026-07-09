import { CSSProperties, ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function GlassCard({ children, className = '', style }: GlassCardProps) {
  return (
    <div className={`glass glass-hover rounded-2xl p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}
