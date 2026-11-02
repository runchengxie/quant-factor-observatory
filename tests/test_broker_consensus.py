"""Public broker consensus evidence keeps timing and sample limits visible."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATA = ROOT / "site/public/data"


class BrokerConsensusTests(unittest.TestCase):
    def test_source_bound_study_has_coverage_timing_and_factor_charts(self):
        data = json.loads((DATA / "study-exploration/broker-consensus.json").read_text())
        self.assertEqual(data["evidence_stage"], "retrospective_diagnostic")
        self.assertTrue(data["expanded_details"])
        chart_ids = {chart["id"] for chart in data["charts"]}
        self.assertTrue({"annual-records", "provider-delay", "timing-coverage", "rank-comparison",
                         "profit-revision-years", "complete-spread-months"} <= chart_ids)
        text = json.dumps(data, ensure_ascii=False)
        self.assertIn("2022", text)
        self.assertIn("历史版本", text)
        self.assertNotIn("/home/", text)

    def test_navigation_pins_real_run_revision_without_claiming_complete_pit(self):
        data = json.loads((DATA / "study-navigation/broker-consensus.json").read_text())
        self.assertRegex(data["reproduction"]["code_revision"], r"^[a-f0-9]{40}$")
        trust = {row["dimension"]: row for row in data["trust"]}
        self.assertEqual(trust["financial_versions"]["status"], "unverified")
        self.assertEqual(trust["delisting_and_terminal"]["status"], "unverified")

    def test_every_rank_and_cost_estimate_retains_months_and_intervals(self):
        data = json.loads((DATA / "study-exploration/broker-consensus.json").read_text())
        charts = {chart["id"]: chart for chart in data["charts"]}
        for name in ("rank-comparison", "matched-timing-ranks", "cost-sensitivity"):
            for series in charts[name]["series"]:
                self.assertEqual(len(series["months"]), len(series["values"]))
                self.assertEqual(len(series["lower"]), len(series["values"]))
                self.assertEqual(len(series["upper"]), len(series["values"]))
