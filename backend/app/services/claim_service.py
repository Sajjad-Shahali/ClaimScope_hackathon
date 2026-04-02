from backend.app.repositories.analytics_repository import AnalyticsRepository


class ClaimService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_claims(self, filters: dict, page: int, page_size: int, sort_by: str, sort_order: str) -> dict:
        return self.repo.get_claims(filters, page, page_size, sort_by, sort_order)

    def get_claim_detail(self, claim_id: str) -> dict:
        record = self.repo.get_claim_detail(claim_id)
        raw_fields = {
            k: record.get(k)
            for k in [
                "claim_id", "policyholder_age_original", "policyholder_gender", "warranty", "claim_date",
                "claim_region", "claim_province", "vehicle_brand", "vehicle_model",
                "claim_amount_paid", "premium_amount_paid",
            ]
        }
        engineered_fields = {
            k: record.get(k)
            for k in [
                "policyholder_age", "age_bucket", "claim_year", "claim_month", "claim_quarter",
                "claim_weekday", "claim_season", "claim_year_month",
                "claim_to_premium_ratio", "claim_severity_band", "premium_band", "high_cost_flag",
                "extreme_ratio_flag", "peer_group_key", "peer_group_expected_claim", "claim_residual",
                "peer_group_zscore", "isolation_forest_score", "residual_rank", "anomaly_score",
                "anomaly_flag", "anomaly_reason_summary",
            ]
        }
        peer_group_benchmark = {
            k: record.get(k)
            for k in [
                "peer_group_key", "peer_group_expected_claim", "peer_group_zscore",
                "warranty_avg_claim", "region_avg_claim", "province_avg_claim",
                "brand_avg_claim", "model_avg_claim", "brand_model_avg_claim",
            ]
        }
        anomaly_components = {
            k: record.get(k)
            for k in [
                "peer_group_zscore", "isolation_forest_score", "claim_residual",
                "residual_rank", "anomaly_score", "anomaly_flag", "anomaly_reason_summary",
            ]
        }
        segment_context = {
            k: record.get(k)
            for k in [
                "warranty_claim_count", "segment_concentration_share", "warranty_region_avg_claim",
                "warranty_region_avg_ratio", "brand_avg_claim", "model_avg_claim",
            ]
        }
        return {
            "claim_id": claim_id,
            "raw_fields": raw_fields,
            "engineered_fields": engineered_fields,
            "peer_group_benchmark": peer_group_benchmark,
            "expected_claim": record.get("peer_group_expected_claim"),
            "residual": record.get("claim_residual"),
            "anomaly_components": anomaly_components,
            "segment_context": segment_context,
            "percentile_within_peer_group": record.get("peer_group_percentile"),
        }
