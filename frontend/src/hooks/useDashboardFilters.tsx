import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { DashboardFilters } from '@/types/filters';

interface DashboardFilterContextValue {
  filters: DashboardFilters;
  setFilters: (updater: DashboardFilters | ((previous: DashboardFilters) => DashboardFilters)) => void;
  resetFilters: () => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | undefined>(undefined);

const initialFilters: DashboardFilters = {
  anomaly_only: false,
  high_cost_only: false,
};

export function DashboardFilterProvider({ children }: PropsWithChildren) {
  const [filters, setFiltersState] = useState<DashboardFilters>(initialFilters);

  const value = useMemo<DashboardFilterContextValue>(
    () => ({
      filters,
      setFilters: (updater) => {
        setFiltersState((previous) => (typeof updater === 'function' ? updater(previous) : updater));
      },
      resetFilters: () => setFiltersState(initialFilters),
    }),
    [filters],
  );

  return <DashboardFilterContext.Provider value={value}>{children}</DashboardFilterContext.Provider>;
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used inside DashboardFilterProvider');
  }
  return context;
}
