'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export interface SnapshotSummary {
  key: string;
  timestamp: string;
  commit_sha: string;
  commit_message: string;
  aggregate: {
    overall: { recall_at_5_avg: number | null; ndcg_at_5_avg: number | null; faithful_rate: number | null; n: number };
  };
}

export default function SyntheticTrendChart({
  snapshots,
  onPointClick,
}: {
  snapshots: SnapshotSummary[];
  onPointClick: (key: string) => void;
}) {
  const data = [...snapshots]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((s) => ({
      key: s.key,
      date: s.timestamp.slice(0, 10),
      commit: s.commit_sha,
      recall_at_5: s.aggregate.overall.recall_at_5_avg,
      ndcg_at_5: s.aggregate.overall.ndcg_at_5_avg,
      faithful_rate: s.aggregate.overall.faithful_rate,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No synthetic eval snapshots yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} onClick={(e: any) => e?.activePayload?.[0] && onPointClick(e.activePayload[0].payload.key)}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
        <YAxis domain={[0, 1]} stroke="var(--text-secondary)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          formatter={(value: any) => value?.toFixed?.(2) ?? '—'}
        />
        <Line type="monotone" dataKey="recall_at_5" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} name="Recall@5" />
        <Line type="monotone" dataKey="ndcg_at_5" stroke="var(--accent-soft)" strokeWidth={2} dot={{ r: 3 }} name="nDCG@5" />
        <Line type="monotone" dataKey="faithful_rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Faithful rate" />
      </LineChart>
    </ResponsiveContainer>
  );
}
