from __future__ import annotations

from datetime import datetime
from math import ceil
from typing import Any

from fastapi import HTTPException

from backend.app.db.duckdb import DuckDBManager


class AnalyticsRepository:
    """Repository for DuckDB-backed analytics queries."""

    allowed_claim_sorts = {
        "claim_date": "claim_date",
        "claim_amount_paid": "claim_amount_paid",
        "premium_amount_paid": "premium_amount_paid",
        "anomaly_score": "anomaly_score",
        "claim_to_premium_ratio": "claim_to_premium_ratio",
    }

    def __init__(self, db: DuckDBManager) -> None:
        self.db = db

    @property
    def conn(self):
        return self.db.connect()

    @staticmethod
    def _clean_value(value: Any) -> Any:
        try:
            if value != value:  # NaN
                return None
        except Exception:
            pass
        return value

    @classmethod
    def _clean_records(cls, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [{k: cls._clean_value(v) for k, v in row.items()} for row in records]

    @staticmethod
    def _append_condition(where_sql: str, condition: str) -> str:
        return f"{where_sql} AND {condition}" if where_sql else f"WHERE {condition}"

    def get_data_last_loaded_at(self) -> datetime | None:
        try:
            result = self.conn.execute(
                """
                SELECT MAX(data_loaded_at) AS data_last_loaded_at
                FROM claim_detail_mart
                """
            ).fetchone()
            return self._clean_value(result[0]) if result else None
        except Exception:
            return None

    def _build_filter_clauses(self, filters: dict[str, Any], alias: str = "c") -> tuple[str, list[Any]]:
        clauses: list[str] = []
        params: list[Any] = []

        mapping = {
            "warranty": "warranty",
            "region": "claim_region",
            "province": "claim_province",
            "brand": "vehicle_brand",
            "model": "vehicle_model",
            "gender": "policyholder_gender",
            "age_bucket": "age_bucket",
        }
        for key, column in mapping.items():
            value = filters.get(key)
            if value is None:
                continue
            values = value if isinstance(value, list) else [value]
            values = [v for v in values if v not in (None, "", [])]
            if not values:
                continue
            placeholders = ",".join(["?"] * len(values))
            clauses.append(f"{alias}.{column} IN ({placeholders})")
            params.extend(values)

        if filters.get("start_date"):
            clauses.append(f"CAST({alias}.claim_date AS DATE) >= ?")
            params.append(filters["start_date"])
        if filters.get("end_date"):
            clauses.append(f"CAST({alias}.claim_date AS DATE) <= ?")
            params.append(filters["end_date"])
        if filters.get("anomaly_only"):
            clauses.append(f"COALESCE({alias}.anomaly_flag, FALSE) = TRUE")
        if filters.get("high_cost_only"):
            clauses.append(f"COALESCE({alias}.high_cost_flag, FALSE) = TRUE")
        if filters.get("min_anomaly_score") is not None:
            clauses.append(f"COALESCE({alias}.anomaly_score, 0) >= ?")
            params.append(filters["min_anomaly_score"])

        where_sql = "WHERE " + " AND ".join(clauses) if clauses else ""
        return where_sql, params

    def get_filters(self) -> dict[str, Any]:
        row = self.conn.execute(
            """
            SELECT
                MIN(CAST(claim_date AS DATE)) AS claim_date_min,
                MAX(CAST(claim_date AS DATE)) AS claim_date_max,
                ARRAY_AGG(DISTINCT warranty ORDER BY warranty) FILTER (WHERE warranty IS NOT NULL) AS warranties,
                ARRAY_AGG(DISTINCT claim_region ORDER BY claim_region) FILTER (WHERE claim_region IS NOT NULL) AS regions,
                ARRAY_AGG(DISTINCT claim_province ORDER BY claim_province) FILTER (WHERE claim_province IS NOT NULL) AS provinces,
                ARRAY_AGG(DISTINCT vehicle_brand ORDER BY vehicle_brand) FILTER (WHERE vehicle_brand IS NOT NULL) AS brands,
                ARRAY_AGG(DISTINCT age_bucket ORDER BY age_bucket) FILTER (WHERE age_bucket IS NOT NULL) AS age_buckets,
                ARRAY_AGG(DISTINCT claim_year ORDER BY claim_year) FILTER (WHERE claim_year IS NOT NULL) AS claim_years
            FROM claim_detail_mart
            """
        ).fetchone()

        return {
            "claim_date_min": row[0],
            "claim_date_max": row[1],
            "warranties": row[2] or [],
            "regions": row[3] or [],
            "provinces": row[4] or [],
            "brands": row[5] or [],
            "age_buckets": row[6] or [],
            "claim_years": row[7] or [],
        }

    def get_kpis(self, filters: dict[str, Any]) -> dict[str, Any]:
        where_sql, params = self._build_filter_clauses(filters)
        row = self.conn.execute(
            f"""
            SELECT
                COUNT(*) AS total_claims,
                COALESCE(SUM(claim_amount_paid), 0) AS total_amount_paid,
                AVG(claim_amount_paid) AS avg_claim_paid,
                MEDIAN(claim_amount_paid) AS median_claim_paid,
                QUANTILE_CONT(claim_amount_paid, 0.95) AS p95_claim_paid,
                QUANTILE_CONT(claim_amount_paid, 0.99) AS p99_claim_paid,
                AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
                MEDIAN(claim_to_premium_ratio) AS median_claim_to_premium_ratio,
                AVG(CASE WHEN high_cost_flag THEN 1.0 ELSE 0.0 END) AS high_cost_claim_rate,
                SUM(CASE WHEN anomaly_flag THEN 1 ELSE 0 END) AS anomaly_count,
                AVG(CASE WHEN anomaly_flag THEN 1.0 ELSE 0.0 END) AS anomaly_rate
            FROM claim_detail_mart c
            {where_sql}
            """,
            params,
        ).fetchone()
        return {
            "total_claims": row[0],
            "total_amount_paid": row[1],
            "avg_claim_paid": self._clean_value(row[2]),
            "median_claim_paid": self._clean_value(row[3]),
            "p95_claim_paid": self._clean_value(row[4]),
            "p99_claim_paid": self._clean_value(row[5]),
            "avg_claim_to_premium_ratio": self._clean_value(row[6]),
            "median_claim_to_premium_ratio": self._clean_value(row[7]),
            "high_cost_claim_rate": self._clean_value(row[8]),
            "anomaly_count": row[9] or 0,
            "anomaly_rate": self._clean_value(row[10]),
        }

    def _records(self, query: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
        return self._clean_records(self.conn.execute(query, params or []).df().to_dict("records"))

    def get_warranty_overview(self, filters: dict[str, Any]) -> list[dict[str, Any]]:
        where_sql, params = self._build_filter_clauses(filters, alias="w")
        return self._records(
            f"""
            SELECT
                warranty AS segment,
                claim_count,
                total_claim_paid,
                avg_claim_paid,
                median_claim_paid,
                avg_claim_to_premium_ratio,
                p95_claim_paid,
                high_cost_share,
                volatility,
                concentration_share
            FROM warranty_mart w
            {where_sql}
            ORDER BY total_claim_paid DESC, claim_count DESC
            """,
            params,
        )

    def get_warranty_trend(self, filters: dict[str, Any]) -> list[dict[str, Any]]:
        where_sql, params = self._build_filter_clauses(filters, alias="t")
        return self._records(
            f"""
            SELECT
                claim_year_month AS period,
                total_claim_paid AS value,
                warranty AS "group"
            FROM trend_mart t
            {where_sql}
            ORDER BY claim_year_month, warranty
            """,
            params,
        )

    def get_warranty_detail(self, warranty_name: str, filters: dict[str, Any]) -> dict[str, Any]:
        local_filters = dict(filters)
        local_filters["warranty"] = warranty_name
        row = self.get_kpis(local_filters)
        if row["total_claims"] == 0:
            raise HTTPException(status_code=404, detail=f"Warranty '{warranty_name}' not found")

        where_sql, params = self._build_filter_clauses(local_filters, alias="c")
        top_regions = self._records(
            f"""
            SELECT claim_region AS segment, AVG(claim_amount_paid) AS metric_value, COUNT(*) AS claim_count
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1
            ORDER BY metric_value DESC NULLS LAST
            LIMIT 5
            """,
            params,
        )
        top_brands = self._records(
            f"""
            SELECT vehicle_brand AS segment, AVG(claim_amount_paid) AS metric_value, COUNT(*) AS claim_count
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1
            ORDER BY metric_value DESC NULLS LAST
            LIMIT 5
            """,
            params,
        )
        trend = self._records(
            f"""
            SELECT claim_year_month AS period, SUM(claim_amount_paid) AS value
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1
            ORDER BY 1
            """,
            params,
        )

        return {
            "warranty": warranty_name,
            "volume": row["total_claims"],
            "severity_avg": row["avg_claim_paid"],
            "imbalance_proxy_avg": row["avg_claim_to_premium_ratio"],
            "anomaly_rate": row["anomaly_rate"],
            "top_regions": top_regions,
            "top_brands": top_brands,
            "time_trend_summary": trend,
        }

    def get_geography_overview(self, filters: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        region_where, region_params = self._build_filter_clauses(filters, alias="g")
        province_where, province_params = self._build_filter_clauses(filters, alias="g")
        regions = self._records(
            f"""
            SELECT claim_region AS segment, claim_count, total_claim_paid, avg_claim_paid, median_claim_paid,
                   avg_claim_to_premium_ratio, p95_claim_paid, high_cost_share, volatility, concentration_share
            FROM geography_mart g
            {self._append_condition(region_where, "geography_type = 'region'")}
            ORDER BY total_claim_paid DESC
            """,
            region_params,
        )
        provinces = self._records(
            f"""
            SELECT claim_province AS segment, claim_count, total_claim_paid, avg_claim_paid, median_claim_paid,
                   avg_claim_to_premium_ratio, p95_claim_paid, high_cost_share, volatility, concentration_share
            FROM geography_mart g
            {self._append_condition(province_where, "geography_type = 'province'")}
            ORDER BY total_claim_paid DESC
            """,
            province_params,
        )
        return {"regions": regions, "provinces": provinces}

    def get_geography_trend(self, filters: dict[str, Any]) -> list[dict[str, Any]]:
        where_sql, params = self._build_filter_clauses(filters, alias="c")
        return self._records(
            f"""
            SELECT claim_year_month AS period, SUM(claim_amount_paid) AS value, claim_region AS "group"
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1, 3
            ORDER BY 1, 3
            """,
            params,
        )

    def get_region_detail(self, region_name: str, filters: dict[str, Any]) -> dict[str, Any]:
        local_filters = dict(filters)
        local_filters["region"] = region_name
        summary = self.get_kpis(local_filters)
        if summary["total_claims"] == 0:
            raise HTTPException(status_code=404, detail=f"Region '{region_name}' not found")
        where_sql, params = self._build_filter_clauses(local_filters, alias="c")
        breakdown = self._records(
            f"""
            SELECT claim_province AS segment, COUNT(*) AS claim_count,
                   SUM(claim_amount_paid) AS total_claim_paid,
                   AVG(claim_amount_paid) AS avg_claim_paid
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1
            ORDER BY total_claim_paid DESC
            """,
            params,
        )
        return {"geography_type": "region", "geography_name": region_name, "summary": summary, "breakdown": breakdown}

    def get_province_detail(self, province_name: str, filters: dict[str, Any]) -> dict[str, Any]:
        local_filters = dict(filters)
        local_filters["province"] = province_name
        summary = self.get_kpis(local_filters)
        if summary["total_claims"] == 0:
            raise HTTPException(status_code=404, detail=f"Province '{province_name}' not found")
        where_sql, params = self._build_filter_clauses(local_filters, alias="c")
        breakdown = self._records(
            f"""
            SELECT warranty AS segment, vehicle_brand, COUNT(*) AS claim_count,
                   SUM(claim_amount_paid) AS total_claim_paid,
                   AVG(claim_amount_paid) AS avg_claim_paid
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1, 2
            ORDER BY total_claim_paid DESC
            LIMIT 20
            """,
            params,
        )
        return {"geography_type": "province", "geography_name": province_name, "summary": summary, "breakdown": breakdown}

    def get_vehicle_overview(self, filters: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        where_sql, params = self._build_filter_clauses(filters, alias="v")
        brands = self._records(
            f"""
            SELECT vehicle_brand AS segment, claim_count, total_claim_paid, avg_claim_paid, median_claim_paid,
                   avg_claim_to_premium_ratio, p95_claim_paid, high_cost_share, volatility, concentration_share
            FROM vehicle_mart v
            {self._append_condition(where_sql, "vehicle_level = 'brand'")}
            ORDER BY total_claim_paid DESC
            """,
            params,
        )
        models = self._records(
            f"""
            SELECT vehicle_model AS segment, claim_count, total_claim_paid, avg_claim_paid, median_claim_paid,
                   avg_claim_to_premium_ratio, p95_claim_paid, high_cost_share, volatility, concentration_share
            FROM vehicle_mart v
            {self._append_condition(where_sql, "vehicle_level = 'model'")}
            ORDER BY total_claim_paid DESC
            LIMIT 20
            """,
            params,
        )
        return {"brands": brands, "models": models}

    def get_brand_detail(self, brand_name: str, filters: dict[str, Any]) -> dict[str, Any]:
        local_filters = dict(filters)
        local_filters["brand"] = brand_name
        summary = self.get_kpis(local_filters)
        if summary["total_claims"] == 0:
            raise HTTPException(status_code=404, detail=f"Brand '{brand_name}' not found")
        where_sql, params = self._build_filter_clauses(local_filters, alias="c")
        top_models = self._records(
            f"""
            SELECT vehicle_model AS segment, COUNT(*) AS claim_count,
                   SUM(claim_amount_paid) AS total_claim_paid, AVG(claim_amount_paid) AS avg_claim_paid
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1 ORDER BY total_claim_paid DESC LIMIT 10
            """,
            params,
        )
        warranty_mix = self._records(
            f"""
            SELECT warranty AS segment, COUNT(*) AS claim_count,
                   SUM(claim_amount_paid) AS total_claim_paid
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1 ORDER BY total_claim_paid DESC LIMIT 10
            """,
            params,
        )
        regional_mix = self._records(
            f"""
            SELECT claim_region AS segment, COUNT(*) AS claim_count,
                   SUM(claim_amount_paid) AS total_claim_paid
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1 ORDER BY total_claim_paid DESC LIMIT 10
            """,
            params,
        )
        return {
            "brand": brand_name,
            "summary": summary,
            "top_models": top_models,
            "warranty_mix": warranty_mix,
            "regional_mix": regional_mix,
            "anomaly_rate": summary["anomaly_rate"],
        }

    def search_models(self, q: str) -> list[str]:
        rows = self.conn.execute(
            """
            SELECT DISTINCT vehicle_model
            FROM claim_detail_mart
            WHERE vehicle_model ILIKE ?
            ORDER BY vehicle_model
            LIMIT 20
            """,
            [f"%{q}%"],
        ).fetchall()
        return [row[0] for row in rows]

    def get_claims(self, filters: dict[str, Any], page: int, page_size: int, sort_by: str, sort_order: str) -> dict[str, Any]:
        if page < 1 or page_size < 1 or page_size > 200:
            raise HTTPException(status_code=422, detail="Invalid pagination parameters")
        if sort_by not in self.allowed_claim_sorts:
            raise HTTPException(status_code=422, detail=f"Unsupported sort_by '{sort_by}'")
        sort_direction = "ASC" if sort_order.lower() == "asc" else "DESC"

        where_sql, params = self._build_filter_clauses(filters, alias="c")
        total = self.conn.execute(f"SELECT COUNT(*) FROM claim_detail_mart c {where_sql}", params).fetchone()[0]
        offset = (page - 1) * page_size
        items = self._records(
            f"""
            SELECT claim_id, CAST(claim_date AS DATE) AS claim_date, warranty, claim_region, claim_province,
                   vehicle_brand, vehicle_model, claim_amount_paid, premium_amount_paid,
                   claim_to_premium_ratio, high_cost_flag, anomaly_flag, anomaly_score, anomaly_reason_summary
            FROM claim_detail_mart c
            {where_sql}
            ORDER BY {self.allowed_claim_sorts[sort_by]} {sort_direction}, claim_id
            LIMIT ? OFFSET ?
            """,
            params + [page_size, offset],
        )
        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total,
                "total_pages": ceil(total / page_size) if total else 0,
            },
        }

    def get_claim_detail(self, claim_id: str) -> dict[str, Any]:
        df = self.conn.execute(
            """
            SELECT * FROM claim_detail_mart WHERE claim_id = ?
            """,
            [claim_id],
        ).df()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")
        return self._clean_records(df.to_dict("records"))[0]

    def get_anomalies(self, filters: dict[str, Any], page: int, page_size: int) -> dict[str, Any]:
        local = dict(filters)
        if "anomaly_only" not in local:
            local["anomaly_only"] = True
        where_sql, params = self._build_filter_clauses(local, alias="a")
        total = self.conn.execute(f"SELECT COUNT(*) FROM anomaly_mart a {where_sql}", params).fetchone()[0]
        offset = (page - 1) * page_size
        items = self._records(
            f"""
            SELECT claim_id, CAST(claim_date AS VARCHAR) AS claim_date, warranty, claim_region,
                   vehicle_brand, claim_amount_paid, anomaly_score, anomaly_flag, anomaly_reasons
            FROM anomaly_mart a
            {where_sql}
            ORDER BY anomaly_score DESC, claim_amount_paid DESC
            LIMIT ? OFFSET ?
            """,
            params + [page_size, offset],
        )
        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total,
                "total_pages": ceil(total / page_size) if total else 0,
            },
        }

    def get_anomaly_summary(self, filters: dict[str, Any]) -> dict[str, Any]:
        local = dict(filters)
        local["anomaly_only"] = True
        where_sql, params = self._build_filter_clauses(local, alias="c")
        count_row = self.conn.execute(
            f"""
            SELECT COUNT(*) AS anomaly_count,
                   AVG(CASE WHEN anomaly_flag THEN 1.0 ELSE 0.0 END) AS anomaly_rate
            FROM claim_detail_mart c
            {where_sql}
            """,
            params,
        ).fetchone()

        warranty = self._records(
            f"""
            SELECT warranty AS segment, COUNT(*) AS anomaly_count
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1 ORDER BY anomaly_count DESC LIMIT 10
            """,
            params,
        )
        region = self._records(
            f"""
            SELECT claim_region AS segment, COUNT(*) AS anomaly_count
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1 ORDER BY anomaly_count DESC LIMIT 10
            """,
            params,
        )
        brand = self._records(
            f"""
            SELECT vehicle_brand AS segment, COUNT(*) AS anomaly_count
            FROM claim_detail_mart c
            {where_sql}
            GROUP BY 1 ORDER BY anomaly_count DESC LIMIT 10
            """,
            params,
        )
        reasons_df = self._records(
            f"""
            SELECT TRIM(reason) AS reason, COUNT(*) AS anomaly_count
            FROM (
                SELECT UNNEST(STRING_SPLIT(COALESCE(anomaly_reason_summary, ''), ';')) AS reason
                FROM claim_detail_mart c
                {where_sql}
            )
            WHERE reason <> ''
            GROUP BY 1
            ORDER BY anomaly_count DESC
            LIMIT 10
            """,
            params,
        )
        return {
            "anomaly_count": count_row[0],
            "anomaly_rate": self._clean_value(count_row[1]),
            "concentration_by_warranty": warranty,
            "concentration_by_region": region,
            "concentration_by_brand": brand,
            "top_reason_buckets": reasons_df,
        }

    def get_insight_inputs(self, filters: dict[str, Any]) -> dict[str, Any]:
        return {
            "global_kpis": self.get_kpis(filters),
            "top_warranties": self.get_warranty_overview(filters)[:5],
            "top_regions": self.get_geography_overview(filters)["regions"][:5],
            "top_brands": self.get_vehicle_overview(filters)["brands"][:5],
            "anomaly_summary": self.get_anomaly_summary(filters),
        }
