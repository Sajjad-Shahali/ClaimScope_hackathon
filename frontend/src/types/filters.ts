export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
  warranty?: string[];
  region?: string[];
  province?: string[];
  brand?: string[];
  model?: string[];
  age_bucket?: string[];
  gender?: string[];
  anomaly_only?: boolean;
  high_cost_only?: boolean;
  min_anomaly_score?: number;
}
