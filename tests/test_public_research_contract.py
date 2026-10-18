import json
import re
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
PUBLIC_DATA = ROOT / "site" / "public" / "data"
PUBLIC_SOURCE = ROOT / "site" / "src"


def _factor_rows(value):
    if isinstance(value, dict) and isinstance(value.get("factors"), list):
        return value["factors"]
    return []


class PublicResearchContractTests(unittest.TestCase):
    def test_demo_factor_group_counts_match_published_rows(self):
        snapshot = json.loads((PUBLIC_DATA / "factor-snapshot.json").read_text())
        self.assertEqual(sum(group["count"] for group in snapshot["factor_groups"]), len(snapshot["factors"]))

    def test_research_publication_manifest_is_a_redacted_projection_contract(self):
        manifest = json.loads((PUBLIC_DATA / "research-publication-manifest.json").read_text())
        self.assertEqual(manifest["schema_version"], "observatory.research_publication.v1")
        self.assertEqual(manifest["source_repository"], "quant-research")
        self.assertTrue(manifest["projections"])
        for projection in manifest["projections"]:
            self.assertRegex(projection["source_ref"], r"^doc:quant-research\.")
            self.assertEqual(set(projection["locales"]), {"en-US", "zh-CN"})
            excluded = " ".join(projection["excluded_fields"])
            self.assertIn("per_security_signals", excluded)

    def test_fundamental_series_projections_use_stable_quant_research_documents(self):
        manifest = json.loads((PUBLIC_DATA / "research-publication-manifest.json").read_text())
        projections = {item["public_id"]: item for item in manifest["projections"]}
        expected = {
            "fundamental-series": "doc:quant-research.research.fundamental-research-series",
            "rd-investment": "doc:quant-research.research.rd-investment-relative-valuation",
            "fundamental-state-forecasting": "doc:quant-research.research.long-term-fundamental-v2",
            "absolute-level-forecast": "doc:quant-research.research.fundamental-state-forecasting",
            "fundamental-family-shadow": "doc:quant-research.research.fundamental-family-shadow",
            "cashflow-indices": "doc:quant-research.research.cashflow-indices-map",
            "pb-roe": "doc:quant-research.strategy.pb-roe-value-quality",
            "hk-fundamental-archive": "doc:quant-research.archive.hk-experiment-recovery-20260928",
            "employee-compensation": "doc:quant-research.research.fundamental-research-series",
        }
        self.assertTrue(expected.keys() <= projections.keys())
        for public_id, source_ref in expected.items():
            projection = projections[public_id]
            self.assertEqual(projection["source_ref"], source_ref)
            self.assertIn(
                projection["publication_status"],
                {"reviewed_aggregate", "preliminary_aggregate", "historical_archive", "hypothesis_only"},
            )
            self.assertEqual(set(projection["locales"]), {"en-US", "zh-CN"})

    def test_fundamental_series_and_study_taxonomy_are_bilingual_and_source_backed(self):
        catalog = json.loads((PUBLIC_DATA / "research-studies.json").read_text())
        manifest = json.loads((PUBLIC_DATA / "research-publication-manifest.json").read_text())
        projections = {item["public_id"]: item for item in manifest["projections"]}
        self.assertEqual(catalog["series"][0]["id"], "fundamental")
        self.assertEqual(
            set(catalog["series"][0]["translations"]), {"en-US", "zh-CN"}
        )
        self.assertEqual(
            set(catalog["series"][0]["study_ids"]),
            {study["id"] for study in catalog["studies"]},
        )
        fundamental_series = catalog["series"][0]
        candidate_coverage = fundamental_series["candidate_coverage"]
        factor_catalog = json.loads((PUBLIC_DATA / candidate_coverage["catalog_source"]).read_text())
        catalog_candidate_ids = {factor["id"] for factor in factor_catalog["factors"]}
        self.assertEqual(candidate_coverage["status"], "catalog_hypothesis_only")
        self.assertEqual(set(candidate_coverage["candidate_ids"]), catalog_candidate_ids)
        self.assertEqual(fundamental_series["candidate_count"], len(catalog_candidate_ids))
        self.assertEqual(candidate_coverage["candidate_level_predictive_validation_ids"], [])
        self.assertTrue(all(factor["research_status"] == "experimental" for factor in factor_catalog["factors"]))
        allowed_markets = {"a_share", "hong_kong"}
        allowed_stages = {
            "hypothesis",
            "exploratory",
            "retrospective_diagnostic",
            "prospective_holdout_pending",
            "reviewed_research",
            "historical_archive",
        }
        for study in catalog["studies"]:
            self.assertEqual(study["series"], "fundamental", study["id"])
            self.assertIn(study["market"], allowed_markets, study["id"])
            self.assertTrue(study["method"], study["id"])
            self.assertTrue(study["frequency"], study["id"])
            self.assertIn(study["evidence_stage"], allowed_stages, study["id"])
            self.assertIn(study["publication_id"], projections, study["id"])
            self.assertEqual(
                study["source_ref"], projections[study["publication_id"]]["source_ref"]
            )
            self.assertEqual(study["series"], catalog["series"][0]["id"])

    def test_hong_kong_fundamental_study_stays_in_historical_archive_lane(self):
        catalog = json.loads((PUBLIC_DATA / "research-studies.json").read_text())
        study = next(item for item in catalog["studies"] if item["id"] == "hk-fundamental-archive")
        self.assertEqual(study["market"], "hong_kong")
        self.assertEqual(study["evidence_stage"], "historical_archive")
        self.assertEqual(study["status"], "historical-reviewed")
        text = json.dumps(study, ensure_ascii=False).lower()
        self.assertIn("a-share", text)
        self.assertTrue(any(token in text for token in ("transfer", "外推", "迁移")))

    def test_research_publication_manifest_contains_no_private_paths_or_credentials(self):
        text = (PUBLIC_DATA / "research-publication-manifest.json").read_text()
        self.assertNotRegex(text, re.compile(r"/home/|/Users/|private-panel|(?:api|access|secret)[_-]?key", re.I))

    def test_public_factor_artifacts_do_not_expose_exact_operators(self):
        for path in sorted(PUBLIC_DATA.glob("*.json")):
            value = json.loads(path.read_text())
            for factor in _factor_rows(value):
                self.assertNotIn("formula", factor, path.name)
                self.assertNotIn("formulaLatex", factor, path.name)
                self.assertNotIn("data_requirements", factor, path.name)

    def test_public_catalog_has_research_definition_and_labor_family(self):
        catalog = json.loads((PUBLIC_DATA / "fundamental-factor-catalog.json").read_text())
        self.assertTrue(all(factor.get("definition") for factor in catalog["factors"]))
        self.assertTrue(all(factor.get("research_status") for factor in catalog["factors"]))
        self.assertIn("人力资本 / 劳动", {factor["family"] for factor in catalog["factors"]})
        labor = [factor for factor in catalog["factors"] if factor["family"] == "人力资本 / 劳动"]
        self.assertTrue(all(factor["research_status"] == "experimental" for factor in labor))
        self.assertTrue(all("rank_ic" not in factor for factor in labor))

    def test_study_pages_keep_evidence_status_and_avoid_unreviewed_payroll_metrics(self):
        catalog = json.loads((PUBLIC_DATA / "research-studies.json").read_text())
        studies = {study["id"]: study for study in catalog["studies"]}
        self.assertEqual(
            set(studies), {
                "pb-roe", "rd-investment", "employee-compensation", "cashflow-indices",
                "fundamental-state-forecasting", "absolute-level-forecast",
                "fundamental-family-shadow", "hk-fundamental-archive",
            }
        )
        self.assertEqual(studies["pb-roe"]["status"], "historical-reviewed")
        self.assertEqual(len(studies["pb-roe"]["rows"]), 5)
        self.assertEqual(studies["rd-investment"]["status"], "preliminary")
        self.assertIn("遗留", studies["rd-investment"]["source_note"])
        self.assertEqual(studies["employee-compensation"]["status"], "hypothesis")
        self.assertEqual(studies["employee-compensation"]["rows"], [])
        self.assertEqual(studies["cashflow-indices"]["status"], "preliminary")
        self.assertEqual(len(studies["cashflow-indices"]["rows"]), 2)

    def test_study_pages_publish_complete_english_copy(self):
        catalog = json.loads((PUBLIC_DATA / "research-studies.json").read_text())
        required = {"title", "family", "status_label", "summary", "period", "source_note", "columns", "rows", "findings", "limits"}
        for study in catalog["studies"]:
            self.assertIn("translations", study)
            self.assertIn("en-US", study["translations"])
            self.assertEqual(set(study["translations"]["en-US"]), required, study["id"])
            english = study["translations"]["en-US"]
            self.assertTrue(all(len(row) == len(english["columns"]) for row in english["rows"]), study["id"])

    def test_rd_study_translations_and_public_method_note_are_consistent(self):
        catalog = json.loads((PUBLIC_DATA / "research-studies.json").read_text())
        study = next(item for item in catalog["studies"] if item["id"] == "rd-investment")
        english = study["translations"]["en-US"]
        self.assertEqual(len(english["findings"]), len(set(english["findings"])))
        self.assertTrue(any("R&D growth" in item and "revenue" in item for item in english["findings"]))
        self.assertIn("frozen-holdout", " ".join(english["limits"]))
        self.assertEqual(study["source_url"], "research/rd-investment-method.html")
        note = (ROOT / "site" / "public" / study["source_url"]).read_text()
        for required_claim in ("77 valid monthly cross-sections", "66", "No frozen holdout metrics", "12.70%"):
            self.assertIn(required_claim, note)
        self.assertNotIn("/home/", note)

    def test_rd_legacy_annual_evidence_is_explicitly_not_current(self):
        annual = json.loads((PUBLIC_DATA / "rd-investment-annual.json").read_text())
        self.assertEqual(annual["publication_status"], "legacy_unaligned_diagnostic")
        self.assertIn("not part of the corrected current PIT run", annual["public_notice"])
        catalog = json.loads((PUBLIC_DATA / "research-studies.json").read_text())
        study = next(item for item in catalog["studies"] if item["id"] == "rd-investment")
        self.assertNotIn("annual_evidence", study)
        self.assertNotIn("supplemental_evidence", study)

    def test_rd_annual_projection_is_aggregate_and_marks_unavailable_years(self):
        annual = json.loads((PUBLIC_DATA / "rd-investment-annual.json").read_text())
        self.assertFalse(annual["revision_safe"])
        self.assertEqual(annual["publication_status"], "legacy_unaligned_diagnostic")
        expected_factors = {
            "rd_mv", "rd_mv_resid", "rd_ev", "rd_capitalized", "rd_sales", "rd_assets", "rd_growth",
        }
        self.assertEqual({item["factor"] for item in annual["series"]}, expected_factors)
        forbidden = {"symbol", "ticker", "security_id", "portfolio_weights", "weight"}

        def keys(value):
            if isinstance(value, dict):
                for key, nested in value.items():
                    yield key
                    yield from keys(nested)
            elif isinstance(value, list):
                for nested in value:
                    yield from keys(nested)

        self.assertTrue(forbidden.isdisjoint(set(keys(annual))))
        for series in annual["series"]:
            years = {point["year"]: point for point in series["years"]}
            self.assertTrue(set(range(2015, 2027)).issubset(years))
            self.assertIsNone(years[2015]["rank_ic"])
            self.assertEqual(years[2015]["evidence_status"], "missing_lookback")
            self.assertEqual(years[2016]["evidence_status"], "below_minimum_cross_section")

    def test_cashflow_study_is_backed_by_a_stable_source_projection(self):
        manifest = json.loads((PUBLIC_DATA / "research-publication-manifest.json").read_text())
        projection = next(
            item for item in manifest["projections"] if item["public_id"] == "cashflow-indices"
        )
        self.assertEqual(
            projection["source_ref"], "doc:quant-research.research.cashflow-indices-map"
        )
        self.assertIn("aggregate_rows", projection["allowed_fields"])
        self.assertIn("per_security_signals", projection["excluded_fields"])
        self.assertIn("portfolio_weights", projection["excluded_fields"])

    def test_public_pages_do_not_render_formula_fields(self):
        source = "\n".join(path.read_text() for path in PUBLIC_SOURCE.rglob("*.tsx"))
        self.assertNotRegex(source, re.compile(r"factor\.formula|formulaLatex|<code>\{factor\.formula"))

    def test_public_tree_excludes_private_implementation_and_internal_docs(self):
        tracked = set(subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines())
        allowed_roots = {'.gitignore', 'README.md', 'README.zh-CN.md', 'AGENTS.md'}
        allowed_prefixes = ('.github/', 'docs/', 'scripts/', 'site/', 'tests/')
        self.assertEqual(sorted(path for path in tracked if path not in allowed_roots and not path.startswith(allowed_prefixes)), [])

    def test_public_docs_are_part_of_the_release_contract(self):
        contract = ROOT / "docs" / "alpha810-public-contract.md"
        self.assertTrue(contract.exists())
        text = contract.read_text()
        self.assertIn("schema_version", text)
        self.assertIn("point-in-time", text.lower())
        reference = ROOT / "docs" / "alpha810-public-contract.zh-CN.md"
        self.assertTrue(reference.exists())
        self.assertIn("逐股票", reference.read_text())

    def test_pages_deployment_builds_and_checks_a_deep_link_fallback(self):
        workflow = (ROOT / ".github" / "workflows" / "deploy-pages.yml").read_text()
        self.assertIn("cp site/dist/index.html site/dist/404.html", workflow)
        self.assertIn("cmp site/dist/index.html site/dist/404.html", workflow)
        self.assertIn('for route in hermite jumps fundamentals quality studies studies/pb-roe; do', workflow)
        self.assertIn('mkdir -p "site/dist/$route"', workflow)
        self.assertIn('cp site/dist/index.html "site/dist/$route/index.html"', workflow)
        self.assertIn('cmp site/dist/index.html "site/dist/$route/index.html"', workflow)

    def test_public_release_audit_passes(self):
        from scripts.audit_public_release import audit

        self.assertEqual(audit(), [])


if __name__ == "__main__":
    unittest.main()
