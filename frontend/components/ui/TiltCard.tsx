'use client';

import { useRef, ReactNode, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -10;
    const rotateY = ((x - cx) / cx) * 10;
    ref.current.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`;
    ref.current.style.boxShadow = [
      '0 2px 4px rgba(0,0,0,0.35)',
      '0 12px 28px rgba(0,0,0,0.45)',
      '0 36px 72px rgba(0,0,0,0.32)',
      '0 0 0 1px rgba(255,255,255,0.08) inset',
      '0 10px 36px rgba(124,58,237,0.18)',
    ].join(', ');
    ref.current.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    ref.current.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  }

  function handleMouseLeave() {
    if (reduced || !ref.current) return;
    ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    ref.current.style.boxShadow = '';
  }

  return (
    <motion.div
      ref={ref}
      className={`tilt-card glass rounded-2xl transition-[box-shadow] duration-300 ${className}`}
      style={{ transition: 'transform 0.18s ease, box-shadow 0.3s ease' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spotlight glow that follows cursor */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            'radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(124,58,237,0.15), transparent 70%)',
        }}
      />
      {children}
    </motion.div>
  );
}
