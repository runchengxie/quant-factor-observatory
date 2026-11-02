"""Public broker consensus evidence keeps timing and sample limits visible."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATA = ROOT / "site/public/data"


class BrokerConsensusTests(unittest.TestCase):
    def test_source_bound_study_has_coverage_timing_and_factor_charts(self):
        data = json.loads(
            (DATA / "study-exploration/broker-consensus.json").read_text()
        )
        self.assertEqual(data["evidence_stage"], "retrospective_diagnostic")
        self.assertTrue(data["expanded_details"])
        chart_ids = {chart["id"] for chart in data["charts"]}
        self.assertTrue(
            {
                "annual-records",
                "provider-delay",
                "timing-coverage",
                "rank-comparison",
                "profit-revision-years",
                "complete-spread-months",
                "paired-valuation-rankic",
                "forecast-reported-rankic-delta",
                "forecast-reported-net-spread-delta",
                "missing-endpoint-reasons",
                "missing-endpoints-by-year",
                "paired-valuation-coverage",
            }
            <= chart_ids
        )
        coverage = next(
            chart
            for chart in data["charts"]
            if chart["id"] == "paired-valuation-coverage"
        )
        self.assertEqual(
            coverage["series"][0]["values"], [271841, 219014, 21663, 31164]
        )
        self.assertIn("188-month", coverage["metric"]["en-US"])
        self.assertIn("188个月", coverage["metric"]["zh-CN"])
        comparisons = {chart["id"]: chart for chart in data["charts"]}
        rank_delta = comparisons["forecast-reported-rankic-delta"]["context"]
        spread_delta = comparisons["forecast-reported-net-spread-delta"]["context"]
        self.assertIn("calculate RankIC", rank_delta["en-US"])
        self.assertIn("after-cost top-minus-bottom returns", spread_delta["en-US"])
        self.assertIn("共同月份", rank_delta["zh-CN"])
        self.assertIn("扣费后的高低组收益差", spread_delta["zh-CN"])
        text = json.dumps(data, ensure_ascii=False)
        self.assertIn("2022", text)
        self.assertIn("历史版本", text)
        self.assertNotIn("/home/", text)


    def test_reader_retains_stock_selection_limits_and_new_comparisons(self):
        data = json.loads((DATA / "study-exploration/broker-consensus.json").read_text())
        ids = {chart["id"] for chart in data["charts"]}
        self.assertEqual(len(ids), 25)
        self.assertTrue({"benchmark-profit", "benchmark-loss", "benchmark-paired-improvement",
                         "coverage-profit", "coverage-loss", "coverage-controlled-profit",
                         "coverage-controlled-loss"} <= ids)
        self.assertIn("还需要更多证据", data["reader"]["verdict"]["zh-CN"])
        self.assertEqual(data["reader_source_revision"], "8559b14fd5bbbfa1ec6a14440efc2231f29dbc34")
        for section in data["reader"]["sections"]:
            self.assertTrue(set(section["chart_ids"]) <= ids)
            self.assertTrue(section["paragraphs"])
        paired = next(c for c in data["charts"] if c["id"] == "benchmark-paired-improvement")
        self.assertNotIn("months", paired["series"][0])
        self.assertLess(paired["series"][0]["lower"][2], 0)
        self.assertGreater(paired["series"][0]["upper"][2], 0)

    def test_benchmark_public_projection_strips_private_fields_recursively(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("broker_reader", ROOT / "scripts/build_broker_consensus_reader.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        source = json.loads((DATA / "broker-consensus-benchmark.json").read_text())
        source["source_hashes"] = {"/private/path": "secret"}
        source["comparisons"][0]["ts_code"] = "private-security"
        source["controlled_coverage"][0]["terms"][0]["private_path"] = "secret"
        projected = module.project(source)
        encoded = json.dumps(projected)
        self.assertNotIn("private", encoded)
        self.assertNotIn("source_hashes", encoded)
        self.assertEqual(projected["comparisons"][0]["stock_years"], source["comparisons"][0]["stock_years"])

    def test_followup_projection_contains_only_aggregates_and_paired_uncertainty(self):
        data = json.loads((DATA / "broker-consensus-followup.json").read_text())
        self.assertEqual(data["schema_version"], "broker_consensus.followup.public.v1")
        self.assertEqual(
            data["suspension_coverage_check"],
            {
                "within_source_coverage_unresolved": 395,
                "after_source_coverage_unresolved": 2,
            },
        )
        self.assertEqual(data["bounded_price_probe"]["case_count"], 20)
        self.assertFalse(data["bounded_price_probe"]["representative_sample"])
        text = json.dumps(data)
        self.assertNotIn("ts_code", text)
        self.assertNotIn("private_path", text)

    def test_navigation_pins_real_run_revision_without_claiming_complete_pit(self):
        data = json.loads((DATA / "study-navigation/broker-consensus.json").read_text())
        self.assertRegex(data["reproduction"]["code_revision"], r"^[a-f0-9]{40}$")
        trust = {row["dimension"]: row for row in data["trust"]}
        self.assertEqual(trust["financial_versions"]["status"], "unverified")
        self.assertEqual(trust["delisting_and_terminal"]["status"], "unverified")

    def test_every_rank_and_cost_estimate_retains_months_and_intervals(self):
        data = json.loads(
            (DATA / "study-exploration/broker-consensus.json").read_text()
        )
        charts = {chart["id"]: chart for chart in data["charts"]}
        for name in (
            "rank-comparison",
            "matched-timing-ranks",
            "cost-sensitivity",
            "paired-valuation-rankic",
            "forecast-reported-rankic-delta",
            "forecast-reported-net-spread-delta",
        ):
            for series in charts[name]["series"]:
                self.assertEqual(len(series["months"]), len(series["values"]))
                self.assertEqual(len(series["lower"]), len(series["values"]))
                self.assertEqual(len(series["upper"]), len(series["values"]))
