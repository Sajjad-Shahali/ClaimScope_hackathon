import { Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

export function MetricPills({ items }: { items: Array<{ label: string; value: string; tooltip?: string }> }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="panel-muted px-4 py-3 min-w-[120px] animate-fade-in"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{item.label}</div>
            {item.tooltip && (
              <Tooltip text={item.tooltip}>
                <Info className="h-3 w-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
              </Tooltip>
            )}
          </div>
          <div
            className="mt-1.5 text-lg font-semibold text-white tabular-nums"
            style={{ fontFamily: 'Fira Code, monospace' }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
