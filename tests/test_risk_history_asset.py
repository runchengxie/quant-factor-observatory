import copy
import json
import hashlib
import unittest
from pathlib import Path

from scripts.check_factor_demo_quantiles import compute_demo_quantiles
from scripts.risk_history_contract import validate_risk_history


ROOT = Path(__file__).parents[1]
ASSET_PATH = ROOT / "site/public/data/risk-history.json"


class RiskHistoryAssetTests(unittest.TestCase):
    def setUp(self):
        self.asset = json.loads(ASSET_PATH.read_text(encoding="utf-8"))

    def test_reviewed_asset_has_exact_contract_and_source_hashes(self):
        validate_risk_history(self.asset)
        self.assertEqual(self.asset["kind"], "observatory.risk_history")
        self.assertEqual(self.asset["coverage"]["sampled_securities"], 5394)
        self.assertFalse(self.asset["coverage"]["point_in_time_qualified"])
        manifest = json.loads((ROOT / "site/public/data/research-publication-manifest.json").read_text())
        projection = next(item for item in manifest["projections"] if item["public_id"] == "risk-history")
        digest = hashlib.sha256(ASSET_PATH.read_bytes()).hexdigest()
        self.assertEqual(projection["asset_sha256"], digest)
        self.assertEqual(len(projection["source_note_revision"]), 40)
        review = json.loads((ROOT / "site/public/data/research-source-review.json").read_text())
        self.assertEqual(review["public_assets"][0]["asset_sha256"], digest)
        self.assertEqual(
            review["public_assets"][0]["source_note_revision"],
            projection["source_note_revision"],
        )

    def test_contract_rejects_unknown_private_and_invalid_fields(self):
        cases = []
        unknown = copy.deepcopy(self.asset)
        unknown["private_path"] = "/home/private"
        cases.append(unknown)
        invalid_count = copy.deepcopy(self.asset)
        invalid_count["quality"]["eligible_stock_days"] = -1
        cases.append(invalid_count)
        invalid_rate = copy.deepcopy(self.asset)
        invalid_rate["jump_history"]["annual"][0]["pooled_jump_share"] = 1.2
        cases.append(invalid_rate)
        bad_source = copy.deepcopy(self.asset)
        bad_source["source"]["source_note_id"] = "private/source"
        cases.append(bad_source)
        for value in cases:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    validate_risk_history(value)

    def test_demo_quantiles_are_recomputed_from_same_date_rows(self):
        snapshot = json.loads((ROOT / "site/public/data/factor-snapshot.json").read_text())
        self.assertEqual(
            compute_demo_quantiles(snapshot),
            {
                "metric": "vol_rv_ts_closeness_60",
                "date": "2026-07-03",
                "count": 3,
                "p01": -1.675238,
                "p25": -1.40735,
                "p50": -1.1283,
                "p75": -0.90545,
                "p99": -0.691514,
            },
        )


if __name__ == "__main__":
    unittest.main()
