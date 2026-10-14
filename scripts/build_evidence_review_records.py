#!/usr/bin/env python3
"""Project only recorded review dates into the site; snapshot dates stay separate."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'site/public'

def build():
    records = {}
    catalog = json.loads((PUBLIC / 'data/research-studies.json').read_text())
    for study in catalog['studies']:
        source = json.loads((PUBLIC / study['navigation_asset']).read_text())
        records[study['id']] = {
            'reviewed_at': source['reviewed_at'],
            'source_asset': study['navigation_asset'],
            'source_revision': source['source_revision'],
        }
    source = json.loads((PUBLIC / 'data/risk-history.json').read_text())['source']
    for key in ['jumps', 'hermite']:
        records[key] = {'reviewed_at': source['review_date'], 'source_asset': 'data/risk-history.json', 'source_revision': source['producer_revision']}
    for key, asset in [('fundamentals', 'data/fundamental-snapshot.json'), ('alpha810', 'data/alpha810-snapshot.json')]:
        records[key] = {'reviewed_at': None, 'source_asset': asset, 'source_revision': None}
    return records

if __name__ == '__main__':
    (ROOT / 'site/src/evidenceReviewRecords.json').write_text(json.dumps(build(), indent=2) + '\n')
