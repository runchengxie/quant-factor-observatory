import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class EvidenceReviewRecordsTests(unittest.TestCase):
    def test_review_dates_and_revisions_match_cited_public_records(self):
        records = json.loads((ROOT / 'site/src/evidenceReviewRecords.json').read_text())
        catalog = json.loads((ROOT / 'site/public/data/research-studies.json').read_text())
        for study in catalog['studies']:
            record = records[study['id']]
            source = json.loads((ROOT / 'site/public' / record['source_asset']).read_text())
            self.assertEqual(record['reviewed_at'], source['reviewed_at'])
            self.assertEqual(record['source_revision'], source['source_revision'])
        risk = json.loads((ROOT / 'site/public/data/risk-history.json').read_text())
        for key in ['jumps', 'hermite']:
            self.assertEqual(records[key]['reviewed_at'], risk['source']['review_date'])
            self.assertEqual(records[key]['source_revision'], risk['source']['producer_revision'])
        for key in ['fundamentals', 'alpha810']:
            source = json.loads((ROOT / 'site/public' / records[key]['source_asset']).read_text())
            self.assertNotIn('reviewed_at', source)
            self.assertIsNone(records[key]['reviewed_at'])
