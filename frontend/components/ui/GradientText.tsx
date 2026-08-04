import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer ${className}`}
    >
      {children}
    </span>
  );
}
