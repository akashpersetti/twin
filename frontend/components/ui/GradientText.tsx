import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer ${className}`}
    >
      {children}
    </span>
  );
}
