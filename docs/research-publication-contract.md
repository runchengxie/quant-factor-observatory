# Research publication contract

`quant-factor-observatory` is a public projection layer, not the source of
truth for private research. A research note remains authoritative in its owner
repository and may be published here only as a reviewed aggregate projection.
Independent market research projects and their project-specific methods
belong to `quant-market-research`. This site owns factor catalog organization,
standardized factor studies, publication status, and reviewed projections
under this contract. A factor study may be presented here when its source
identity and review requirements are met. Link to authoritative methods and
evidence instead of copying complete source material. Private strategy
evidence remains in `quant-research` unless a separate publication review
approves a redacted projection.

## Input and identity

The source note must have a stable `knowledge/v1` or `knowledge/v2` identity and an
`authority_ref`. The publication manifest records that reference, the source
status, the public identifier, and the reviewed publication status. A public
identifier must not be substituted for the source document identity.

Each public study projection records its `doc:quant-research...` source
identity in both the manifest and study catalog. A series projection may point
to a bilingual provider overview; individual studies point to the authoritative
note for their own evidence. The catalog can attach optional language-neutral
series, market, method, frequency, and evidence-stage values. Missing taxonomy
on older rows must continue to render safely.

## Allowed projection

Public studies may contain human-readable title, family, status, summary,
period, findings, limits, and aggregate result rows. Machine-readable artifact
keys remain English or language-neutral. Public presentation may provide both
`en-US` and `zh-CN` labels over the same aggregate evidence.

The projection must exclude private data paths, credentials, private code,
per-security signals, portfolio weights, execution details, and exact private
factor operators. Hypotheses, preliminary diagnostics, reviewed aggregates,
and historical archives must remain distinct. In particular, Hong Kong
historical findings must not imply A-share transferability. Missing evidence
must be represented as a hypothesis or unpublished state, never filled with
invented metrics.

## Review boundary

`site/public/data/research-publication-manifest.json` is the auditable bridge
between source notes and the static site. Its release test rejects local paths,
credentials, per-security fields, and private implementation references. A
future publisher should generate this manifest and the public study snapshot in
one reviewed operation.

## Study exploration projection

A study may declare an optional `exploration_asset` under `data/study-exploration/` and small `exploration_counts` for catalog navigation. Detail routes load only their own asset. The list route must not fetch every study's additional evidence. Older studies without these fields keep rendering.

`observatory.study_exploration.v1` records the study identity, authority reference, owner source revision, projection review date, evidence stage, bilingual sources, selected exploration steps, aggregate charts and next research question. Each step records its question, intermediate finding and resulting decision. It is a curated evidence path, not a claim about independent experiment count or a complete chronology. Earlier positive, invalid, superseded or negative results retain their interpretation and must not be merged into later corrected metrics.

Every chart declares its metric, unit, sample/protocol context, interpretation and source IDs. All series share the chart's category order; missing values are null, never zero. Different targets, forecast correlations, stock-return correlations, annualized returns and cumulative active returns must remain labeled and separate. Exact values remain available in a table. A hypothesis or protocol without reviewed results publishes no performance chart. Source notes may be private; expose stable identities and sanitized provenance, not inaccessible raw file links or private implementation.

Optional evidence loading or schema failure must preserve the main study and provide a localized retry. Native SVG comparisons remain keyboard-readable through their controls and corresponding tables. New projections must update the publication manifest and pass bilingual, source, metric and public-release validation.

## Research hub extension

Optional `evidence_summary`, `related_studies`, `source_review_status`, and exploration `conclusion_changes` follow the same reviewed aggregate boundary. The catalog's `research_hub` registers permitted comparison groups and source-backed interpretation changes. Source-content hashes are public metadata; private paths and raw observations remain excluded. See [Research evidence hub](research-hub.md) for baseline review and scheduled audit operation.

Optional study navigation assets and compact `navigation_summary` metadata follow the same aggregate privacy boundary. Trust dimensions, reproduction receipts, decision tasks and retrospective uncertainty/calibration must pass source identity, unit, cohort, null-value and bilingual checks. See [Study evidence navigation](research-evidence-navigation.md).

## Fundamental forecast reader guide

The optional `guide` in `observatory.study_exploration.v1` is a reviewed
`observatory.forecast_guide.v1` aggregate for fundamental-state forecasting.
It contains bilingual explanations, matched financial forecast summaries,
source-report-year stability, descriptive calendar-block intervals, separate
change-target metrics and archived period-end wealth/drawdown paths. Its
source IDs must resolve within the exploration sources and its containing
asset participates in the source-review content hash.

Historical rounded baseline differences and full-precision recomputed gains
are labeled separately. Financial ranking, numeric change errors and stock
returns retain distinct units. Archived return paths are explicitly retained
output diagnostics with incomplete input/execution qualification and no
matched current-state return control. Corrected boundary drawdown includes
initial capital; it is not daily drawdown. Raw financial extremes, numerical
warnings, decline prevalence and the identical 4Q seasonal/no-change controls
remain visible.

Guide validation requires complete, unique target/horizon/model groups,
unique portfolio widths, ordered bounded report years and dated return paths.
Malformed optional data preserves the main study and offers a localized
retry. Public guides exclude all security-level cases, raw observations,
private parameters, portfolio weights and reproduction locators.

The reader first sees plain-language questions and selected retained comparisons.
All original forecast, change, return and research-history content remains available
through keyboard-accessible native disclosures. Restricted fiscal-quarter coverage
from the old month-end matching defect is visible beside the retained lead.
Counts are bounded by calendar coverage and reconcile with annual counts; unknown
win fractions remain unavailable rather than becoming zero wins.

The optional `observatory.forecast_robustness.v1` aggregate adds eighteen unique
registered target/horizon/treatment groups. It retains raw and commonly bounded
numeric errors, matched-row material-decline confusion counts with precision,
recall and prevalence, and the separate unitless cash-flow ranking confirmation.
The quarterly net-profit target is distinct from the accumulated asset-remuneration
target. Fixed decline thresholds are diagnostic and do not certify business distress.
Input qualification publishes aggregate gaps and an explicit unqualified return
status. No security records, vendor fields, private parameters, paths or signals
are included. New and old runs have different snapshots, features and coverage;
their difference must not be attributed solely to the calendar repair.
