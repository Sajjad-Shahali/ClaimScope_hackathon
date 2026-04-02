import type {
  AnomalyListResponse,
  AnomalySummaryResponse,
  BrandDetailResponse,
  ClaimDetailResponse,
  ClaimsListResponse,
  FilterOptionsResponse,
  GeographyDetailResponse,
  GeographyOverviewResponse,
  GeographyTrendResponse,
  HealthResponse,
  InsightSummaryResponse,
  KPIResponse,
  ModelSearchResponse,
  VehicleOverviewResponse,
  WarrantyDetailResponse,
  WarrantyOverviewResponse,
  WarrantyTrendResponse,
} from '@/types/api';
import type { DashboardFilters } from '@/types/filters';
import { buildQueryString } from './query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  filters: () => request<FilterOptionsResponse>('/filters'),
  kpis: (filters: DashboardFilters) => request<KPIResponse>(`/kpis${buildQueryString(filters)}`),
  warrantiesOverview: (filters: DashboardFilters) =>
    request<WarrantyOverviewResponse>(`/warranties/overview${buildQueryString(filters)}`),
  warrantiesTrend: (filters: DashboardFilters) =>
    request<WarrantyTrendResponse>(`/warranties/trend${buildQueryString(filters)}`),
  warrantyDetail: (warrantyName: string, filters: DashboardFilters) =>
    request<WarrantyDetailResponse>(`/warranties/${encodeURIComponent(warrantyName)}${buildQueryString(filters)}`),
  geographyOverview: (filters: DashboardFilters) =>
    request<GeographyOverviewResponse>(`/geography/overview${buildQueryString(filters)}`),
  geographyTrend: (filters: DashboardFilters) =>
    request<GeographyTrendResponse>(`/geography/trend${buildQueryString(filters)}`),
  regionDetail: (regionName: string, filters: DashboardFilters) =>
    request<GeographyDetailResponse>(`/geography/region/${encodeURIComponent(regionName)}${buildQueryString(filters)}`),
  provinceDetail: (provinceName: string, filters: DashboardFilters) =>
    request<GeographyDetailResponse>(`/geography/province/${encodeURIComponent(provinceName)}${buildQueryString(filters)}`),
  vehiclesOverview: (filters: DashboardFilters) =>
    request<VehicleOverviewResponse>(`/vehicles/overview${buildQueryString(filters)}`),
  brandDetail: (brandName: string, filters: DashboardFilters) =>
    request<BrandDetailResponse>(`/vehicles/brands/${encodeURIComponent(brandName)}${buildQueryString(filters)}`),
  modelSearch: (q: string) => request<ModelSearchResponse>(`/vehicles/models/search?q=${encodeURIComponent(q)}`),
  claims: (filters: DashboardFilters, page = 1, pageSize = 25, sortBy = 'claim_date', sortOrder: 'asc' | 'desc' = 'desc') =>
    request<ClaimsListResponse>(
      `/claims${buildQueryString(filters, { page, page_size: pageSize, sort_by: sortBy, sort_order: sortOrder })}`,
    ),
  claimDetail: (claimId: string) => request<ClaimDetailResponse>(`/claims/${encodeURIComponent(claimId)}`),
  anomalies: (filters: DashboardFilters, page = 1, pageSize = 25) =>
    request<AnomalyListResponse>(`/anomalies${buildQueryString(filters, { page, page_size: pageSize })}`),
  anomalySummary: (filters: DashboardFilters) =>
    request<AnomalySummaryResponse>(`/anomalies/summary${buildQueryString(filters)}`),
  insights: (filters: DashboardFilters) =>
    request<InsightSummaryResponse>(`/insights/summary${buildQueryString(filters)}`),
};
