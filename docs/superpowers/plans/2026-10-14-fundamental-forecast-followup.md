# Fundamental forecast follow-up implementation plan

## Accepted scope

The owner accepted the October 14 recommendations to advance research and explain it in plain language. Implement in the private research owner first, then publish only reviewed aggregate evidence in the Observatory. Existing negative decisions remain until qualified evidence changes them. Chinese reader-facing prose follows human-writing; English remains the authoritative research language.

## Tasks

- [ ] Recover corrected saved predictions, target panels and run audits. Independently recompute matched formation-level rank correlations, calendar-aware block intervals and annual stability. Reject duplicates, invalid chronology, leaked persistence and unequal comparisons.
- [ ] Register and run a separate historical change-target pilot with the existing chronological forecast API. Compare numeric level and change forecasts on common rows, no-change and seasonal controls; evaluate forecast errors and deterioration rather than treating constant-zero rank correlation as zero.
- [ ] Audit retained portfolio artifacts before any return publication. Document concrete protocol defects and qualify the return bridge; preserve unavailable outputs and reproduction gaps. Select private case studies by a declared reproducible rule, without publishing security identities.
- [ ] Write an English evidence receipt and aligned Chinese reader explanation with exact source hashes, configuration, dates, coverage and limitations. Link the receipt from the owner overview.
- [ ] Add a localized study guide, research-chain diagram, baseline-delta heatmap, horizon lines, annual stability and uncertainty views in the Observatory. Keep return and case views honest about available evidence. Correct stale date and absolute-level-study wording, preserve original charts and failed-run history.
- [ ] Test the research computations against adversarial inputs before implementation. Run affected Python tests and static/documentation checks. Validate public contracts, source-review hashes, production build and browser tests in both locales and mobile layouts.
- [ ] Review the final branches, merge provider before consumer through PRs after required checks, verify deployment and clean only task resources.

## Interfaces and files

Private runner scripts/research/experiments/long_term_fundamental_v2/forecast_followup.py owns retained-evidence validation and a CLI; tests/strategy_research/test_forecast_followup.py tests matching, missingness, chronology, changes and intervals. A separately registered config controls the change pilot. Generated evidence stays in DATA_ROOT in an explicit October 14 task directory.

Public study guide loads a versioned bilingual aggregate asset scoped to this route. It records source identity, revision, review date, numeric summaries and missing evidence; no raw records, security signals, private paths, weights or private parameters are published. Charts expose corresponding tables and preserve unknown values. Existing study-exploration remains backward-compatible.

## Review focus

Comparisons must keep identical observations per target/horizon, constant rank predictions must remain undefined, calendar gaps must survive interval estimation, selected historical highlights must not become promotion claims, and public projections must exclude private reproducibility locators. Test localized labels and horizontal overflow at mobile width. Date coverage and experimental run dates must stay distinct.
