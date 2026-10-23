"""Source and metric contracts for optional study exploration projections."""
import json
import math
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATA = ROOT / 'site/public/data'


class StudyExplorationTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((DATA / 'research-studies.json').read_text())
        self.studies = {s['id']: s for s in self.catalog['studies']}
        self.manifest = json.loads((DATA / 'research-publication-manifest.json').read_text())

    def asset(self, study_id):
        return json.loads((ROOT / 'site/public' / self.studies[study_id]['exploration_asset']).read_text())

    def test_all_current_studies_have_localized_source_backed_exploration(self):
        projections = {p['public_id']: p for p in self.manifest['projections']}
        for study_id, study in self.studies.items():
            data = self.asset(study_id)
            self.assertEqual(data['schema_version'], 'observatory.study_exploration.v1')
            self.assertEqual(data['study_id'], study_id)
            self.assertEqual(data['source_ref'], study['source_ref'])
            self.assertEqual(data['evidence_stage'], study['evidence_stage'])
            self.assertRegex(data['source_revision'], r'^[0-9a-f]{40}$')
            self.assertEqual(projections[study_id]['exploration_asset'], study['exploration_asset'])
            self.assertEqual(study['exploration_counts'], {'steps': len(data['steps']), 'charts': len(data['charts'])})
            self.assertGreaterEqual(len(data['steps']), 3)
            sources = {s['id'] for s in data['sources']}
            self.assertEqual(len(sources), len(data['sources']))
            for source in data['sources']:
                self.assertRegex(source['source_ref'], r'^doc:quant-research\.')
            for step in data['steps']:
                self.assertTrue(set(step['source_ids']) <= sources)
                for field in ('title', 'period', 'question', 'finding', 'decision'):
                    self.assertEqual(set(step[field]), {'en-US', 'zh-CN'})
                    self.assertTrue(all(step[field].values()))
                    self.assertNotRegex(step[field]['en-US'], r'[\u4e00-\u9fff]')
            for chart in data['charts']:
                self.assertTrue(set(chart['source_ids']) <= sources)
                self.assertIn(chart['unit'], {'number', 'percent'})
                for field in ('title', 'metric', 'context', 'interpretation'):
                    self.assertEqual(set(chart[field]), {'en-US', 'zh-CN'})
                    self.assertNotRegex(chart[field]['en-US'], r'[\u4e00-\u9fff]')
                for series in chart['series']:
                    self.assertEqual(len(series['values']), len(chart['categories']))
                    self.assertTrue(all(v is None or math.isfinite(v) for v in series['values']))
            text = json.dumps(data)
            self.assertNotRegex(text, re.compile(r'/home/|/Users/|(?:access|api|secret)[_-]?key', re.I))
            for private_key in ('ticker', 'symbol', 'portfolio_weights', 'source_path', 'raw_path'):
                self.assertNotIn(f'"{private_key}"', text)

    def test_forecast_followup_preserves_old_evidence_and_reconciles_decline_counts(self):
        guide = self.asset('fundamental-state-forecasting')['guide']
        self.assertEqual((len(guide['groups']), len(guide['change_groups']), len(guide['returns'])), (12, 4, 5))
        robustness = guide['robustness']
        self.assertEqual(len(robustness['groups']), 18)
        self.assertFalse(robustness['qualification']['return_qualified'])
        by_cohort = {}
        for group in robustness['groups']:
            key = (group['target'], group['horizon'])
            totals = by_cohort.setdefault(key, {})
            self.assertEqual(len(group['models']), 6)
            for model in group['models']:
                for counts in model['thresholds']:
                    self.assertEqual(sum(counts[k] for k in ('true_positive', 'false_positive', 'false_negative', 'true_negative')), group['rows'])
                    actual = counts['true_positive'] + counts['false_negative']
                    self.assertEqual(totals.setdefault(counts['threshold'], actual), actual)
                    self.assertAlmostEqual(counts['prevalence'], actual / group['rows'])
            if group['target'] == 'quarterly_cash_flow' and group['horizon'] == 1:
                cash = group['cash_ranking']
                self.assertEqual([p['period'] for p in cash['fiscal_quarter']], [1, 2, 3, 4])
                self.assertEqual(sum(p['formations'] for p in cash['fiscal_quarter']), cash['paired_formations'])
                self.assertEqual(sum(p['wins'] for p in cash['fiscal_quarter']), cash['wins'])
        self.assertIn('omitted Q3', guide['paragraphs'][-1]['en-US'])
        self.assertTrue({'forecast-robustness', 'return-input-qualification'} <= set(guide['source_ids']))

    def test_protocol_and_hypothesis_publish_no_performance_chart(self):
        self.assertEqual(self.asset('fundamental-family-shadow')['charts'], [])
        employee = self.asset('employee-compensation')
        self.assertEqual(employee['evidence_stage'], 'hypothesis')
        self.assertEqual({c['id'] for c in employee['charts']}, {'disclosure-population', 'annual-candidates', 'cash-intensity', 'annual-cohort-medians'})
        for chart in employee['charts']:
            self.assertIn('not', chart['context']['en-US'])
            if chart['id'] == 'annual-cohort-medians':
                self.assertIn('followup', chart['source_ids'])
                self.assertEqual(len(chart['series']), 4)
                self.assertIn('not a wage or return conclusion', chart['context']['en-US'])
                cohort = next(s for s in chart['series'] if s['id'] == 'fixed-cohort')
                self.assertAlmostEqual(cohort['values'][0], .12544018560595135)
                self.assertAlmostEqual(cohort['values'][-1], .15328388730575634)
            else:
                self.assertIn('input-audit', chart['source_ids'])
        counts = next(c for c in employee['charts'] if c['id'] == 'annual-candidates')
        self.assertEqual(sum(counts['series'][0]['values']), 59167)
        self.assertEqual(sum(counts['series'][1]['values']), 52203)
        self.assertEqual(counts['series'][1]['values'][0], 0)
        self.assertIn('No returns', employee['summary']['en-US'])

    def test_pb_and_rd_charts_match_existing_reviewed_tables(self):
        pb = self.studies['pb-roe']['translations']['en-US']['rows']
        charts = self.asset('pb-roe')['charts']
        self.assertEqual(charts[0]['series'][0]['values'], [float(r[2].strip('%')) / 100 for r in pb])
        rd = self.studies['rd-investment']['translations']['en-US']['rows']
        chart = self.asset('rd-investment')['charts'][0]
        for index, column in enumerate((1, 2)):
            self.assertEqual(chart['series'][index]['values'], [float(r[column].strip('%')) / 100 for r in rd])

    def test_absolute_error_and_selection_are_different_units(self):
        charts = self.asset('absolute-level-forecast')['charts']
        self.assertEqual([c['unit'] for c in charts], ['number', 'number', 'percent'])
        self.assertEqual(charts[0]['series'][0]['values'], [.097, .091, .087])
        self.assertEqual(charts[2]['series'][1]['values'], [.164, .418, -.074])
        self.assertIn('no transaction costs', charts[2]['context']['en-US'])

    def test_hk_keeps_monthly_and_quarterly_evidence_separate(self):
        data = self.asset('hk-fundamental-archive')
        self.assertIn('six walk-forward', data['steps'][0]['finding']['en-US'])
        self.assertIn('not quarterly', data['charts'][0]['context']['en-US'])
        self.assertEqual(data['charts'][0]['series'][0]['values'][-1], .252)
        self.assertEqual(data['charts'][1]['series'][0]['values'][-1], -.08)

    def test_invalid_early_baseline_is_explicitly_excluded(self):
        data = self.asset('fundamental-state-forecasting')
        self.assertIn('invalid initial run', data['steps'][1]['finding']['en-US'])
        self.assertEqual(data['charts'][0]['series'][0]['values'], [.840, .767, .715])
        self.assertTrue(all('corrected' in c['context']['en-US'].lower() for c in data['charts']))

    def test_rd_followup_quality_charts_are_separate_from_corrected_performance(self):
        data = self.asset('rd-investment')
        charts = {c['id']: c for c in data['charts']}
        self.assertTrue({'endpoint-failures', 'input-coverage', 'matched-components'} <= charts.keys())
        self.assertIn('reconstructed historical extension', charts['matched-components']['context']['en-US'])
        self.assertIn('already filtered panel', charts['input-coverage']['context']['en-US'])
        self.assertEqual(charts['endpoint-failures']['unit'], 'percent')
        self.assertIn('not actual fills', charts['endpoint-failures']['context']['en-US'])
        self.assertTrue(any('10,825' in step['finding']['en-US'] for step in data['steps']))
        self.assertTrue(any('holdout remains sealed' in step['decision']['en-US'] for step in data['steps']))
