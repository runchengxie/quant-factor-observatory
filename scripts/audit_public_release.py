#!/usr/bin/env python3
"""Fail when private implementation details enter the public Observatory tree."""

from __future__ import annotations

import re
import subprocess
import sys
import hashlib
import json
from pathlib import Path

try:
    from .check_factor_demo_quantiles import check_demo_quantiles
    from .risk_history_contract import validate_risk_history
except ImportError:
    from check_factor_demo_quantiles import check_demo_quantiles
    from risk_history_contract import validate_risk_history


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOTS = ("README.md", "README.zh-CN.md", "docs", "site", ".github")
ALLOWED_ROOT_FILES = {".gitignore", "README.md", "README.zh-CN.md", "AGENTS.md"}
ALLOWED_PREFIXES = (".github/", "docs/", "scripts/", "site/", "tests/")
FORBIDDEN_PATTERNS = {
    r"/(?:home|Users)/": "developer-local path",
    r"\b" + "tush" + "are" + r"\b": "provider or dataset name",
    r"\b" + "data_" + "requirements" + r"\b": "raw input metadata key",
    r"\b" + "operate_" + "profit" + r"\b": "raw financial field",
    r"\b" + "market_" + "value" + r"\b": "raw financial field",
    r"\b" + "ts_" + "zscore" + r"\b": "exact operator name",
    r"\bformula(?:Latex)?\b": "formula metadata key",
}


def tracked_files() -> list[str]:
    output = subprocess.check_output(["git", "ls-files"], cwd=ROOT, text=True)
    return [line for line in output.splitlines() if line]


def public_files(paths: list[str]) -> list[Path]:
    result: list[Path] = []
    for relative in paths:
        path = ROOT / relative
        if path.is_file():
            result.append(path)
        elif path.is_dir():
            result.extend(
                item for item in path.rglob("*")
                if item.is_file() and not {"node_modules", "dist", "__pycache__", ".git"}.intersection(item.parts)
            )
    return result


def audit() -> list[str]:
    errors: list[str] = []
    try:
        try:
            from scripts.legacy_factor_evidence_contract import validate_repository
        except ImportError:
            from legacy_factor_evidence_contract import validate_repository
        validate_repository(ROOT)
    except (ValueError, KeyError, OSError) as error:
        errors.append(f"legacy factor evidence: {error}")
    tracked = set(tracked_files())
    unexpected = sorted(path for path in tracked if path not in ALLOWED_ROOT_FILES and not path.startswith(ALLOWED_PREFIXES))
    errors.extend(f"file is outside the public allowlist: {path}" for path in unexpected)

    for path in public_files(list(PUBLIC_ROOTS)):
        text = path.read_text(errors="ignore")
        relative = path.relative_to(ROOT).as_posix()
        for pattern, description in FORBIDDEN_PATTERNS.items():
            if re.search(pattern, text, re.IGNORECASE):
                errors.append(f"{description} in {relative}: {pattern}")

    try:
        asset_path = ROOT / "site/public/data/risk-history.json"
        asset = json.loads(asset_path.read_text(encoding="utf-8"))
        validate_risk_history(asset)
        asset_hash = hashlib.sha256(asset_path.read_bytes()).hexdigest()
        manifest = json.loads(
            (ROOT / "site/public/data/research-publication-manifest.json").read_text(
                encoding="utf-8"
            )
        )
        publication = next(
            item for item in manifest["projections"] if item.get("public_id") == "risk-history"
        )
        if publication.get("asset_sha256") != asset_hash:
            errors.append("risk-history asset hash does not match the publication manifest")
        review = json.loads(
            (ROOT / "site/public/data/research-source-review.json").read_text(
                encoding="utf-8"
            )
        )
        review_entry = next(
            item for item in review.get("public_assets", [])
            if item.get("public_id") == "risk-history"
        )
        if review_entry.get("asset_sha256") != asset_hash:
            errors.append("risk-history asset hash does not match the source review")
        if review_entry.get("source_ref") != asset["source"]["source_note_id"]:
            errors.append("risk-history source review points to a different source note")
        if review_entry.get("source_note_revision") != publication.get("source_note_revision"):
            errors.append("risk-history source note revision differs between publication records")
        snapshot = json.loads((ROOT / "site/public/data/factor-snapshot.json").read_text())
        check_demo_quantiles(snapshot)
    except (OSError, ValueError, KeyError, StopIteration, TypeError) as error:
        errors.append(f"risk-history publication contract failed: {error}")
    return errors


def main() -> int:
    errors = audit()
    if errors:
        print("Public release audit failed:", file=sys.stderr)
        print("\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1
    print("Public release audit passed: no private implementation details found in the public tree.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
