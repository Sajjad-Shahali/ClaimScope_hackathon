export function SkeletonCard({ lines = 3, height = 'h-5' }: { lines?: number; height?: string }) {
  return (
    <div className="panel space-y-3 p-5">
      <div className={`${height} w-1/3 animate-pulse rounded-full bg-white/10`} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded-full bg-white/10" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="kpi-card space-y-3">
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
      <div className="h-8 w-2/3 animate-pulse rounded-full bg-white/10" />
      <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
    </div>
  );
}
