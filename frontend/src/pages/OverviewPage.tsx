import { BarChart, Bar, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { KpiCard } from '@/ui/components/KpiCard';
import { ChartCard } from '@/ui/components/ChartCard';
import { DataTable } from '@/ui/components/DataTable';
import { InsightList } from '@/ui/components/InsightList';
import type { RankingRow } from '@/types/api';

export function OverviewPage() {
  const { filters, setFilters } = useDashboardFilters();

  const kpis = useApiQuery(['kpis', filters], () => api.kpis(filters));
  const warranties = useApiQuery(['warranty-overview', filters], () => api.warrantiesOverview(filters));
  const warrantyTrend = useApiQuery(['warranty-trend', filters], () => api.warrantiesTrend(filters));
  const geography = useApiQuery(['geography-overview', filters], () => api.geographyOverview(filters));
  const vehicles = useApiQuery(['vehicles-overview', filters], () => api.vehiclesOverview(filters));
  const anomalySummary = useApiQuery(['anomaly-summary', filters], () => api.anomalySummary(filters));
  const insights = useApiQuery(['insights', filters], () => api.insights(filters));

  const delta = kpis.data?.comparison?.delta ?? {};

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-5 animate-slide-up" style={{ animationDelay: '0s' }}>
        <KpiCard
          label="Total claims"
          value={formatNumber(kpis.data?.kpis.total_claims)}
          helper="Claim records in the selected slice"
          delta={toNumber(delta.total_claims)}
        />
        <KpiCard
          label="Total amount paid"
          value={formatCurrency(kpis.data?.kpis.total_amount_paid)}
          helper="Total indemnity paid by the insurer"
          delta={toNumber(delta.total_amount_paid)}
        />
        <KpiCard
          label="Average claim paid"
          value={formatCurrency(kpis.data?.kpis.avg_claim_paid)}
          helper="Mean severity across selected claims"
          delta={toNumber(delta.avg_claim_paid)}
        />
        <KpiCard
          label="Imbalance proxy"
          value={formatNumber(kpis.data?.kpis.avg_claim_to_premium_ratio, 2)}
          helper="Claims-only ratio, not true profitability"
          tooltip="Claim-to-premium ratio — a proxy for portfolio imbalance, not true loss ratio"
          delta={toNumber(delta.avg_claim_to_premium_ratio)}
        />
        <KpiCard
          label="Anomaly rate"
          value={formatPercent(kpis.data?.kpis.anomaly_rate)}
          helper="Share of claims flagged as unusual"
          delta={toNumber(delta.anomaly_rate)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr] animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <ChartCard
          title="Warranty concentration and cost"
          subtitle="Click a bar to filter by warranty. Which warranties carry both scale and disproportionate paid amount?"
          height={340}
        >
          <BarChart data={(warranties.data?.items ?? []).slice(0, 8)}>
            <defs>
              <linearGradient id="warrantyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5eead4" stopOpacity={1} />
                <stop offset="100%" stopColor="#5eead4" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="segment" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{}} wrapperClassName="chart-tooltip" />
            <Bar
              dataKey="total_claim_paid"
              fill="url(#warrantyGrad)"
              radius={[12, 12, 0, 0]}
              className="cursor-pointer"
              onClick={(data) => {
                if (data?.segment) setFilters(p => ({ ...p, warranty: [data.segment] }));
              }}
            />
          </BarChart>
        </ChartCard>

        <div
          className="panel p-6"
          style={{
            borderLeft: '3px solid rgba(244,63,94,0.4)',
            borderRadius: '0 20px 20px 0',
            paddingLeft: '24px',
          }}
        >
          <h3 className="text-lg font-bold text-white mb-3">Claims-only platform caveat</h3>
          <div className="space-y-3 text-sm leading-6 text-slate-300">
            <p>Premium-based ratios are shown as imbalance proxies, not true loss ratios.</p>
            <p>No exposure denominator or underwriting context is present, so actions should be positioned as portfolio triage and investigation priorities.</p>
            <p>The strongest value comes from segmentation, benchmarking, and explanation rather than prediction theater.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="P95 severity" value={formatCurrency(kpis.data?.kpis.p95_claim_paid)} />
            <MiniMetric label="High-cost rate" value={formatPercent(kpis.data?.kpis.high_cost_claim_rate)} />
            <MiniMetric label="Anomaly count" value={formatNumber(kpis.data?.kpis.anomaly_count)} />
            <MiniMetric label="Median ratio" value={formatNumber(kpis.data?.kpis.median_claim_to_premium_ratio, 2)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <ChartCard
          title="Claim trend pulse"
          subtitle="Trend view for selected warranties or the strongest portfolio segments."
          height={320}
        >
          <LineChart data={warrantyTrend.data?.items ?? []}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Regional imbalance snapshot"
          subtitle="Click a bar to filter by region. Top regions by claims paid across the active portfolio slice."
          height={320}
        >
          <BarChart layout="vertical" data={(geography.data?.regions ?? []).slice(0, 6)}>
            <defs>
              <linearGradient id="regionGrad" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis dataKey="segment" type="category" stroke="#94a3b8" tickLine={false} axisLine={false} width={90} />
            <Tooltip wrapperClassName="chart-tooltip" />
            <Bar
              dataKey="avg_claim_to_premium_ratio"
              fill="url(#regionGrad)"
              radius={[0, 12, 12, 0]}
              className="cursor-pointer"
              onClick={(data) => {
                if (data?.segment) setFilters(p => ({ ...p, region: [data.segment] }));
              }}
            />
          </BarChart>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <InsightList title="Top findings" items={insights.data?.top_findings ?? []} tone="accent" />
        <InsightList title="Warranty risks" items={insights.data?.top_warranty_risks ?? []} />
        <InsightList title="Anomaly headlines" items={insights.data?.anomaly_headlines ?? []} tone="danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <DataTable<RankingRow>
          title="Top warranties"
          subtitle="Best candidates for portfolio review and operational action."
          rows={(warranties.data?.items ?? []).slice(0, 6)}
          columns={[
            { key: 'segment', header: 'Warranty', cell: (row) => row.segment },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
            { key: 'total_claim_paid', header: 'Total paid', cell: (row) => formatCurrency(row.total_claim_paid) },
            { key: 'avg_claim_to_premium_ratio', header: 'Imbalance proxy', cell: (row) => formatNumber(row.avg_claim_to_premium_ratio, 2) },
          ]}
        />

        <DataTable<RankingRow>
          title="Top brands"
          subtitle="Brand concentrations with elevated paid loss."
          rows={(vehicles.data?.brands ?? []).slice(0, 6)}
          columns={[
            { key: 'segment', header: 'Brand', cell: (row) => row.segment },
            { key: 'claim_count', header: 'Claims', cell: (row) => formatNumber(row.claim_count) },
            { key: 'avg_claim_paid', header: 'Avg paid', cell: (row) => formatCurrency(row.avg_claim_paid) },
            { key: 'concentration_share', header: 'Share', cell: (row) => formatPercent(row.concentration_share) },
          ]}
        />

        <DataTable<Record<string, string | number | null>>
          title="Anomaly reason buckets"
          subtitle="Explainability matters more than black-box scoring in a hackathon demo."
          rows={(anomalySummary.data?.top_reason_buckets ?? []).slice(0, 6)}
          columns={[
            { key: 'reason', header: 'Reason', cell: (row) => String(row.reason ?? row.segment ?? '—') },
            { key: 'count', header: 'Count', cell: (row) => formatNumber(toNumber(row.count)) },
            { key: 'share', header: 'Share', cell: (row) => formatPercent(toNumber(row.share)) },
          ]}
        />
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-muted px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1.5 text-lg font-semibold text-white tabular-nums" style={{ fontFamily: 'Fira Code, monospace' }}>{value}</div>
    </div>
  );
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}
