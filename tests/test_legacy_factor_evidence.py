"""Transferred research links refer to individual factors and reviewed aggregate evidence."""

import hashlib
import json
from pathlib import Path
import unittest


class LegacyFactorEvidenceTests(unittest.TestCase):
    def test_review_identity_and_asset_digest_match(self):
        root = Path(__file__).resolve().parents[1] / 'site/public/data'
        raw = (root / 'legacy-strategy-evidence.json').read_bytes()
        asset = json.loads(raw)
        review = json.loads((root / 'legacy-strategy-review.json').read_text())
        self.assertEqual(hashlib.sha256(raw).hexdigest(), review['asset_sha256'])
        self.assertEqual(asset['reviewed_source_digest'], review['source_sha256'])
        self.assertEqual(asset['reviewed_content_digest'], review['content_sha256'])

    def test_whole_strategies_are_not_registered_as_factors(self):
        module = (Path(__file__).resolve().parents[1] / 'site/src/legacyFactorEvidence.ts').read_text()
        self.assertIn('illiquidity', module)
        self.assertIn('realized_variance', module)
        self.assertNotIn("factorId: 'etf-rotation'", module)
        self.assertNotIn("factorId: 'hotsector'", module)


if __name__ == '__main__':
    unittest.main()


class LegacyFactorEvidenceIntegrityTests(unittest.TestCase):
    def test_edited_content_with_unchanged_labels_is_rejected(self):
        from scripts.legacy_factor_evidence_contract import validate_legacy_factor_evidence
        root = Path(__file__).resolve().parents[1] / 'site/public/data'
        raw = (root / 'legacy-strategy-evidence.json').read_bytes()
        asset = json.loads(raw)
        review = json.loads((root / 'legacy-strategy-review.json').read_text())
        validate_legacy_factor_evidence(asset, review, raw)
        asset['studies'][0]['conclusion'] = 'Unsupported edited conclusion'
        with self.assertRaisesRegex(ValueError, 'content'):
            validate_legacy_factor_evidence(asset, review, raw)
