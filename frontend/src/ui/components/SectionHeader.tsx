import type { ReactNode } from 'react';

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="section-title">{title}</h3>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 mt-1 sm:mt-0">{action}</div>}
    </div>
  );
}
