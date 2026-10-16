"""Validate reviewed factor-method links before building or publishing the site."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


def validate_legacy_factor_evidence(asset: dict, review: dict, raw: bytes) -> None:
    review_fields = {'schema_version', 'source_sha256', 'content_sha256',
                     'asset_sha256', 'review_kind', 'reviewed_on'}
    if set(review) != review_fields or review['schema_version'] != 'research.legacy_strategy_review.v1':
        raise ValueError('unknown public review fields')
    fields = {'schema_version', 'reviewed_source_digest', 'reviewed_content_digest', 'studies'}
    if set(asset) != fields or asset['schema_version'] != 'research.legacy_strategy_public.v1':
        raise ValueError('unknown legacy evidence contract')
    content = json.dumps(asset['studies'], sort_keys=True, separators=(',', ':'), allow_nan=False).encode()
    if hashlib.sha256(content).hexdigest() != review['content_sha256']:
        raise ValueError('reviewed public content digest mismatch')
    if hashlib.sha256(raw).hexdigest() != review['asset_sha256']:
        raise ValueError('reviewed public asset digest mismatch')
    if asset['reviewed_source_digest'] != review['source_sha256']:
        raise ValueError('reviewed source identity mismatch')
    if asset['reviewed_content_digest'] != review['content_sha256']:
        raise ValueError('reviewed content identity mismatch')
    if review['review_kind'] != 'independent_agent':
        raise ValueError('unsupported review record')
    for study in asset['studies']:
        if study['id'] not in {'etf-rotation', 'hotsector'}:
            raise ValueError('unknown study identity')
        if set(study['factor_refs']) - {'illiquidity', 'realized_variance'}:
            raise ValueError('strategy or unknown identity cannot be registered as factor')
        if study['metrics']:
            raise ValueError('this methods-only release has no admitted factor metrics')


def validate_repository(root: Path) -> None:
    data = root / 'site/public/data'
    raw = (data / 'legacy-strategy-evidence.json').read_bytes()
    review = json.loads((data / 'legacy-strategy-review.json').read_text())
    validate_legacy_factor_evidence(json.loads(raw), review, raw)


if __name__ == '__main__':
    validate_repository(Path(__file__).resolve().parents[1])
    print('Reviewed legacy factor evidence contract passed.')
