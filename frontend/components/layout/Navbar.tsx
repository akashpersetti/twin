'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { resume } from '@/data/resume';

const NAV_ITEMS = [
  { id: 'about', label: 'About', tagline: 'git log, but readable' },
  { id: 'experience', label: 'Experience', tagline: "Where I've been deployed" },
  { id: 'projects', label: 'Projects', tagline: 'Built, shipped, measured' },
  { id: 'skills', label: 'Skills', tagline: 'What I reach for' },
  { id: 'education', label: 'Education', tagline: 'Formal pretraining' },
  { id: 'certifications', label: 'Certs & Activities', tagline: 'Proof of work' },
  { id: 'more', label: 'More', tagline: 'Beyond the repo' },
  { id: 'contact', label: 'Contact', tagline: "Let's ship something real" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const activeId = useScrollSpy(NAV_ITEMS.map(n => n.id));

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Clock renders only after mount (avoids SSR hydration mismatch) */
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  /* Lock body scroll + close on Escape while the overlay is open */
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function go(id: string) {
    setMenuOpen(false);
    /* Wait for the overlay exit animation before scrolling */
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350);
  }

  const preview = hovered ?? NAV_ITEMS.findIndex(n => n.id === activeId);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(9,9,11,0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#09090b' }}
            >
              A
            </span>
            <span>Akash<span style={{ color: 'var(--accent)' }}>.</span></span>
          </button>

          {/* Center: location + clock */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-center text-center">
              <span className="mono text-[11px] tracking-wide" style={{ color: '#a1a1aa' }}>
                {resume.basics.location}
              </span>
              <span className="mono text-[10px] tabular-nums" style={{ color: '#52525b' }}>
                {time ?? ' '}
              </span>
            </div>
          </div>

          {/* Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <motion.button
              onClick={() => setMenuOpen(true)}
              className="relative flex h-8 w-9 flex-col items-center justify-center gap-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open menu"
            >
              <span className="block h-0.5 w-full" style={{ background: '#fafafa' }} />
              <span className="block h-0.5 w-full" style={{ background: '#fafafa' }} />
            </motion.button>
          </div>

          {/* Desktop hamburger */}
          <motion.button
            onClick={() => setMenuOpen(true)}
            className="relative hidden md:flex h-8 w-9 flex-col items-center justify-center gap-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-full" style={{ background: '#fafafa' }} />
            <span className="block h-0.5 w-full" style={{ background: '#fafafa' }} />
          </motion.button>
        </div>
      </motion.header>

      {/* Full-page overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            style={{ background: 'rgba(9,9,11,0.98)', backdropFilter: 'blur(20px)' }}
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Overlay top bar */}
            <motion.div
              className="absolute top-0 left-0 right-0 flex h-16 items-center justify-between px-6 max-w-6xl mx-auto w-full"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#09090b' }}
                >
                  A
                </span>
                Akash<span style={{ color: 'var(--accent)' }}>.</span>
              </span>
              <div className="hidden md:flex flex-col items-center text-center">
                <span className="mono text-[11px]" style={{ color: '#a1a1aa' }}>{resume.basics.location}</span>
                <span className="mono text-[10px] tabular-nums" style={{ color: '#52525b' }}>{time ?? ' '}</span>
              </div>
              <motion.button
                onClick={() => setMenuOpen(false)}
                className="relative h-8 w-9"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close menu"
              >
                <motion.span
                  className="absolute left-0 top-1/2 block h-0.5 w-full"
                  style={{ background: '#fafafa' }}
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 45 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span
                  className="absolute left-0 top-1/2 block h-0.5 w-full"
                  style={{ background: '#fafafa' }}
                  initial={{ rotate: 0 }}
                  animate={{ rotate: -45 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </motion.div>

            <div className="flex h-full flex-col md:flex-row items-center">
              {/* Links */}
              <div className="flex-1 flex flex-col justify-center gap-3 md:gap-4 w-full px-8 md:pl-24 pt-20 md:pt-0">
                {NAV_ITEMS.map((item, i) => {
                  const on = activeId === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => go(item.id)}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: 'easeOut' }}
                      className="group flex items-center gap-4 text-left font-display text-3xl sm:text-4xl md:text-5xl transition-all duration-300 hover:translate-x-3"
                      style={{ color: on ? '#fafafa' : '#52525b' }}
                    >
                      <span className="mono text-[11px] w-7 shrink-0" style={{ color: on ? 'var(--accent)' : '#3f3f46' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="transition-colors duration-300 group-hover:text-white">{item.label}</span>
                      <ChevronRight
                        className="h-6 w-6 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                        style={{ color: 'var(--accent)' }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Preview panel (text, not images) */}
              <div className="hidden lg:flex flex-1 items-center justify-center p-12">
                <AnimatePresence mode="wait">
                  {preview >= 0 && (
                    <motion.div
                      key={preview}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="text-center"
                    >
                      <div className="font-display text-[10rem] leading-none" style={{ color: 'rgba(251,191,36,0.12)' }}>
                        {String(preview + 1).padStart(2, '0')}
                      </div>
                      <p className="font-display text-2xl mt-4" style={{ color: '#a1a1aa' }}>
                        {NAV_ITEMS[preview].tagline}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
