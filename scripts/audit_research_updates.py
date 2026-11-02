#!/usr/bin/env python3
"""Read-only source-content audit. Never updates research conclusions or publishes."""
import argparse
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def digest(value):
    data = value if isinstance(value, bytes) else json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
    return hashlib.sha256(data).hexdigest()

def git(owner, *args):
    return subprocess.check_output(['git', '-C', str(owner), *args], stderr=subprocess.PIPE)

def index_sources(owner, revision):
    output = git(owner, 'grep', '--no-line-number', '-E', '^id: ', revision, '--', 'docs').decode()
    result = {}
    for line in output.splitlines():
        _, path, identity = line.split(':', 2)
        identity = identity.removeprefix('id:').strip().strip('\"\'')
        ref = 'doc:' + identity
        if ref in result:
            raise ValueError('Duplicate source identity: ' + ref)
        result[ref] = path
    return result

def projection(study):
    return {k: v for k, v in study.items() if k != 'source_review_status'}

def card_briefs():
    # Locale catalogs are JSON objects on one line in the authoritative UI catalog.
    text = (ROOT / 'site/src/i18n.ts').read_text()
    catalogs = re.findall(r'^    studyBriefs: (\{.*\}),$', text, re.MULTILINE)
    if len(catalogs) != 2:
        raise ValueError('Expected English and Chinese study brief catalogs')
    return dict(zip(('en-US', 'zh-CN'), (json.loads(c) for c in catalogs)))

def brief_digest(briefs, study_id):
    return digest({locale: entries.get(study_id) for locale, entries in briefs.items()})

def navigation_refs(navigation):
    refs = set()
    def visit(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key in ('source_ref', 'authority_ref'):
                    refs.add(item)
                elif key == 'source_refs':
                    refs.update(item)
                else:
                    visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)
    visit(navigation)
    return sorted(refs)

def capture(catalog, owner, previous=None):
    briefs = card_briefs()
    indexes = {}
    entries = []
    for study in catalog['studies']:
        asset = ROOT / 'site/public' / study['exploration_asset']
        data = json.loads(asset.read_text())
        revision = data['source_revision']
        if revision not in indexes:
            indexes[revision] = index_sources(owner, revision)
        sources = []
        for source in data['sources']:
            ref = source['source_ref']
            path = indexes[revision].get(ref)
            if path is None:
                raise ValueError('Missing pinned source: ' + ref)
            sources.append({'source_ref': ref, 'sha256': digest(git(owner, 'show', revision + ':' + path))})
        navigation = json.loads((ROOT / 'site/public' / study['navigation_asset']).read_text()) if study.get('navigation_asset') else None
        navigation_sources = []
        if navigation:
            nav_revision = navigation['source_revision']
            nav_index = index_sources(owner, nav_revision)
            for ref in navigation_refs(navigation):
                if ref not in nav_index:
                    raise ValueError('Missing pinned navigation source: ' + ref)
                navigation_sources.append({'source_ref': ref, 'sha256': digest(git(owner, 'show', nav_revision + ':' + nav_index[ref]))})
        entries.append({'brief_sha256': brief_digest(briefs, study['id']), 'navigation_sha256': digest(navigation) if navigation else None, 'navigation_sources': navigation_sources, 'study_id': study['id'], 'source_revision': revision, 'catalog_sha256': digest(projection(study)), 'exploration_sha256': digest(data), 'sources': sources})
    return {**(previous or {}), 'schema_version': 'observatory.source_review.v1', 'studies': entries, 'hub_sha256': digest(catalog.get('research_hub'))}

def audit(catalog, baseline, owner=None):
    briefs = card_briefs()
    entries = {s['study_id']: s for s in baseline['studies']}
    checks = []
    try:
        index = index_sources(owner, 'HEAD') if owner else {}
    except (subprocess.CalledProcessError, FileNotFoundError):
        index = {}
    for study in catalog['studies']:
        entry = entries.get(study['id'])
        data = json.loads((ROOT / 'site/public' / study['exploration_asset']).read_text())
        navigation = json.loads((ROOT / 'site/public' / study['navigation_asset']).read_text()) if study.get('navigation_asset') else None
        navigation_changed = entry is not None and entry.get('navigation_sha256') != (digest(navigation) if navigation else None)
        public_changed = navigation_changed or entry is None or entry.get('brief_sha256') != brief_digest(briefs, study['id']) or entry['catalog_sha256'] != digest(projection(study)) or entry['exploration_sha256'] != digest(data)
        sources = []
        if owner and entry:
            for source in entry['sources'] + entry.get('navigation_sources', []):
                path = index.get(source['source_ref'])
                local = Path(owner) / path if path else None
                status = 'unavailable' if not local or not local.is_file() else 'matched' if digest(local.read_bytes()) == source['sha256'] else 'needs_review'
                sources.append({'source_ref': source['source_ref'], 'status': status})
        status = 'needs_review' if public_changed or any(s['status'] == 'needs_review' for s in sources) else 'unavailable' if any(s['status'] == 'unavailable' for s in sources) or not owner else 'matched'
        if owner is None and not public_changed:
            status = 'not_checked'
        checks.append({'study_id': study['id'], 'public_changed': public_changed, 'status': status, 'sources': sources})
    return {'schema_version': 'observatory.source_review_report.v1', 'checked_at': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'hub_changed': baseline.get('hub_sha256') != digest(catalog.get('research_hub')), 'studies': checks}

def external(path):
    resolved = path.resolve()
    if resolved == ROOT or ROOT in resolved.parents:
        raise ValueError('Generated reports must be outside the repository')
    return resolved

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--owner-root', type=Path)
    parser.add_argument('--capture-baseline', action='store_true')
    parser.add_argument('--check', action='store_true', help='Offline public projection integrity gate')
    parser.add_argument('--report-dir', type=Path)
    parser.add_argument('--catalog-status-out', type=Path)
    args = parser.parse_args()
    catalog_path = ROOT / 'site/public/data/research-studies.json'
    baseline_path = ROOT / 'site/public/data/research-source-review.json'
    catalog = json.loads(catalog_path.read_text())
    if args.capture_baseline:
        if not args.owner_root:
            parser.error('--capture-baseline requires --owner-root')
        previous = json.loads(baseline_path.read_text()) if baseline_path.is_file() else {}
        baseline_path.write_text(json.dumps(capture(catalog, args.owner_root, previous), indent=2) + '\n')
        return
    report = audit(catalog, json.loads(baseline_path.read_text()), args.owner_root)
    if args.report_dir:
        folder = external(args.report_dir); folder.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(report, indent=2) + '\n'
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        (folder / ('audit-' + stamp + '.json')).write_text(payload)
        temporary = folder / 'latest.json.tmp'; temporary.write_text(payload); temporary.replace(folder / 'latest.json')
    if args.catalog_status_out:
        path = external(args.catalog_status_out); path.parent.mkdir(parents=True, exist_ok=True)
        statuses = {s['study_id']: s['status'] for s in report['studies']}
        for study in catalog['studies']:
            study['source_review_status'] = {'status': statuses[study['id']], 'checked_at': report['checked_at']}
        path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'checked_at': report['checked_at'], 'statuses': {s['study_id']: s['status'] for s in report['studies']}, 'public_changes': sum(s['public_changed'] for s in report['studies']), 'hub_changed': report['hub_changed']}))
    if args.check and (report['hub_changed'] or any(s['public_changed'] for s in report['studies'])):
        raise SystemExit(1)

if __name__ == '__main__':
    main()
