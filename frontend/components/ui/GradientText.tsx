import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-teal-600 via-teal-500 to-teal-700 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer ${className}`}
    >
      {children}
    </span>
  );
}
