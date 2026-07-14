'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export interface LiveEntry {
  key: string;
  timestamp: string;
  query: string;
  answer: string;
  judgment: { faithful: boolean } | null;
  judgment_error?: string | null;
}

function groupByDay(entries: LiveEntry[]) {
  const byDay = new Map<string, { faithful: number; total: number }>();
  for (const entry of entries) {
    if (!entry.judgment) continue; // skip judgment_error entries in the rate calc
    const day = entry.timestamp.slice(0, 10);
    const bucket = byDay.get(day) ?? { faithful: 0, total: 0 };
    bucket.total += 1;
    if (entry.judgment.faithful) bucket.faithful += 1;
    byDay.set(day, bucket);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { faithful, total }]) => ({ date, faithful_rate: total > 0 ? faithful / total : null, n: total }));
}

export default function LiveFaithfulnessChart({ entries }: { entries: LiveEntry[] }) {
  const data = groupByDay(entries);

  if (data.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No live traffic judged yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
        <YAxis domain={[0, 1]} stroke="var(--text-secondary)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          formatter={(value: any) => value?.toFixed?.(2) ?? 'n/a'}
        />
        <Line type="monotone" dataKey="faithful_rate" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} name="Faithful rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}
