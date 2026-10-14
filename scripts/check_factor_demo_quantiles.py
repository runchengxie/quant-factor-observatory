#!/usr/bin/env python3
"""Keep the demo cross-section summary consistent with its published series."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "site/public/data/factor-snapshot.json"
METRIC = "vol_rv_ts_closeness_60"


def _quantile(values: list[float], probability: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * probability
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def compute_demo_quantiles(snapshot: dict[str, Any]) -> dict[str, Any]:
    rows = [row for row in snapshot["cross_section"] if row.get("metric") == METRIC]
    if len(rows) != 1:
        raise ValueError(f"expected exactly one demo cross-section row for {METRIC}")
    date = rows[0]["date"]
    observations = []
    for series in snapshot["series"]:
        if series.get("metric") != METRIC or date not in series.get("dates", []):
            continue
        index = series["dates"].index(date)
        value = series["values"][index]
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            observations.append(float(value))
    if len(observations) != rows[0].get("count"):
        raise ValueError("demo series count does not match the published cross-section count")
    return {
        "metric": METRIC,
        "date": date,
        "count": len(observations),
        **{
            f"p{int(probability * 100):02d}": round(_quantile(observations, probability), 6)
            for probability in (0.01, 0.25, 0.5, 0.75, 0.99)
        },
    }


def check_demo_quantiles(snapshot: dict[str, Any]) -> None:
    expected = compute_demo_quantiles(snapshot)
    row = next(item for item in snapshot["cross_section"] if item["metric"] == METRIC)
    for key in ("count", "p01", "p25", "p50", "p75", "p99"):
        if row.get(key) != expected[key]:
            raise ValueError(f"demo quantile {key} is stale: expected {expected[key]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the published snapshot")
    args = parser.parse_args()
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    expected = compute_demo_quantiles(snapshot)
    if args.check:
        check_demo_quantiles(snapshot)
    print(json.dumps(expected, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
