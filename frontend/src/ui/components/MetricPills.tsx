export function MetricPills({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="panel-muted px-4 py-3 min-w-[120px] animate-fade-in"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{item.label}</div>
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
