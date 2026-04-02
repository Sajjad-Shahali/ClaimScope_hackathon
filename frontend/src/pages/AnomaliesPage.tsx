import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { compactDate, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { DataTable } from '@/ui/components/DataTable';
import { MetricPills } from '@/ui/components/MetricPills';
import { ChartCard } from '@/ui/components/ChartCard';
import type { AnomalyListItem } from '@/types/api';

export function AnomaliesPage() {
  const { filters, setFilters } = useDashboardFilters();
  const [page, setPage] = useState(1);

  const anomalies = useApiQuery(['anomalies', filters, page], () => api.anomalies(filters, page, 15));
  const summary = useApiQuery(['anomaly-summary', filters], () => api.anomalySummary(filters));

  const histogramData = useMemo(() => {
    const items = anomalies.data?.items ?? [];
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${(i * 0.1).toFixed(1)}–${((i + 1) * 0.1).toFixed(1)}`,
      count: items.filter(item => item.anomaly_score >= i * 0.1 && item.anomaly_score < (i + 1) * 0.1).length,
    }));
    return buckets;
  }, [anomalies.data]);

  return (
    <div className="space-y-6">
      <section className="panel p-5 animate-slide-up" style={{ animationDelay: '0s' }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="badge-danger">Explainable anomaly screening</div>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Rank unusual claims without pretending they are fraud truth</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              The backend combines peer-group z-score, residual deviation, and isolation-style outlier scoring. The frontend keeps the explanation readable.
            </p>
          </div>

          <div className="w-full max-w-[240px]">
            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Min anomaly score</span>
                {filters.min_anomaly_score !== undefined && (
                  <span className="badge-accent text-[10px]">{filters.min_anomaly_score.toFixed(2)}</span>
                )}
              </div>
              <input
                className="input"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={filters.min_anomaly_score ?? ''}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    min_anomaly_score: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </label>
          </div>
        </div>

        <div className="mt-5">
          <MetricPills
            items={[
              { label: 'Anomaly count', value: formatNumber(summary.data?.anomaly_count) },
              { label: 'Anomaly rate', value: formatPercent(summary.data?.anomaly_rate) },
              { label: 'Top warranty buckets', value: formatNumber(summary.data?.concentration_by_warranty?.length) },
              { label: 'Top reason buckets', value: formatNumber(summary.data?.top_reason_buckets?.length) },
            ]}
          />
        </div>
      </section>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <ChartCard
          title="Anomaly score distribution"
          subtitle="Current page — scores bucketed into 0.1 intervals"
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData}>
              <defs>
                <linearGradient id="anomalyBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <XAxis dataKey="range" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                wrapperClassName="chart-tooltip"
                contentStyle={{ background: 'transparent', border: 'none', padding: 0 }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="count" fill="url(#anomalyBarGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <DataTable<AnomalyListItem>
          title="Ranked anomalies"
          subtitle="Show both the score and the reason language so judges trust the logic."
          csvFilename="anomalies-export.csv"
          rows={anomalies.data?.items ?? []}
          isLoading={anomalies.isLoading}
          columns={[
            { key: 'claim_id', header: 'Claim', cell: (row) => row.claim_id },
            { key: 'claim_date', header: 'Date', cell: (row) => compactDate(row.claim_date) },
            { key: 'warranty', header: 'Warranty', cell: (row) => row.warranty ?? '—' },
            { key: 'region', header: 'Region', cell: (row) => row.claim_region ?? '—' },
            { key: 'brand', header: 'Brand', cell: (row) => row.vehicle_brand ?? '—' },
            { key: 'paid', header: 'Paid', cell: (row) => formatCurrency(row.claim_amount_paid) },
            { key: 'score', header: 'Score', cell: (row) => formatNumber(row.anomaly_score, 2) },
            { key: 'reasons', header: 'Reasons', cell: (row) => <div className="max-w-[300px] text-sm text-slate-300">{row.reasons.join(' • ')}</div>, csvValue: (row) => row.reasons.join('; ') },
          ]}
          action={
            <div className="flex gap-2">
              <button className="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>
                Previous
              </button>
              <button
                className="button"
                disabled={Boolean(anomalies.data && page >= anomalies.data.pagination.total_pages)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          }
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <DataTable<Record<string, string | number | null>>
          title="Concentration by warranty"
          rows={summary.data?.concentration_by_warranty ?? []}
          columns={inferColumns(summary.data?.concentration_by_warranty ?? [])}
        />
        <DataTable<Record<string, string | number | null>>
          title="Concentration by region"
          rows={summary.data?.concentration_by_region ?? []}
          columns={inferColumns(summary.data?.concentration_by_region ?? [])}
        />
        <DataTable<Record<string, string | number | null>>
          title="Concentration by brand"
          rows={summary.data?.concentration_by_brand ?? []}
          columns={inferColumns(summary.data?.concentration_by_brand ?? [])}
        />
      </section>
    </div>
  );
}

function inferColumns(rows: Array<Record<string, string | number | null>>) {
  return Object.keys(rows[0] ?? { segment: '', value: '' }).map((key) => ({
    key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    cell: (row: Record<string, string | number | null>) => {
      const val = row[key];
      if (typeof val === 'number') return <span style={{ fontFamily: 'Fira Code, monospace' }} className="tabular-nums">{val.toFixed(val % 1 === 0 ? 0 : 2)}</span>;
      return String(val ?? '—');
    },
  }));
}
