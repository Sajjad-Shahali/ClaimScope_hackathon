type Tone = 'default' | 'danger' | 'accent' | 'violet';

const toneConfig: Record<Tone, { dot: string; border: string; rowBg: string; rowHover: string }> = {
  default: {
    dot: 'bg-slate-500',
    border: 'border-l-slate-500/30',
    rowBg: 'bg-white/[0.015]',
    rowHover: 'hover:bg-white/[0.03]',
  },
  accent: {
    dot: 'bg-teal-400',
    border: 'border-l-teal-400/40',
    rowBg: 'bg-teal-400/[0.03]',
    rowHover: 'hover:bg-teal-400/[0.06]',
  },
  danger: {
    dot: 'bg-rose-400',
    border: 'border-l-rose-400/40',
    rowBg: 'bg-rose-400/[0.03]',
    rowHover: 'hover:bg-rose-400/[0.06]',
  },
  violet: {
    dot: 'bg-violet-400',
    border: 'border-l-violet-400/40',
    rowBg: 'bg-violet-400/[0.03]',
    rowHover: 'hover:bg-violet-400/[0.06]',
  },
};

export function InsightList({
  title,
  items,
  tone = 'default',
}: {
  title: string;
  items: string[];
  tone?: Tone;
}) {
  const cfg = toneConfig[tone];
  return (
    <div className="panel p-5 animate-fade-in">
      <div className="mb-4 flex items-center gap-2.5">
        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <h3 className="section-title">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600 py-4 text-center italic">No insights available for the current filters.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className={`border-l-2 pl-3.5 py-2 rounded-r-xl text-sm leading-relaxed text-slate-300 transition-colors duration-150 ${cfg.border} ${cfg.rowBg} ${cfg.rowHover}`}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
