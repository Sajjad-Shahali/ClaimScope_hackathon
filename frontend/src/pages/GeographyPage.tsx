import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { ChartCard } from '@/ui/components/ChartCard';
import { DataTable } from '@/ui/components/DataTable';
import { MetricPills } from '@/ui/components/MetricPills';
import type { RankingRow } from '@/types/api';

export function GeographyPage() {
  const { filters } = useDashboardFilters();
  const overview = useApiQuery(['geography-overview', filters], () => api.geographyOverview(filters));
  const trend = useApiQuery(['geography-trend', filters], () => api.geographyTrend(filters));
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);

  const regionDetail = useApiQuery(
    ['region-detail', selectedRegion, filters],
    () => api.regionDetail(selectedRegion as string, filters),
    Boolean(selectedRegion),
  );
  const provinceDetail = useApiQuery(
    ['province-detail', selectedProvince, filters],
    () => api.provinceDetail(selectedProvince as string, filters),
    Boolean(selectedProvince),
  );

  const activeDetail = selectedProvince ? provinceDetail.data : selectedRegion ? regionDetail.data : null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <DataTable<RankingRow>
          title="Region leaderboard"
          subtitle="Find structural imbalances, concentration pockets, and severity outliers."
          rows={overview.data?.regions ?? []}
          columns={[
            { key: 'segment', header: 'Region', cell: (row) => row.segment },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
            { key: 'total_claim_paid', header: 'Total paid', cell: (row) => formatCurrency(row.total_claim_paid) },
            { key: 'avg_claim_to_premium_ratio', header: 'Imbalance proxy', cell: (row) => formatNumber(row.avg_claim_to_premium_ratio, 2) },
            { key: 'action', header: 'Action', cell: (row) => <button className="button" onClick={() => { setSelectedProvince(undefined); setSelectedRegion(row.segment); }}>Inspect</button> },
          ]}
        />

        <DataTable<RankingRow>
          title="Province leaderboard"
          subtitle="Province drill-down is useful when judges ask where the issue is actually concentrated."
          rows={overview.data?.provinces ?? []}
          columns={[
            { key: 'segment', header: 'Province', cell: (row) => row.segment },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
            { key: 'avg_claim_paid', header: 'Avg paid', cell: (row) => formatCurrency(row.avg_claim_paid) },
            { key: 'high_cost_share', header: 'High-cost share', cell: (row) => formatPercent(row.high_cost_share) },
            { key: 'action', header: 'Action', cell: (row) => <button className="button" onClick={() => { setSelectedRegion(undefined); setSelectedProvince(row.segment); }}>Inspect</button> },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Geography trend" subtitle="Time-series pulse for selected portfolio geography." height={320}>
          <LineChart data={trend.data?.items ?? []}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Regional imbalance proxy" subtitle="Quick comparison of average claims-to-premium proxy across top regions." height={320}>
          <BarChart data={(overview.data?.regions ?? []).slice(0, 8)}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="segment" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Bar dataKey="avg_claim_to_premium_ratio" fill="#5eead4" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ChartCard>
      </section>

      {activeDetail ? (
        <section className="panel p-5">
          <div className="badge-accent">{activeDetail.geography_type}</div>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">{activeDetail.geography_name}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            This detail view helps you explain whether a region or province is unusual because of claim concentration, severity, anomaly
            pockets, or segment mix.
          </p>

          <div className="mt-5">
            <MetricPills
              items={Object.entries(activeDetail.summary).map(([key, value]) => ({
                label: key,
                value: typeof value === 'number' ? formatNumber(value, 2) : '—',
              }))}
            />
          </div>

          <div className="mt-6">
            <DataTable<Record<string, string | number | null>>
              title="Breakdown"
              subtitle="Context rows generated by the backend detail endpoint."
              rows={activeDetail.breakdown}
              columns={Object.keys(activeDetail.breakdown[0] ?? { segment: 'Segment', value: 'Value' }).map((key) => ({
                key,
                header: key,
                cell: (row: Record<string, string | number | null>) => String(row[key] ?? '—'),
              }))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
