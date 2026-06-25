# Methodology

## Dataset interpretation
This project uses a claims-only dataset. It does not include policy exposure, earned premium development, lifecycle status, reserves, fraud labels, or underwriting outcomes.

## Core segmentation axes
Primary business segment:
- `WARRANTY`

Secondary dimensions:
- geography
- vehicle brand/model
- policyholder demographic buckets
- time

## Imbalance proxy metrics
`claim_to_premium_ratio` is treated as an imbalance proxy because `PREMIUM_AMOUNT_PAID` is present inside a claims dataset and may behave as a proxy rather than a full actuarial denominator.

## Data quality handling
The pipeline flags rather than silently drops:
- invalid ages
- missing geography
- missing vehicle information
- duplicate-like records

## Peer groups
Peer groups are defined using:
- warranty
- region
- vehicle brand
- age bucket

This supports explainable expectations and residual analysis.

## Anomaly scoring
Combined anomaly score uses:
1. peer-group z-score
2. Isolation Forest on numeric engineered features
3. residual magnitude versus expected claim

Flags indicate unusualness, not fraud truth.

## Insights generation
Insights are deterministic templates over computed metrics. They do not infer unsupported causal explanations.
