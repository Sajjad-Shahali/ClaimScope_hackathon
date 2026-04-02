export type Nullable<T> = T | null;

export interface FilterOptionsResponse {
  claim_date_min: string | null;
  claim_date_max: string | null;
  warranties: string[];
  regions: string[];
  provinces: string[];
  brands: string[];
  age_buckets: string[];
  claim_years: number[];
}

export interface ComparisonBlock {
  current_start_date: string | null;
  current_end_date: string | null;
  previous_start_date: string | null;
  previous_end_date: string | null;
  current: Record<string, number | null>;
  previous: Record<string, number | null>;
  delta: Record<string, number | null>;
}

export interface KPIBlock {
  total_claims: number;
  total_amount_paid: number;
  avg_claim_paid: number | null;
  median_claim_paid: number | null;
  p95_claim_paid: number | null;
  p99_claim_paid: number | null;
  avg_claim_to_premium_ratio: number | null;
  median_claim_to_premium_ratio: number | null;
  high_cost_claim_rate: number | null;
  anomaly_count: number;
  anomaly_rate: number | null;
}

export interface KPIResponse {
  kpis: KPIBlock;
  comparison: ComparisonBlock | null;
}

export interface RankingRow {
  segment: string;
  claim_count: number;
  total_claim_paid: number;
  avg_claim_paid: number;
  median_claim_paid: number | null;
  avg_claim_to_premium_ratio: number | null;
  p95_claim_paid: number | null;
  high_cost_share: number | null;
  volatility: number | null;
  concentration_share: number | null;
}

export interface TrendPoint {
  period: string;
  value: number;
  group?: string | null;
}

export interface WarrantyOverviewResponse {
  items: RankingRow[];
}

export interface WarrantyDetailBreakdownRow {
  segment: string;
  metric_value: number;
  claim_count?: number | null;
}

export interface WarrantyDetailResponse {
  warranty: string;
  volume: number;
  severity_avg: number | null;
  imbalance_proxy_avg: number | null;
  anomaly_rate: number | null;
  top_regions: WarrantyDetailBreakdownRow[];
  top_brands: WarrantyDetailBreakdownRow[];
  time_trend_summary: TrendPoint[];
}

export interface WarrantyTrendResponse {
  items: TrendPoint[];
}

export interface GeographyOverviewResponse {
  regions: RankingRow[];
  provinces: RankingRow[];
}

export interface GeographyDetailResponse {
  geography_type: string;
  geography_name: string;
  summary: Record<string, number | null>;
  breakdown: Array<Record<string, string | number | null>>;
}

export interface GeographyTrendResponse {
  items: TrendPoint[];
}

export interface VehicleOverviewResponse {
  brands: RankingRow[];
  models: RankingRow[];
}

export interface BrandDetailResponse {
  brand: string;
  summary: Record<string, number | null>;
  top_models: Array<Record<string, string | number | null>>;
  warranty_mix: Array<Record<string, string | number | null>>;
  regional_mix: Array<Record<string, string | number | null>>;
  anomaly_rate: number | null;
}

export interface ModelSearchResponse {
  items: string[];
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface ClaimListItem {
  claim_id: string;
  claim_date: string | null;
  warranty: string | null;
  claim_region: string | null;
  claim_province: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  claim_amount_paid: number | null;
  premium_amount_paid: number | null;
  claim_to_premium_ratio: number | null;
  high_cost_flag: boolean;
  anomaly_flag: boolean;
  anomaly_score: number | null;
  anomaly_reason_summary: string | null;
}

export interface ClaimsListResponse {
  items: ClaimListItem[];
  pagination: PaginationMeta;
}

export interface ClaimDetailResponse {
  claim_id: string;
  raw_fields: Record<string, string | number | boolean | null>;
  engineered_fields: Record<string, string | number | boolean | null>;
  peer_group_benchmark: Record<string, string | number | boolean | null>;
  expected_claim: number | null;
  residual: number | null;
  anomaly_components: Record<string, string | number | boolean | null>;
  segment_context: Record<string, string | number | null>;
  percentile_within_peer_group: number | null;
}

export interface AnomalyListItem {
  claim_id: string;
  claim_date: string | null;
  warranty: string | null;
  claim_region: string | null;
  vehicle_brand: string | null;
  claim_amount_paid: number | null;
  anomaly_score: number;
  anomaly_flag: boolean;
  reasons: string[];
}

export interface AnomalyListResponse {
  items: AnomalyListItem[];
  pagination: PaginationMeta;
}

export interface AnomalySummaryResponse {
  anomaly_count: number;
  anomaly_rate: number | null;
  concentration_by_warranty: Array<Record<string, string | number | null>>;
  concentration_by_region: Array<Record<string, string | number | null>>;
  concentration_by_brand: Array<Record<string, string | number | null>>;
  top_reason_buckets: Array<Record<string, string | number | null>>;
}

export interface InsightSummaryResponse {
  top_findings: string[];
  top_warranty_risks: string[];
  top_geography_risks: string[];
  top_vehicle_segment_risks: string[];
  anomaly_headlines: string[];
  caveats: string[];
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  duckdb_connected: boolean;
  data_last_loaded_at: string | null;
}
