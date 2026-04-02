import type { DashboardFilters } from '@/types/filters';

function appendMany(params: URLSearchParams, key: string, values?: string[]) {
  values?.filter(Boolean).forEach((value) => params.append(key, value));
}

export function buildQueryString(filters: DashboardFilters = {}, extra?: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();

  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  appendMany(params, 'warranty', filters.warranty);
  appendMany(params, 'region', filters.region);
  appendMany(params, 'province', filters.province);
  appendMany(params, 'brand', filters.brand);
  appendMany(params, 'model', filters.model);
  appendMany(params, 'age_bucket', filters.age_bucket);
  appendMany(params, 'gender', filters.gender);

  if (filters.anomaly_only) params.set('anomaly_only', 'true');
  if (filters.high_cost_only) params.set('high_cost_only', 'true');
  if (filters.min_anomaly_score !== undefined) params.set('min_anomaly_score', String(filters.min_anomaly_score));

  Object.entries(extra ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}
