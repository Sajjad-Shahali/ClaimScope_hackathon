from backend.app.repositories.analytics_repository import AnalyticsRepository


class InsightService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_summary(self, filters: dict) -> dict:
        inputs = self.repo.get_insight_inputs(filters)
        global_kpis = inputs["global_kpis"]
        top_warranties = inputs["top_warranties"]
        top_regions = inputs["top_regions"]
        top_brands = inputs["top_brands"]
        anomaly_summary = inputs["anomaly_summary"]

        findings = []
        if top_warranties:
            leader = top_warranties[0]
            findings.append(
                f"Warranty {leader['segment']} leads total paid claims with "
                f"{leader['claim_count']} claims and {leader['total_claim_paid']:.2f} paid."
            )
        if top_regions:
            region = top_regions[0]
            findings.append(
                f"Region {region['segment']} has the highest paid concentration at "
                f"{(region.get('concentration_share') or 0):.1%} of observed paid claims."
            )
        findings.append(
            f"The portfolio contains {global_kpis['total_claims']} claims with an average paid amount of "
            f"{(global_kpis.get('avg_claim_paid') or 0):.2f}."
        )

        top_warranty_risks = [
            f"{row['segment']}: avg paid {row['avg_claim_paid']:.2f}, imbalance proxy {((row.get('avg_claim_to_premium_ratio') or 0)):.2f}."
            for row in top_warranties[:3]
        ]
        top_geography_risks = [
            f"{row['segment']}: total paid {row['total_claim_paid']:.2f}, high-cost share {((row.get('high_cost_share') or 0)):.1%}."
            for row in top_regions[:3]
        ]
        top_vehicle_segment_risks = [
            f"{row['segment']}: avg paid {row['avg_claim_paid']:.2f}, concentration share {((row.get('concentration_share') or 0)):.1%}."
            for row in top_brands[:3]
        ]
        anomaly_headlines = [
            f"{anomaly_summary['anomaly_count']} claims are currently flagged as anomalous."
        ]
        if anomaly_summary["top_reason_buckets"]:
            reason = anomaly_summary["top_reason_buckets"][0]
            anomaly_headlines.append(
                f"Most common anomaly reason bucket: {reason['reason']} ({reason['anomaly_count']} claims)."
            )

        caveats = [
            "Claims-only dataset: no exposure denominator is available.",
            "Premium-based ratios are imbalance proxies, not true profitability or loss ratio.",
            "Anomaly outputs indicate statistical unusualness, not fraud truth.",
            "Insights are deterministic summaries of observed metrics and do not infer unsupported causes.",
        ]
        return {
            "top_findings": findings,
            "top_warranty_risks": top_warranty_risks,
            "top_geography_risks": top_geography_risks,
            "top_vehicle_segment_risks": top_vehicle_segment_risks,
            "anomaly_headlines": anomaly_headlines,
            "caveats": caveats,
        }
