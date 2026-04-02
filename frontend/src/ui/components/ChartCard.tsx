import type { ReactElement, ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { SectionHeader } from './SectionHeader';

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  height = 300,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  height?: number;
}) {
  return (
    <div className="panel p-5 animate-fade-in">
      <SectionHeader title={title} subtitle={subtitle} action={action} />
      <div style={{ height }} className="mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {children as ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
