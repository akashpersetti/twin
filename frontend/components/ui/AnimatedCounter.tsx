'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedCounterProps {
  value: number;
  unit: string;
  label: string;
}

export default function AnimatedCounter({ value, unit, label }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 40, stiffness: 100 });
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (inView) {
      if (reduced) {
        if (ref.current) ref.current.textContent = String(value);
      } else {
        motionVal.set(value);
      }
    }
  }, [inView, value, motionVal, reduced]);

  useEffect(() => {
    return spring.on('change', v => {
      if (ref.current) ref.current.textContent = Math.round(v).toString();
    });
  }, [spring]);

  return (
    <div className="flex flex-col items-center gap-2 py-8 px-6">
      <div className="flex items-end gap-1">
        <span
          ref={ref}
          className="text-5xl font-black tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          0
        </span>
        <span className="text-3xl font-bold mb-1" style={{ color: '#7c3aed' }}>{unit}</span>
      </div>
      <span className="text-sm text-center max-w-[160px]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </div>
  );
}
