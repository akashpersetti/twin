'use client';

import { useEffect, useState } from 'react';

interface QueryResult {
  id: string;
  category: string;
  query: string;
  retrieved_chunk_ids: string[];
  recall_at_5: number | null;
  ndcg_at_5: number | null;
  answer: string;
  judgment: { faithful: boolean; hallucinated_claims: string[]; rationale: string };
}

export default function SnapshotDrilldown({
  snapshotKey,
  apiUrl,
  onClose,
}: {
  snapshotKey: string | null;
  apiUrl: string;
  onClose: () => void;
}) {
  const [results, setResults] = useState<QueryResult[] | null>(null);

  useEffect(() => {
    if (!snapshotKey) {
      setResults(null);
      return;
    }
    fetch(`${apiUrl}/evals/synthetic/${encodeURIComponent(snapshotKey)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results));
  }, [snapshotKey, apiUrl]);

  if (!snapshotKey) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass bg-[var(--bg-card)] max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="eyebrow">Snapshot detail</h3>
          <button onClick={onClose} className="text-sm underline">Close</button>
        </div>
        {!results ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--border)]">
                <th className="py-2 pr-2">Query</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 pr-2">Recall@5</th>
                <th className="py-2 pr-2">nDCG@5</th>
                <th className="py-2 pr-2">Faithful</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] align-top">
                  <td className="py-2 pr-2">{r.query}</td>
                  <td className="py-2 pr-2 mono text-xs">{r.category}</td>
                  <td className="py-2 pr-2">{r.recall_at_5 ?? '—'}</td>
                  <td className="py-2 pr-2">{r.ndcg_at_5 ?? '—'}</td>
                  <td className="py-2 pr-2">{r.judgment.faithful ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
