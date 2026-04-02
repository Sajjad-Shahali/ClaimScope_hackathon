import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { ChartCard } from '@/ui/components/ChartCard';
import { DataTable } from '@/ui/components/DataTable';
import { MetricPills } from '@/ui/components/MetricPills';
import type { RankingRow } from '@/types/api';

const SUMMARY_TOOLTIPS: Record<string, string> = {
  claim_count: 'Total number of claims under this brand in the selected portfolio slice.',
  total_claim_paid: 'Sum of all indemnity paid for this brand. Primary measure of loss exposure by manufacturer.',
  avg_claim_paid: 'Mean indemnity per claim for this brand. Compare across brands to spot severity concentration.',
  avg_claim_to_premium_ratio: 'Average claim-to-premium ratio for this brand. Values above 1 indicate claims exceed premiums collected.',
  high_cost_share: 'Share of claims exceeding the P95 severity threshold for this brand.',
  concentration_share: "This brand's share of total portfolio claims volume.",
};

export function VehiclesPage() {
  const { filters } = useDashboardFilters();
  const overview = useApiQuery(['vehicles-overview', filters], () => api.vehiclesOverview(filters));
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const initialBrand = overview.data?.brands?.[0]?.segment;
  const activeBrand = selectedBrand ?? initialBrand;

  const detailFilters = useMemo(() => ({ ...filters, brand: activeBrand ? [activeBrand] : filters.brand }), [activeBrand, filters]);
  const detail = useApiQuery(['brand-detail', activeBrand, detailFilters], () => api.brandDetail(activeBrand as string, detailFilters), Boolean(activeBrand));

  const [searchValue, setSearchValue] = useState('');
  const modelSearch = useApiQuery(['model-search', searchValue], () => api.modelSearch(searchValue), searchValue.trim().length > 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <DataTable<RankingRow>
          title="Brand concentration"
          subtitle="Where loss and claim volume are concentrated across vehicle manufacturers."
          rows={overview.data?.brands ?? []}
          columns={[
            { key: 'segment', header: 'Brand', cell: (row) => row.segment },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
            { key: 'total_claim_paid', header: 'Total paid', cell: (row) => formatCurrency(row.total_claim_paid) },
            { key: 'avg_claim_paid', header: 'Avg paid', cell: (row) => formatCurrency(row.avg_claim_paid) },
            { key: 'action', header: 'Action', cell: (row) => <button className="button" onClick={() => setSelectedBrand(row.segment)}>Inspect</button> },
          ]}
        />

        <DataTable<RankingRow>
          title="Model concentration"
          subtitle="Useful for demonstrating that loss concentration can go deeper than brand level."
          rows={overview.data?.models ?? []}
          columns={[
            { key: 'segment', header: 'Model', cell: (row) => row.segment },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
            { key: 'avg_claim_paid', header: 'Avg paid', cell: (row) => formatCurrency(row.avg_claim_paid) },
            { key: 'concentration_share', header: 'Share', cell: (row) => formatPercent(row.concentration_share) },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <ChartCard title="Brand severity board" subtitle="Compare average claim severity across the top brands." height={320}>
          <BarChart data={(overview.data?.brands ?? []).slice(0, 8)}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="segment" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Bar dataKey="avg_claim_paid" fill="#5eead4" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ChartCard>

        <div className="panel p-5">
          <h3 className="section-title">Model search</h3>
          <p className="section-subtitle">Use this for high-cardinality model values during the live demo.</p>
          <input className="input mt-4" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search model..." />
          <div className="mt-4 space-y-2">
            {(searchValue.length > 0 ? modelSearch.data?.items ?? [] : []).map((item) => (
              <div key={item} className="panel-muted px-4 py-3 text-sm text-white">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {detail.data ? (
        <section className="panel p-5">
          <div className="badge-accent">Brand detail</div>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">{detail.data.brand}</h3>
          <div className="mt-5">
            <MetricPills
              items={[
                { label: 'Anomaly rate', value: formatPercent(detail.data.anomaly_rate), tooltip: 'Share of claims under this brand flagged as statistically unusual. Elevated values may indicate brand-specific handling or mechanical patterns.' },
                ...Object.entries(detail.data.summary).slice(0, 4).map(([key, value]) => ({
                  label: key,
                  value: typeof value === 'number' ? formatNumber(value, 2) : '—',
                  tooltip: SUMMARY_TOOLTIPS[key],
                })),
              ]}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <DataTable<Record<string, string | number | null>>
              title="Top models"
              rows={detail.data.top_models}
              columns={inferColumns(detail.data.top_models)}
            />
            <DataTable<Record<string, string | number | null>>
              title="Warranty mix"
              rows={detail.data.warranty_mix}
              columns={inferColumns(detail.data.warranty_mix)}
            />
            <DataTable<Record<string, string | number | null>>
              title="Regional mix"
              rows={detail.data.regional_mix}
              columns={inferColumns(detail.data.regional_mix)}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function inferColumns(rows: Array<Record<string, string | number | null>>) {
  return Object.keys(rows[0] ?? { segment: '', value: '' }).map((key) => ({
    key,
    header: key,
    cell: (row: Record<string, string | number | null>) => String(row[key] ?? '—'),
  }));
}
