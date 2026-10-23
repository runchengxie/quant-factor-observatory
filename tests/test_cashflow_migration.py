import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
class CashflowMigrationTests(unittest.TestCase):
    def test_cashflow_is_absent_from_all_current_public_records(self):
        data = ROOT / 'site/public/data'
        for name in ['research-studies.json', 'research-publication-manifest.json', 'research-source-review.json']:
            self.assertFalse('cashflow-indices' in (data / name).read_text(), name)
        self.assertFalse((data / 'study-exploration/cashflow-indices.json').exists())
        self.assertFalse((data / 'study-navigation/cashflow-indices.json').exists())
