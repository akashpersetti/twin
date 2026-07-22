'use client';

import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import Twin, { TwinHandle } from '@/components/twin';

export default function TwinPanel() {
  const twinRef = useRef<TwinHandle>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
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
      </div>

      {/* Chat body */}
      <div className="flex-1 min-h-0">
        <Twin ref={twinRef} />
      </div>
    </div>
  );
}
