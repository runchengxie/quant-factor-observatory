"""Reviewed comparison registry and source audit regression gates."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).parents[1]
spec = importlib.util.spec_from_file_location('review', ROOT / 'scripts/audit_research_updates.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)

class ResearchHubTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / 'site/public/data/research-studies.json').read_text())
        self.baseline = json.loads((ROOT / 'site/public/data/research-source-review.json').read_text())
    def test_registry_references_same_chart_and_valid_baseline(self):
        self.assertEqual(len(self.catalog['research_hub']['comparison_groups']), 11)
        studies = {s['id']: s for s in self.catalog['studies']}
        for group in self.catalog['research_hub']['comparison_groups']:
            data = json.loads((ROOT / 'site/public' / studies[group['study_id']]['exploration_asset']).read_text())
            chart = next(c for c in data['charts'] if c['id'] == group['chart_id'])
            series = [s for s in chart['series'] if not group['series_ids'] or s['id'] in group['series_ids']]
            self.assertTrue(series)
            if group['mode'] == 'models':
                self.assertIn(group['baseline_id'], [s['id'] for s in series])
            else:
                self.assertLess(int(group['baseline_id']), len(chart['categories']))
            self.assertTrue(group['scope']['en-US'])
        rd = [g for g in self.catalog['research_hub']['comparison_groups'] if g['study_id'] == 'rd-investment']
        self.assertEqual([g['series_ids'] for g in rd], [['20'], ['220']])
    def test_relations_are_symmetric_and_changes_source_backed(self):
        studies = {s['id']: s for s in self.catalog['studies']}
        for study in studies.values():
            for relation in study['related_studies']:
                self.assertIn(study['id'], [r['study_id'] for r in studies[relation['study_id']]['related_studies']])
            data = json.loads((ROOT / 'site/public' / study['exploration_asset']).read_text())
            sources = {s['id'] for s in data['sources']}
            for change in data['conclusion_changes']:
                self.assertTrue(set(change['source_ids']) <= sources)
                for field in ('before', 'trigger', 'after'):
                    self.assertEqual(set(change[field]), {'en-US', 'zh-CN'})
        self.assertEqual(len(self.catalog['research_hub']['change_entries']), 10)
    def test_offline_baseline_and_status_metadata_are_independent(self):
        report = review.audit(self.catalog, self.baseline)
        self.assertFalse(report['hub_changed'])
        self.assertFalse(any(s['public_changed'] for s in report['studies']))
        self.catalog['studies'][0]['source_review_status']['status'] = 'needs_review'
        self.assertFalse(review.audit(self.catalog, self.baseline)['studies'][0]['public_changed'])
        self.catalog['studies'][0]['summary'] += ' changed'
        self.assertTrue(review.audit(self.catalog, self.baseline)['studies'][0]['public_changed'])
    def test_source_change_missing_and_unrelated_revision(self):
        with tempfile.TemporaryDirectory() as folder:
            owner = Path(folder); (owner / 'source.md').write_bytes(b'original')
            first = self.baseline['studies'][0]; first['navigation_sources'] = []; first['sources'] = [{'source_ref': 'doc:one', 'sha256': review.digest(b'original')}]
            with patch.object(review, 'index_sources', return_value={'doc:one': 'source.md'}):
                self.assertEqual(review.audit(self.catalog, self.baseline, owner)['studies'][0]['status'], 'matched')
                (owner / 'source.md').write_bytes(b'changed')
                self.assertEqual(review.audit(self.catalog, self.baseline, owner)['studies'][0]['status'], 'needs_review')
                (owner / 'source.md').unlink()
                self.assertEqual(review.audit(self.catalog, self.baseline, owner)['studies'][0]['status'], 'unavailable')
    def test_navigation_change_and_removal_are_detected(self):
        original = review.digest
        with patch.object(review, 'digest', side_effect=lambda value: 'changed' if isinstance(value, dict) and value.get('schema_version') == 'observatory.study_navigation.v1' else original(value)):
            self.assertTrue(review.audit(self.catalog, self.baseline)['studies'][0]['public_changed'])
        del self.catalog['studies'][0]['navigation_asset']
        self.assertTrue(review.audit(self.catalog, self.baseline)['studies'][0]['public_changed'])

    def test_card_conclusion_changes_are_detected(self):
        with patch.object(review, 'card_briefs', return_value={'en-US': {'pb-roe': 'Changed'}, 'zh-CN': {}}):
            self.assertTrue(review.audit(self.catalog, self.baseline)['studies'][0]['public_changed'])

    def test_navigation_refs_include_nested_evidence_dependencies(self):
        refs = review.navigation_refs({'authority_ref': 'doc:authority', 'source_ref': 'doc:overview', 'trust': [{'source_refs': ['doc:input']}], 'reproduction': {'source_refs': ['doc:code', 'doc:overview']}})
        self.assertEqual(refs, ['doc:authority', 'doc:code', 'doc:input', 'doc:overview'])

    def test_nested_navigation_source_change_is_detected(self):
        with tempfile.TemporaryDirectory() as folder:
            owner = Path(folder)
            (owner / 'input.md').write_bytes(b'changed')
            first = self.baseline['studies'][0]
            first['sources'] = []
            first['navigation_sources'] = [{'source_ref': 'doc:input', 'sha256': review.digest(b'original')}]
            with patch.object(review, 'index_sources', return_value={'doc:input': 'input.md'}):
                result = review.audit(self.catalog, self.baseline, owner)['studies'][0]
                self.assertFalse(result['public_changed'])
                self.assertEqual(result['status'], 'needs_review')

    def test_generated_output_cannot_be_written_in_repository(self):
        with self.assertRaises(ValueError): review.external(ROOT / 'reports')
