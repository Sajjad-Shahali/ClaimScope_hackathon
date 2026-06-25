# Data Dictionary

## Source columns
- `CLAIM_ID`: unique claim identifier
- `POLICYHOLDER_AGE`: reported policyholder age
- `POLICYHOLDER_GENDER`: policyholder gender category
- `WARRANTY`: warranty segment
- `CLAIM_DATE`: claim date
- `CLAIM_REGION`: region
- `CLAIM_PROVINCE`: province
- `VEHICLE_BRAND`: brand
- `VEHICLE_MODEL`: model
- `CLAIM_AMOUNT_PAID`: insurer payout / indemnity
- `PREMIUM_AMOUNT_PAID`: premium proxy field available in claims dataset

## Key engineered fields
- `is_age_invalid`
- `is_geo_missing`
- `is_vehicle_info_missing`
- `is_duplicate_like`
- `claim_year`, `claim_month`, `claim_quarter`, `claim_weekday`, `claim_season`, `claim_year_month`
- `age_bucket`
- `claim_to_premium_ratio`
- `claim_severity_band`
- `premium_band`
- `high_cost_flag`
- `extreme_ratio_flag`
- `warranty_avg_claim`
- `region_avg_claim`
- `province_avg_claim`
- `brand_avg_claim`
- `model_avg_claim`
- `brand_model_avg_claim`
- `warranty_region_avg_claim`
- `warranty_region_avg_ratio`
- `segment_concentration_share`
- `peer_group_key`
- `peer_group_expected_claim`
- `claim_residual`
- `peer_group_zscore`
- `peer_group_percentile`
- `isolation_forest_score`
- `residual_rank`
- `anomaly_score`
- `anomaly_flag`
- `anomaly_reason_summary`
