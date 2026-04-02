import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

export function KpiCard({
  label,
  value,
  helper,
  delta,
  tooltip,
}: {
  label: string;
  value: string;
  helper?: string;
  delta?: number | null;
  tooltip?: string;
}) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
          {tooltip && (
            <Tooltip text={tooltip}>
              <Info className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
            </Tooltip>
          )}
        </div>
        {delta !== undefined && delta !== null && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isPositive
                ? 'bg-teal-400/10 text-teal-300 border border-teal-400/20'
                : 'bg-rose-400/10 text-rose-300 border border-rose-400/20'
            }`}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <div
        className="mt-3 font-mono text-3xl font-semibold tracking-tight text-white tabular-nums"
        style={{ fontFamily: 'Fira Code, monospace' }}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-slate-500 leading-relaxed">{helper ?? 'Portfolio slice comparison'}</div>
    </div>
  );
}
