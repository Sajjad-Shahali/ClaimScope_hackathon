import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { ChartCard } from '@/ui/components/ChartCard';
import { DataTable } from '@/ui/components/DataTable';
import { MetricPills } from '@/ui/components/MetricPills';
import type { RankingRow } from '@/types/api';

export function WarrantiesPage() {
  const { filters } = useDashboardFilters();
  const overview = useApiQuery(['warranty-overview', filters], () => api.warrantiesOverview(filters));
  const trend = useApiQuery(['warranty-trend', filters], () => api.warrantiesTrend(filters));

  const initialWarranty = overview.data?.items?.[0]?.segment;
  const [selectedWarranty, setSelectedWarranty] = useState<string | undefined>(undefined);
  const activeWarranty = selectedWarranty ?? initialWarranty;

  const detailFilters = useMemo(
    () => ({
      ...filters,
      warranty: activeWarranty ? [activeWarranty] : filters.warranty,
    }),
    [activeWarranty, filters],
  );

  const detail = useApiQuery(
    ['warranty-detail', activeWarranty, detailFilters],
    () => api.warrantyDetail(activeWarranty as string, detailFilters),
    Boolean(activeWarranty),
  );

  return (
    <div className="space-y-6">
      <DataTable<RankingRow>
        title="Warranty ranking board"
        subtitle="Prioritize warranties with the biggest combination of claim count, paid severity, and imbalance proxy."
        rows={overview.data?.items ?? []}
        columns={[
          { key: 'segment', header: 'Warranty', cell: (row) => row.segment },
          { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
          { key: 'total_claim_paid', header: 'Total paid', cell: (row) => formatCurrency(row.total_claim_paid) },
          { key: 'avg_claim_paid', header: 'Avg paid', cell: (row) => formatCurrency(row.avg_claim_paid) },
          { key: 'avg_claim_to_premium_ratio', header: 'Imbalance proxy', cell: (row) => formatNumber(row.avg_claim_to_premium_ratio, 2) },
          {
            key: 'actions',
            header: 'Action',
            cell: (row) => (
              <button className="button" onClick={() => setSelectedWarranty(row.segment)}>
                Open
              </button>
            ),
          },
        ]}
      />

      {detail.data ? (
        <section className="panel p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="badge-accent">Selected warranty</div>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">{detail.data.warranty}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Use this section to explain why a warranty is strategically important: volume, severity, imbalance proxy, anomaly rate,
                and the regions and brands that amplify it.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <MetricPills
              items={[
                { label: 'Volume', value: formatNumber(detail.data.volume), tooltip: 'Total number of claims under this warranty in the selected slice.' },
                { label: 'Average severity', value: formatCurrency(detail.data.severity_avg), tooltip: 'Mean indemnity paid per claim for this warranty. Compare across warranties to spot disproportionate cost segments.' },
                { label: 'Imbalance proxy', value: formatNumber(detail.data.imbalance_proxy_avg, 2), tooltip: 'Average claim-to-premium ratio for this warranty. Values above 1 indicate the claims paid exceed the premium collected.' },
                { label: 'Anomaly rate', value: formatPercent(detail.data.anomaly_rate), tooltip: 'Share of claims under this warranty flagged as statistically unusual. A high rate warrants wording and handling review.' },
              ]}
            />
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Warranty trend" subtitle="Trend by period for the active warranty or the selected portfolio slice." height={320}>
          <LineChart data={detail.data?.time_trend_summary ?? trend.data?.items ?? []}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Line type="monotone" dataKey="value" stroke="#5eead4" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Top regions for selected warranty" subtitle="Where this warranty accumulates its strongest pressure." height={320}>
          <BarChart data={detail.data?.top_regions ?? []}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="segment" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Bar dataKey="metric_value" radius={[12, 12, 0, 0]}>
              {(detail.data?.top_regions ?? []).map((_, index) => (
                <Cell key={index} fill={index % 2 === 0 ? '#5eead4' : '#8b5cf6'} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Top regions"
          subtitle="Regional sources of the selected warranty’s burden."
          rows={detail.data?.top_regions ?? []}
          columns={[
            { key: 'segment', header: 'Region', cell: (row) => row.segment },
            { key: 'metric_value', header: 'Metric value', cell: (row) => formatCurrency(row.metric_value) },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count ?? null) },
          ]}
        />

        <DataTable
          title="Top brands"
          subtitle="Vehicle brand mix within the selected warranty."
          rows={detail.data?.top_brands ?? []}
          columns={[
            { key: 'segment', header: 'Brand', cell: (row) => row.segment },
            { key: 'metric_value', header: 'Metric value', cell: (row) => formatCurrency(row.metric_value) },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count ?? null) },
          ]}
        />
      </section>
    </div>
  );
}
