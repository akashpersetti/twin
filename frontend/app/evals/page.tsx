'use client';

import { useEffect, useMemo, useState } from 'react';
import SyntheticTrendChart, { SnapshotSummary } from '@/components/evals/SyntheticTrendChart';
import LiveFaithfulnessChart, { LiveEntry } from '@/components/evals/LiveFaithfulnessChart';
import DateRangeFilter, { DateRange } from '@/components/evals/DateRangeFilter';
import SnapshotDrilldown from '@/components/evals/SnapshotDrilldown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function EvalsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [liveEntries, setLiveEntries] = useState<LiveEntry[]>([]);
  const [range, setRange] = useState<DateRange>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/evals/synthetic`).then((r) => r.json()),
      fetch(`${API_URL}/evals/live`).then((r) => r.json()),
    ])
      .then(([synthetic, live]) => {
        setSnapshots(synthetic.snapshots ?? []);
        setLiveEntries(live.entries ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSnapshots = useMemo(
    () =>
      snapshots.filter((s) => {
        if (range.since && s.timestamp.slice(0, 10) < range.since) return false;
        if (range.until && s.timestamp.slice(0, 10) > range.until) return false;
        return true;
      }),
    [snapshots, range]
  );

  const filteredLive = useMemo(
    () =>
      liveEntries.filter((e) => {
        if (range.since && e.timestamp.slice(0, 10) < range.since) return false;
        if (range.until && e.timestamp.slice(0, 10) > range.until) return false;
        return true;
      }),
    [liveEntries, range]
  );

  return (
    <main className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="eyebrow mb-2">Observability</p>
          <h1 className="text-3xl font-semibold mb-2">Eval Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Two independent streams: a synthetic 35-query eval re-run on every backend push (not a
            reproducible replay, chat generation uses temperature 0.7), and continuous faithfulness
            judging of real visitor conversations.
          </p>
        </div>

        <div className="mb-6">
          <DateRangeFilter onChange={setRange} />
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading eval data...</p>
        ) : (
          <>
            <section className="glass p-5 mb-8">
              <h2 className="eyebrow mb-3">Synthetic eval trend (per push)</h2>
              <SyntheticTrendChart snapshots={filteredSnapshots} onPointClick={setSelectedKey} />
            </section>

            <section className="glass p-5 mb-8">
              <h2 className="eyebrow mb-3">Live faithfulness (real traffic)</h2>
              <LiveFaithfulnessChart entries={filteredLive} />
            </section>
          </>
        )}

        <SnapshotDrilldown snapshotKey={selectedKey} apiUrl={API_URL} onClose={() => setSelectedKey(null)} />
      </div>
    </main>
  );
}
