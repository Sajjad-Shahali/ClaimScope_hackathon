import type { ReactNode } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import { compactDate } from '@/lib/utils';
import { Activity, Database, ShieldCheck, RefreshCw, TrendingUp } from 'lucide-react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';

export function TopBar() {
  const { data } = useApiQuery(['health'], api.health);
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  return (
    <header className="panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
      <div className="flex items-start gap-4">
        <div
          className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{ background: 'rgba(94,234,212,0.08)', borderColor: 'rgba(94,234,212,0.2)' }}
        >
          <TrendingUp className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <div className="badge-accent mb-2">Vehicle Claims Intelligence</div>
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
            Portfolio Analysis Dashboard
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400 leading-relaxed">
            Warranty concentration · Geographic imbalance · Anomaly detection — claims-only, no actuarial overclaiming.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:min-w-[220px]">
        <div className="grid grid-cols-3 gap-2">
          <StatusPill
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Service"
            value={data?.status === 'ok' ? 'Healthy' : 'Checking'}
            ok={data?.status === 'ok'}
          />
          <StatusPill
            icon={<Database className="h-3.5 w-3.5" />}
            label="DuckDB"
            value={data?.duckdb_connected ? 'Connected' : 'Unknown'}
            ok={data?.duckdb_connected}
          />
          <StatusPill
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Loaded"
            value={compactDate(data?.data_last_loaded_at)}
            ok
          />
        </div>
        <button
          className="button w-full justify-center gap-2 text-xs h-9"
          onClick={() => queryClient.invalidateQueries()}
          disabled={isFetching > 0}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching > 0 ? 'animate-spin' : ''}`} />
          {isFetching > 0 ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>
    </header>
  );
}

function StatusPill({ icon, label, value, ok }: { icon: ReactNode; label: string; value: string; ok?: boolean }) {
  return (
    <div className="panel-muted px-2.5 py-2 min-w-0">
      <div className="flex items-center gap-1 mb-1">
        <span className={ok ? 'text-teal-400' : 'text-slate-500'}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</span>
      </div>
      <div className="text-xs font-semibold text-white truncate">{value}</div>
    </div>
  );
}
