"""Validation for the reviewed aggregate risk-history publication."""

from __future__ import annotations

import math
import re
from datetime import date
from typing import Any

PANEL_NAMES = (
    "realized_variance",
    "ivhat",
    "rjv",
    "rljv",
    "rsjv",
    "realized_skewness",
    "realized_kurtosis",
)
METRIC_IDS = ("rv_shape_h3", "rv_shape_h4", "rv_shape_closeness")
SOURCE_ID = "minute-risk.factor-panels.mf_volatility_32.archived"
SOURCE_NOTE_ID = "doc:quant-research.research.historical-risk-retained-panel-20261014"
SHA256 = re.compile(r"^[a-f0-9]{64}$")
PRIVATE_KEY = re.compile(r"credential|private|path|ticker|security|recipe|signal", re.I)


def _object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    return value


def _fields(value: dict[str, Any], allowed: set[str], label: str) -> None:
    unknown = set(value) - allowed
    if unknown:
        raise ValueError(f"{label} has unknown fields: {sorted(unknown)}")
    if any(PRIVATE_KEY.search(key) for key in value):
        raise ValueError(f"{label} contains a private field")


def _count(value: Any, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{label} must be a nonnegative integer")
    return value


def _rate(value: Any, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be a bounded rate")
    result = float(value)
    if not math.isfinite(result) or not 0 <= result <= 1:
        raise ValueError(f"{label} must be a bounded rate")
    return result


def _date(value: Any, label: str) -> date:
    if not isinstance(value, str) or not re.fullmatch(r"\d{8}", value):
        raise ValueError(f"{label} must use YYYYMMDD")
    try:
        return date(int(value[:4]), int(value[4:6]), int(value[6:8]))
    except ValueError as error:
        raise ValueError(f"{label} must be a valid date") from error


def _iso_date(value: Any, label: str) -> date:
    if not isinstance(value, str):
        raise ValueError(f"{label} must be an ISO date")
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"{label} must be an ISO date") from error


def _period_rows(
    value: Any, granularity: str, *, sample_dates: int, sampled_securities: int
) -> None:
    if not isinstance(value, list):
        raise ValueError(f"{granularity} history must be a list")
    allowed = {
        "period", "observed_dates", "sampled_securities", "eligible_stock_days",
        "excluded_stock_days", "pooled_jump_share", "pooled_large_jump_share",
        "pooled_small_jump_share", "median_observation_jump_share",
        "positive_residual_prevalence", "partial_period",
    }
    periods = []
    for row_value in value:
        row = _object(row_value, f"{granularity} period")
        _fields(row, allowed, f"{granularity} period")
        period = row.get("period")
        pattern = r"\d{4}-\d{2}" if granularity == "monthly" else r"\d{4}"
        if not isinstance(period, str) or not re.fullmatch(pattern, period):
            raise ValueError(f"invalid {granularity} period")
        periods.append(period)
        for name in ("observed_dates", "sampled_securities", "eligible_stock_days", "excluded_stock_days"):
            _count(row.get(name), name)
        if row["observed_dates"] > sample_dates or row["sampled_securities"] > sampled_securities:
            raise ValueError("period coverage exceeds source coverage")
        for name in (
            "pooled_jump_share", "pooled_large_jump_share", "pooled_small_jump_share",
            "median_observation_jump_share", "positive_residual_prevalence",
        ):
            if row.get(name) is not None:
                _rate(row[name], name)
        if not isinstance(row.get("partial_period"), bool):
            raise ValueError("partial_period must be boolean")
        if row["eligible_stock_days"] + row["excluded_stock_days"] > (
            row["observed_dates"] * sampled_securities
        ):
            raise ValueError("period stock-day counts exceed its coverage grid")
    if periods != sorted(set(periods)):
        raise ValueError(f"{granularity} periods must be unique and sorted")


def validate_risk_history(value: Any) -> None:
    """Raise ValueError unless a value matches the explicit public allowlist."""
    asset = _object(value, "risk history")
    _fields(
        asset,
        {"kind", "schema_version", "source", "coverage", "definitions", "quality",
         "jump_history", "shape_history", "limitations"},
        "risk history",
    )
    if asset.get("kind") != "observatory.risk_history" or asset.get("schema_version") != "1.0":
        raise ValueError("unsupported risk-history identity")

    source = _object(asset.get("source"), "source")
    _fields(
        source,
        {"source_id", "source_note_id", "source_hashes", "producer_repository",
         "producer_revision", "review_date", "evidence_stage"},
        "source",
    )
    if source.get("source_id") != SOURCE_ID or source.get("source_note_id") != SOURCE_NOTE_ID:
        raise ValueError("unreviewed risk-history source reference")
    if source.get("producer_repository") != "runchengxie/quant-research":
        raise ValueError("unexpected producer repository")
    if not isinstance(source.get("producer_revision"), str) or not re.fullmatch(
        r"[a-f0-9]{40}", source["producer_revision"]
    ):
        raise ValueError("producer revision must be a full Git SHA")
    hashes = _object(source.get("source_hashes"), "source hashes")
    if set(hashes) != set(PANEL_NAMES) or any(
        not isinstance(item, str) or not SHA256.fullmatch(item) for item in hashes.values()
    ):
        raise ValueError("source hashes must cover each retained panel")
    _iso_date(source.get("review_date"), "review date")
    if source.get("evidence_stage") != "archived_descriptive_panel":
        raise ValueError("unexpected evidence stage")

    coverage = _object(asset.get("coverage"), "coverage")
    _fields(
        coverage,
        {"date_start", "date_end", "observed_dates", "sampled_securities",
         "aligned_stock_days", "point_in_time_qualified", "units"},
        "coverage",
    )
    start, end = _date(coverage.get("date_start"), "date start"), _date(
        coverage.get("date_end"), "date end"
    )
    if start > end or coverage.get("point_in_time_qualified") is not False:
        raise ValueError("invalid date range or unsupported point-in-time claim")
    dates = _count(coverage.get("observed_dates"), "observed dates")
    securities = _count(coverage.get("sampled_securities"), "sampled securities")
    grid = _count(coverage.get("aligned_stock_days"), "aligned stock-days")
    if not dates or not securities or grid != dates * securities:
        raise ValueError("coverage dimensions do not reconcile")

    quality = _object(asset.get("quality"), "quality")
    _fields(
        quality,
        {"grid_stock_days", "complete_risk_observations", "missing_value_count",
         "nonfinite_value_count", "negative_risk_value_count", "zero_rv_count",
         "raw_ivhat_above_rv_count", "raw_ivhat_rjv_reconciliation_failures",
         "rjv_rljv_rsjv_reconciliation_failures", "eligible_stock_days",
         "excluded_stock_days", "panels"},
        "quality",
    )
    if quality.get("grid_stock_days") != grid:
        raise ValueError("quality grid disagrees with coverage")
    for key, count in quality.items():
        if key != "panels":
            _count(count, key)
    if quality["eligible_stock_days"] + quality["excluded_stock_days"] != grid:
        raise ValueError("eligible and excluded counts must equal the grid")
    panels = _object(quality.get("panels"), "panel quality")
    if set(panels) != set(PANEL_NAMES):
        raise ValueError("panel quality must cover every retained panel")
    missing_total = nonfinite_total = negative_total = 0
    for name, panel_value in panels.items():
        panel = _object(panel_value, f"panel quality {name}")
        allowed = {"valid_values", "missing_values", "nonfinite_values"}
        if name in PANEL_NAMES[:5]:
            allowed.add("negative_risk_values")
        _fields(panel, allowed, f"panel quality {name}")
        valid = _count(panel.get("valid_values"), "valid values")
        missing = _count(panel.get("missing_values"), "missing values")
        nonfinite = _count(panel.get("nonfinite_values"), "nonfinite values")
        negative = _count(panel.get("negative_risk_values", 0), "negative values")
        if valid + missing + nonfinite != grid:
            raise ValueError("panel quality counts do not reconcile")
        missing_total += missing
        nonfinite_total += nonfinite
        negative_total += negative
    if (
        missing_total != quality["missing_value_count"]
        or nonfinite_total != quality["nonfinite_value_count"]
        or negative_total != quality["negative_risk_value_count"]
    ):
        raise ValueError("aggregate and panel quality counts do not reconcile")

    jumps = _object(asset.get("jump_history"), "jump history")
    _fields(jumps, {"monthly", "annual"}, "jump history")
    _period_rows(
        jumps.get("monthly"), "monthly", sample_dates=dates, sampled_securities=securities
    )
    _period_rows(
        jumps.get("annual"), "annual", sample_dates=dates, sampled_securities=securities
    )
    shape = _object(asset.get("shape_history"), "shape history")
    _fields(shape, {"metrics", "window_sensitivity", "tail_sensitivity", "correlations"}, "shape history")
    for group in ("metrics", "window_sensitivity", "tail_sensitivity", "correlations"):
        members = _object(shape.get(group), group)
        if set(members) != set(METRIC_IDS):
            raise ValueError(f"{group} must cover all reviewed RV-shape metrics")
    for locale in ("en-US", "zh-CN"):
        if not isinstance(asset.get("definitions", {}).get("correlation", {}).get(locale), str):
            raise ValueError("localized definitions are required")
        if not isinstance(asset.get("limitations", {}).get(locale), list):
            raise ValueError("localized limitations are required")
