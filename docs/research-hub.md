# Research evidence hub

The studies index provides an evidence matrix, market, evidence-stage and text filters, and a curated conclusion-change registry. Detail pages retain current findings and limits first, then show historical interpretation changes and explicit related-study links. Earlier positive results and invalid baselines remain historical statements; they are not current validation claims.

## Comparable experiments

`studies/compare` reads the registered groups in `research-studies.json`. A group selects one reviewed chart, a baseline, direction, and optionally a series subset. Model comparisons select one sample slice or horizon at a time. Variant comparisons select one metric. R&D 20-session and 220-session groups remain separate because their monthly cohorts differ. Revenue and income transformed errors remain separate because their units differ. Differences are arithmetic differences in the displayed metric, not significance tests or return attribution. Missing values remain missing.

Related studies use explicit symmetric edges with a bilingual rationale. Shared questions or methods do not imply transferable performance. Hypothesis and protocol studies have no performance chart.

## Source review

`research-source-review.json` pins public aggregate and catalog digests plus source-document content hashes to each exploration asset's published owner revision. It contains public document identities and hashes, not private document paths. Review metadata is excluded from catalog digests to prevent a self-referential audit. The complete hub registry is hashed separately.

Run the public integrity gate without the private owner repository:

```sh
python scripts/audit_research_updates.py --check
```

Run a source-content audit using explicit external paths:

```sh
python scripts/audit_research_updates.py --owner-root "$RESEARCH_OWNER_ROOT" --report-dir "$RESEARCH_REVIEW_ROOT"
```

The audit compares current source bytes, including unsaved edits, with pinned content. An unrelated owner commit does not require review. Content changes report `needs_review`; missing sources report `unavailable`. The index resolves stable front matter identities, so moving an unchanged document is harmless. Duplicate identities fail the audit.

Reports are retained outside Git with timestamped filenames and an atomic `latest.json`. `--catalog-status-out` creates an external review candidate containing status metadata only. Operators review and publish this candidate through the normal PR workflow. The audit never edits findings, upgrades evidence stage, opens frozen results, or publishes automatically. The public status is a dated snapshot, not a live freshness guarantee.

After manually reviewing changed evidence and the projected conclusions, update the exploration source revision as appropriate, then explicitly capture a new baseline:

```sh
python scripts/audit_research_updates.py --capture-baseline --owner-root "$RESEARCH_OWNER_ROOT"
```

Do not recapture a baseline merely to silence a changed-source warning. A document-wide change flag is deliberately conservative; it does not establish that the study's interpretation changed.

## Content review, 2026-10-14

Seven previously changed topics were reviewed against merged owner revision `e1984591be37073d9e1b3b1dee8a7e7813652cb3`. The forecasting follow-up already used that revision. Exploration and navigation pins now identify the reviewed source content; the original experiment dates, numerical chart arrays, evidence stages and decisions remain unchanged. This review compared documents and public projections, not original data or executable portfolios.

| Topic | Source changes reviewed | Public conclusion and remaining boundary |
| --- | --- | --- |
| `pb-roe` | Shared navigation adds R&D closure and priority follow-ups. The PB source is unchanged. | Retain the PB baseline. External versioned inputs and a same-pool replay are still missing. |
| `rd-investment` | Navigation distinguishes separate replay denominators and corrects 18 filing checks to six report years. Existing detail steps already retain these aggregates. | Keep exploratory evidence, unresolved prices, terminal handling and dated eligibility explicit. The registered portfolio matrix is incomplete and the prospective holdout stays sealed. |
| `fundamental-family-shadow` | Shared navigation changes concern other families. The family protocol is unchanged. | Protocol only. No reviewed family-level performance result is added. |
| `cashflow-indices` | The source map and shared navigation add official membership coverage and methodology boundaries. | Nine 100-name intervals start on 2024-09-18; one weight snapshot is dated 2026-09-30. The current method starts on 2024-08-15, leaving the first membership window and historical weights unresolved. Snapshot and shadow results remain separate. |
| `hk-fundamental-archive` | Shared navigation adds A-share follow-ups. The cited HK archive records are unchanged. | Keep full-test and walk-forward failures alongside favorable recent slices. Restored records are not a new training run or replay. |
| `employee-compensation` | The series overview adds R&D closure. Human-capital definitions and its source-review section are unchanged. | A payable balance remains a liability, not a labor-cost flow. This is a definition hypothesis with no published predictive result. |
| `absolute-level-forecast` | The source overview adds links to historical PIT, completion, coverage, replay and publication-contract audits. | The 32,339-row, three-fold retrospective pilot and persistence comparison remain unchanged. Links do not certify original versions, executable returns or new predictive evidence. |

The refreshed source hashes record this content review. They do not close the research gaps above or certify an independent rerun. Later source changes must still trigger review.

## Daily local operation

The service and timer templates in `scripts/systemd/` perform a read-only daily audit. Install them as user units and adapt the EnvironmentFile location to the existing personal configuration grouping. Set `OBSERVATORY_ROOT` to the stable production `current` release, `RESEARCH_OWNER_ROOT` to the authoritative owner checkout, and `RESEARCH_REVIEW_ROOT` to external retained reports. Personal paths belong in the configured environment file under the user's project configuration grouping, never in versioned templates. The schedule explicitly uses Asia/Shanghai. No network, credentials, or automatic publication is required.

The installed audit follows merged production releases. A failed audit is visible through the user service status and journal; it must not be represented as a successful source check.
