'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Twin from '@/components/twin';

interface TwinDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function TwinDrawer({ open, onClose }: TwinDrawerProps) {
  /* Lock body scroll + Escape to close while open */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Desktop: right drawer. Mobile: bottom sheet. Twin stays mounted so chat state survives. */}
      <motion.aside
        role="dialog"
        aria-label="Chat with Akash's twin"
        className="fixed z-[60] flex flex-col
                   inset-x-0 bottom-0 h-[85dvh] rounded-t-3xl border-t
                   md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[min(420px,92vw)] md:rounded-none md:border-t-0 md:border-l"
        style={{ background: '#0c0c0f', borderColor: 'var(--border)', pointerEvents: open ? 'auto' : 'none' }}
        initial={false}
        animate={
          open
            ? { x: 0, y: 0 }
            : typeof window !== 'undefined' && window.innerWidth >= 768
            ? { x: '110%', y: 0 }
            : { x: 0, y: '110%' }
        }
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Swipe handle (mobile only, visual) */}
        <div className="md:hidden flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar.png" alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-tight">Akash&apos;s twin</p>
            <p className="text-[11px]" style={{ color: '#71717a' }}>RAG-backed, judged live</p>
          </div>
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: '#a1a1aa' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Chat body: Twin stays mounted regardless of open state */}
        <div className="flex-1 min-h-0">
          <Twin />
        </div>
      </motion.aside>
    </>
  );
}
