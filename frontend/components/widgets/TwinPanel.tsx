'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import Twin, { TwinHandle } from '@/components/twin';

export default function TwinPanel() {
  const twinRef = useRef<TwinHandle>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  /* Lock body scroll + Escape to minimize while maximized */
  useEffect(() => {
    if (!isMaximized) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMaximized(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isMaximized]);

  return (
    <>
      <AnimatePresence>
        {isMaximized && (
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsMaximized(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Same Twin instance throughout — only this wrapper's position/size changes */}
      <motion.div
        layout
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className={
          isMaximized
            ? 'fixed inset-4 md:inset-x-[10%] md:inset-y-[5%] z-[60] flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl'
            : 'relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl'
        }
      >
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
            onClick={() => twinRef.current?.clear()}
            aria-label="Reset chat"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: '#a1a1aa' }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setIsMaximized((v) => !v)}
            aria-label={isMaximized ? 'Minimize chat' : 'Maximize chat'}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: '#a1a1aa' }}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Chat body: Twin stays mounted across maximize/minimize */}
        <div className="flex-1 min-h-0">
          <Twin ref={twinRef} />
        </div>
      </motion.div>
    </>
  );
}
