# Historical jump and distribution-state evidence

## Intended outcome

Implement the five improvements accepted by the user: reviewed real historical
aggregates, historical jump comparisons, Hermite stability and overlap checks,
a shared data-quality/source view, and navigation connecting factors,
explorers and research records. Readers should be able to distinguish sample
illustrations from historical evidence, reproduce their chosen view, and see
what a statistic does and does not establish.

The source investigation found usable archived minute-risk factor panels.
The previously displayed Hermite meta-feature output was not found in the
inspected factor output directory. The old snapshot builder hard-coded demo
cross-sectional quantiles independently of its demo series. Real source
continuous-variance estimates can exceed realized variance, so the demo's
first decomposition identity is not a universal raw-data validation rule.

This work spans the private research producer and public presentation
contract. It requires an aggregate publication asset, rather than replacing
the illustrative snapshot with a complete panel of security-level signals.

## Chosen approach and alternatives

Use the retained factor panels to produce a versioned, reviewed aggregate
research receipt in `quant-research`, then publish its allowlisted projection
in `quant-factor-observatory`. Preserve the demo as an explicitly separate
teaching mode. The existing risk-factor implementation stays authoritative;
the retired `factor-research-engine` repository is not revived.

A UI-only extension would leave the principal evidence gaps unresolved. A
fresh all-market minute recomputation would also require a larger ingestion
and source-availability audit; it is unnecessary for describing the retained
panel and is outside this implementation. No market-data production assets,
current aliases, scheduled services or framework configuration are changed.

## Source qualification and private producer

1. Freeze source content hashes, owner code revision, date and security-key
   schemas, units, date range, and input coverage in a task-specific receipt.
   Verify keys before joining. Keep the input directory and reproduction
   locators private. Retain evidence that the source is an archived panel;
   do not claim current-market freshness or historical PIT qualification.
2. Profile duplicates, missing and nonfinite values, negative risk values,
   cross-panel alignment, RV denominators, and both decomposition relations.
   Report the raw continuous estimate exceeding RV as a separate diagnostic,
   rather than silently repairing values or classifying every excess as
   corrupted data.
3. Establish a source note with stable `knowledge/v2` identity and authority
   reference. Record the exact private calculation and source limitations
   there. Public prose is an aggregate projection of that receipt.
4. Write generated research results under the configured data root in an
   explicit task directory. Do not overwrite existing panel outputs or
   shared `current`/`latest` references.

## Jump history

Publish monthly and annual aggregate rows over complete, aligned,
nonnegative observations with positive RV. Each row contains its period,
observed dates, sampled securities, eligible stock-days, excluded stock-days,
pooled jump variance share, pooled large/small jump contributions, median
per-observation jump share, and positive residual prevalence.

Pooled shares use the corresponding sums as numerator and denominator;
per-observation medians are labeled separately. Large and small components
are additive and RJV is a subtotal, not another stack component. For an
additive display, the continuous remainder is explicitly RV minus RJV; it is
not labeled as the original IVhat estimate. Retain the original-estimate
reconciliation diagnostics on the quality view and explain this distinction
next to the chart.

Positive residual prevalence describes the share of eligible stock-days
with a positive retained jump residual. It is not a calibrated jump-test
rejection rate, jump direction, or a count of intraday events. A formal event
frequency remains unpublished until an event definition and source method
support it.

Provide period selection, annual/monthly granularity, share/component views,
exact aggregate values in tables, and observed sample counts. Do not
infer market-regime or liquidity groups from filenames or convenience
thresholds; these views remain explicitly unavailable unless qualified
historical grouping inputs are present and documented.

## Hermite history and diagnostics

Derive distribution-state diagnostics from the retained realized-variance
history using the owner's existing Hermite implementation. Publish distinct
metric identities (`rv_shape_h3`, `rv_shape_h4`, `rv_shape_closeness`) with
bilingual descriptions of their underlying RV state. They must not be
presented as the absent daily-close shape series or directly as the skewness
or kurtosis of daily stock returns.

The initial evidence includes:

- Monthly/annual cross-sectional distribution summaries and valid/missing
  sample counts for each new metric.
- A paired shorter/longer-window sensitivity comparison with overlap counts
  and rank agreement. Exact private recipe parameters remain in the owner
  receipt; publicly label the comparison and its limits without exposing
  implementation recipes.
- A tail-sensitivity check comparing the retained-input calculation against
  an explicitly trailing, within-security tail-limited sensitivity variant.
  Align dates and eligible keys before comparing and report common coverage.
- Daily cross-sectional rank correlations with retained RV, realized
  skewness and realized kurtosis; aggregate by period with date counts and
  disclose weighting. Correlation measures overlap and cannot establish
  incremental return prediction, causality, or independent predictive value.

Short histories and unmatched samples remain missing. Do not fill missing
results with zero or reuse an estimate from another metric. Do not publish
significance or confidence claims without an appropriate temporal inference
method. Return prediction, portfolios and execution validation remain outside
these descriptive checks and are marked unvalidated.

## Public asset and publication review

Introduce `observatory.risk_history.v1` as an optional reviewed asset under
`site/public/data/`. It contains only source identities/content hashes, owner
revision, review date, evidence stage, dataset coverage, definitions, quality
counts, period aggregates, sensitivity summaries, and bilingual limitations.

The exporter uses an explicit allowlist. No security identifiers, complete
per-security signals, raw input rows, local paths, provider credentials,
portfolio positions, exact private operators, or private reproduction
locators appear in the projection. Register its source identity and content
hash in the existing publication manifest/source-review mechanism. Schema
validation enforces periods, units, metric identities, bounded rates,
nonnegative counts, count consistency and source references.

The public consumer loads the optional historical asset on the two relevant
explorer routes and the quality view. Missing or invalid assets leave the
existing demo readable, explain that historical evidence could not be loaded,
and offer a localized retry. Never silently substitute demo statistics in a
historical view.

## Quality page and demo correction

Add a shared quality/source route for these market-state datasets, with links
from both explorers and related factor records. Clearly separate the demo
snapshot from historical aggregates. Show coverage, version/hash, observed
end date, publication review date, missingness, key checks, and decomposition
semantics. A current audit time does not make old input observations current.

Recompute the demo's five cross-sectional quantiles from its same-date
published example values using a documented linear-interpolation convention.
Add a reproducible consistency check so subsequent demo edits cannot leave
independent quantile constants behind. Preserve the original synthetic series
and mark the quantile correction in source notes. Three example stocks do not
constitute market distribution evidence.

## Navigation and shareable state

- Factor records link to the appropriate jump/Hermite view and their research
  record, including the compatible metric selection.
- Explorer views link back to corresponding definitions, source/quality
  details, and their reviewed descriptive research record.
- Register the descriptive study in the existing study catalog and use the
  established source/evidence navigation components. Keep hypotheses,
  unavailable checks and observed negative results distinct.
- Store supported mode, metric, period/granularity and demo selection/date
  controls in URL parameters. Validate every parameter against the dataset;
  ignore unknown values safely and do not place private identifiers in URLs.
- A copy-view-link control copies the current canonical URL and reports its
  success or failure in the selected language. Reloading or sharing the URL
  restores the same supported state.

## Validation and release

Test the private producer with independently hand-checked fixtures covering
misaligned keys, duplicate keys, missing values, zero denominators,
continuous estimates above RV, period aggregation, warm-up gaps, and paired
sensitivity/correlation cohorts. Run owner-required affected regression and
static checks with locked dependencies. Retain commands and results in the
private receipt.

Public validation covers asset allowlisting/identity, demo quantile
consistency, optional-load failure/retry, URL restoration and invalid
parameters, comparison denominators, both locales, mobile containment and
dark-mode contrast. Run the complete public Python suite, release and source
review audits, production build, and browser regressions sequentially against
the current target branch. Review representative charts and exact tables.

Merge the research producer before the public consumer through separate PRs.
Do not leave published evidence depending on an unmerged producer branch.
Verify GitHub required checks, Pages deployment and both live routes. Clean
only task-owned branches/worktrees and fast-forward clean primary checkouts.

## Acceptance boundary

Completion means all five accepted improvements have concrete UI or reviewed
research deliverables. Data unavailable after qualified discovery remains a
visible gap with a specific resumption condition; an empty evidence section
is not reported as a completed statistical test. Historical results remain
scoped to the retained panel, with PIT and predictive qualification unresolved
unless separate evidence establishes them.
