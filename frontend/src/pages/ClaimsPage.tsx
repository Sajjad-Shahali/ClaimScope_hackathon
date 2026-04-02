import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { compactDate, formatCurrency, formatNumber } from '@/lib/utils';
import { ClaimDetailModal } from '@/ui/components/ClaimDetailModal';
import { DataTable } from '@/ui/components/DataTable';
import { Search, Info } from 'lucide-react';
import { Tooltip } from '@/ui/components/Tooltip';

export function ClaimsPage() {
  const { filters, setFilters } = useDashboardFilters();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('claim_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');

  const claims = useApiQuery(['claims', filters, page, sortBy, sortOrder], () => api.claims(filters, page, 20, sortBy, sortOrder));
  const claimDetail = useApiQuery(['claim-detail', activeClaimId], () => api.claimDetail(activeClaimId as string), Boolean(activeClaimId));

  const handleSearchSubmit = () => {
    if (searchId.trim()) {
      setActiveClaimId(searchId.trim());
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel p-5 animate-slide-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="badge-accent mb-2">Claims explorer</div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Portfolio drill-down from summary metrics to individual claims</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              This page is your proof that the platform is usable by analysts, not just visually attractive for a pitch.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Sort by</span>
                <Tooltip text="Choose which metric to sort claims by: date, paid amount, or anomaly score.">
                  <Info className="h-3 w-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
                </Tooltip>
              </div>
              <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="claim_date">Claim date</option>
                <option value="claim_amount_paid">Claim paid</option>
                <option value="anomaly_score">Anomaly score</option>
              </select>
            </label>
            <label>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Order</span>
                <Tooltip text="Set sort direction. Descending shows highest values first — useful for spotting top-cost or highest-score claims.">
                  <Info className="h-3 w-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
                </Tooltip>
              </div>
              <select className="select" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
            <label className="panel-muted flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={Boolean(filters.high_cost_only)}
                onChange={(event) => setFilters((previous) => ({ ...previous, high_cost_only: event.target.checked }))}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium text-white">High-cost only</div>
                  <Tooltip text="Filter to claims above the P95 severity threshold. Focus analyst attention on tail exposure.">
                    <Info className="h-3 w-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <div className="text-xs text-slate-400">Refine explorer to severe cases.</div>
              </div>
            </label>
            <label>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Search by Claim ID</span>
                <Tooltip text="Enter a claim ID directly to open its detail view — useful for investigating specific claims flagged in reports.">
                  <Info className="h-3 w-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
                </Tooltip>
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type="text"
                  placeholder="Enter claim ID…"
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(); }}
                />
                <button
                  className="button shrink-0 px-3"
                  onClick={handleSearchSubmit}
                  aria-label="Open claim"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </label>
          </div>
        </div>
      </section>

      <div style={{ animationDelay: '0.1s' }} className="animate-slide-up">
        <DataTable
          title="Claim records"
          subtitle={`Page ${claims.data?.pagination.page ?? 1} of ${claims.data?.pagination.total_pages ?? 1}`}
          rows={claims.data?.items ?? []}
          csvFilename="claims-export.csv"
          isLoading={claims.isLoading}
          columns={[
            {
              key: 'claim_id',
              header: 'Claim ID',
              cell: (row) => (
                <button
                  className="font-mono text-teal-300 hover:text-teal-200 hover:underline"
                  onClick={() => setActiveClaimId(row.claim_id)}
                >
                  {row.claim_id}
                </button>
              ),
              csvValue: (row) => row.claim_id,
            },
            { key: 'claim_date', header: 'Date', cell: (row) => compactDate(row.claim_date) },
            { key: 'warranty', header: 'Warranty', cell: (row) => row.warranty ?? '—' },
            { key: 'geography', header: 'Geography', cell: (row) => `${row.claim_region ?? '—'} / ${row.claim_province ?? '—'}` },
            { key: 'vehicle', header: 'Vehicle', cell: (row) => `${row.vehicle_brand ?? '—'} ${row.vehicle_model ?? ''}`.trim() },
            { key: 'paid', header: 'Paid', cell: (row) => formatCurrency(row.claim_amount_paid) },
            { key: 'ratio', header: 'Imbalance proxy', cell: (row) => formatNumber(row.claim_to_premium_ratio, 2) },
            { key: 'flag', header: 'Flags', cell: (row) => <span className={row.anomaly_flag ? 'badge-danger' : 'badge'}>{row.anomaly_flag ? 'Anomaly' : row.high_cost_flag ? 'High cost' : 'Normal'}</span> },
            { key: 'action', header: 'Action', cell: (row) => <button className="button" onClick={() => setActiveClaimId(row.claim_id)}>Open</button> },
          ]}
          action={
            <div className="flex gap-2">
              <button className="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>
                Previous
              </button>
              <button
                className="button"
                disabled={Boolean(claims.data && page >= claims.data.pagination.total_pages)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          }
        />
      </div>

      {activeClaimId && claimDetail.data ? <ClaimDetailModal detail={claimDetail.data} onClose={() => setActiveClaimId(null)} /> : null}
    </div>
  );
}
