'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 origin-left z-50"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
      }}
    />
  );
}
