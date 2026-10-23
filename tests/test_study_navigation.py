import json
import math
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATA = ROOT / 'site/public/data'

class StudyNavigationTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((DATA / 'research-studies.json').read_text())
        self.assets = [json.loads((ROOT / 'site/public' / s['navigation_asset']).read_text()) for s in self.catalog['studies']]
    def test_all_studies_have_source_bound_trust_and_honest_reproduction(self):
        self.assertEqual(len(self.assets), 7)
        for study, data in zip(self.catalog['studies'], self.assets):
            self.assertEqual(data['study_id'], study['id'])
            self.assertEqual(data['source_ref'], study['source_ref'])
            self.assertEqual(data['schema_version'], 'observatory.study_navigation.v1')
            self.assertRegex(data['source_revision'], '^[a-f0-9]{40}$')
            self.assertEqual(len(data['trust']),6)
            self.assertEqual(len({c['dimension'] for c in data['trust']}),6)
            for claim in data['trust']:
                self.assertEqual(set(claim['detail']),{'en-US','zh-CN'})
                self.assertNotRegex(claim['detail']['en-US'], r'[\u4e00-\u9fff]')
                self.assertTrue(claim['source_refs'])
            self.assertIsNone(data['reproduction']['code_revision'])
            for key in ['source_path','private_reproduction','artifact_root','runner','config','symbol','ticker','weights']:
                self.assertNotIn('"'+key+'"',json.dumps(data))
            self.assertNotIn('/home/',json.dumps(data))
    def test_employee_input_audit_hashes_follow_browser_navigation_contract(self):
        data = next(a for a in self.assets if a['study_id'] == 'employee-compensation')
        self.assertIsInstance(data['reproduction']['artifact_sha256'], dict)
        self.assertEqual(set(data['reproduction']['artifact_sha256']), {
            'input_audit', 'candidates', 'industry_history', 'cashflow',
            'pit_manifests_and_partition_schema_samples',
        })
        self.assertEqual(data['reproduction']['status'], 'artifact_verified')
        self.assertEqual(data['next_tasks'][0]['status'], 'completed')
        self.assertEqual(data['next_tasks'][1]['status'], 'blocked')

    def test_catalog_decision_queue_matches_every_detailed_navigation_task(self):
        assets = {asset['study_id']: asset for asset in self.assets}
        for study in self.catalog['studies']:
            self.assertEqual(study['navigation_summary']['tasks'], assets[study['id']]['next_tasks'])

    def test_unrun_or_protocol_studies_are_not_negative_performance(self):
        for study in self.catalog['studies']:
            if study['id'] in ['fundamental-family-shadow','employee-compensation']:
                self.assertFalse(study['navigation_summary']['negative_result'])
    def test_intervals_preserve_separate_units_and_counted_samples(self):
        rd=next(d for d in self.assets if d['study_id']=='rd-investment')
        absolute=next(d for d in self.assets if d['study_id']=='absolute-level-forecast')
        self.assertEqual(len(rd['diagnostic_intervals']),6)
        self.assertEqual({r['n'] for r in rd['diagnostic_intervals']},{90,80})
        self.assertTrue(all(r['block']==12 for r in rd['diagnostic_intervals']))
        self.assertEqual(len(absolute['diagnostic_intervals']),12)
        self.assertEqual({r['n'] for r in absolute['diagnostic_intervals']},{5596,5741,5923})
        self.assertTrue(all(r['mean_difference']>0 for r in absolute['diagnostic_intervals']))
        for data in [rd,absolute]:
            for row in data['diagnostic_intervals']:
                self.assertTrue(all(math.isfinite(row[k]) for k in ['mean_difference','lower','upper']))
                self.assertLessEqual(row['lower'],row['upper'])
    def test_calibration_and_scale_missingness_keep_original_fold_counts(self):
        absolute=next(d for d in self.assets if d['study_id']=='absolute-level-forecast')
        self.assertEqual(len(absolute['calibration']),180)
        self.assertEqual(len(absolute['scale_slices']),60)
        for year,n in [(2023,5596),(2024,5741),(2025,5923)]:
            for target in ['revenue','net_profit']:
                for model in ['ridge','xgboost']:
                    rows=[r for r in absolute['scale_slices'] if r['year']==year and r['target']==target and r['model']==model]
                    self.assertEqual(sum(r['n'] for r in rows),n)
                    self.assertEqual(next(r['n'] for r in rows if r['current_revenue_quartile']==0),1 if year==2025 else 2)
