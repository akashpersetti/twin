'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import Twin from '@/components/twin';

export default function TwinFloatingButton() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [nudge, setNudge] = useState(false);

  // Show nudge label briefly on mount
  useEffect(() => {
    const show = setTimeout(() => setNudge(true), 1500);
    const hide = setTimeout(() => setNudge(false), 5000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  function close() {
    setOpen(false);
    setFullscreen(false);
  }

  return (
    <>
      {/* Fullscreen backdrop */}
      <AnimatePresence>
        {open && fullscreen && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/*
        Panel - mounted ONCE, never unmounted.
        Open/close is driven by opacity + pointerEvents only.
        Fullscreen toggle animates via `layout`.
      */}
      <motion.div
        layout
        className="glass flex flex-col overflow-hidden"
        animate={open
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 0, scale: 0.95, y: 16 }
        }
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        style={{
          position: 'fixed',
          zIndex: 50,
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
          pointerEvents: open ? 'auto' : 'none',
          // Switch between fullscreen and panel geometry
          ...(fullscreen
            ? { top: 16, left: 16, right: 16, bottom: 88 }
            : { bottom: 92, right: 24, width: 'min(380px, calc(100vw - 32px))', height: 'min(560px, calc(100dvh - 120px))' }
          ),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-glass)', background: 'rgba(124,58,237,0.1)' }}
        >
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Chat with Akash
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFullscreen(f => !f)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={close}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Twin - single instance, never remounted */}
        <div className="flex-1 overflow-hidden">
          <Twin />
        </div>
      </motion.div>

      {/* FAB */}
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Tooltip label */}
        <AnimatePresence>
          {!open && (nudge || hovered) && (
            <motion.div
              key="label"
              initial={{ opacity: 0, x: 12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="glass rounded-xl px-3 py-2 flex items-center gap-2 select-none cursor-pointer whitespace-nowrap"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              onClick={() => setOpen(true)}
            >
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                Chat with Akash
              </span>
              <span style={{ fontSize: 11, color: '#7c3aed' }}>✦</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(prev => !prev)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0"
          style={{ border: '2px solid rgba(124,58,237,0.5)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open Twin chat"
        >
          <span
            className="absolute inset-0 rounded-full animate-fab-pulse"
            style={{ background: 'rgba(124,58,237,0.4)' }}
          />
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.div
                key="close"
                className="absolute inset-0 flex items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
              >
                <X size={22} className="text-white" />
              </motion.div>
            ) : (
              <motion.img
                key="avatar"
                src="/avatar.png"
                alt="Akash"
                className="absolute inset-0 w-full h-full object-cover rounded-full"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

