'use client';

import { useState } from 'react';

export interface DateRange {
  since?: string;
  until?: string;
}

export default function DateRangeFilter({ onChange }: { onChange: (range: DateRange) => void }) {
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');

  const apply = (nextSince: string, nextUntil: string) => {
    setSince(nextSince);
    setUntil(nextUntil);
    onChange({ since: nextSince || undefined, until: nextUntil || undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mono text-sm">
      <label className="flex items-center gap-2">
        From
        <input
          type="date"
          value={since}
          onChange={(e) => apply(e.target.value, until)}
          className="glass px-2 py-1 rounded"
        />
      </label>
      <label className="flex items-center gap-2">
        To
        <input
          type="date"
          value={until}
          onChange={(e) => apply(since, e.target.value)}
          className="glass px-2 py-1 rounded"
        />
      </label>
      {(since || until) && (
        <button onClick={() => apply('', '')} className="text-xs underline text-[var(--text-secondary)]">
          Clear
        </button>
      )}
    </div>
  );
}
