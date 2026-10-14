# Historical Jump and Distribution-State Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish reviewed historical jump and RV-shape aggregates with transparent quality, sensitivity and correlation diagnostics, and make them explorable and shareable in the factor observatory.

**Architecture:** Produce and review the aggregates in the private `quant-research` repository first, using only retained aligned factor panels and the existing Hermite implementation. Export a strict aggregate allowlist as `observatory.risk_history.v1`, then consume it as optional historical evidence in the public observatory while preserving the demo mode. Merge the private producer before the public consumer.

**Tech Stack:** Python, pandas, NumPy, PyArrow, pytest, JSON Schema-style validation in the existing Python audit scripts, React, TypeScript, Vite, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-historical-risk-evidence-design.md`

## Global Constraints

- Keep source panels, raw rows, security-level results and reproduction locators private and outside public assets.
- Historical evidence is an archived panel; do not claim point-in-time qualification, current-market freshness, return prediction or portfolio validation.
- Preserve demo data as a separate mode and recompute its quantiles from its same-date published observations using linear interpolation.
- Publish additive jump components as `RJV = RLJV + RSJV`; label `RV - RJV` as the continuous remainder and retain raw IVhat reconciliation as a separate quality diagnostic.
- Use the distinct public metric identities `rv_shape_h3`, `rv_shape_h4` and `rv_shape_closeness`; retain exact private recipe parameters only in the private receipt.
- Only publish aggregates, counts, source identifiers and hashes, owner revision, review date, evidence stage, definitions, sensitivity summaries and bilingual limitations.
- Ignore unsupported URL parameters safely; never put private identifiers in URLs.
- Run tests, audits, builds and browser suites sequentially because they share generated build output.

## Review Focus

- Misaligned or duplicate date/security keys must stop production before any join; pin with `test_rejects_misaligned_and_duplicate_panel_keys` in Task 1.
- Missing values, zero RV denominators and raw IVhat greater than RV must remain separately counted without silent repair; pin with `test_quality_and_decomposition_diagnostics_preserve_raw_values` in Task 1.
- Short history and unpaired sensitivity observations must remain missing and be excluded from paired correlation counts; pin with `test_warmup_and_pairwise_cohorts_are_explicit` in Task 1.
- A private receipt may contain reproduction locators, but the exported projection must omit tickers, raw rows, local paths, credentials, recipes and unknown fields; pin with `test_public_projection_drops_private_fields_and_ticker_rows` in Task 3. A public asset containing any such field must fail its strict public contract audit in Task 4.
- Missing historical assets and invalid URL state must leave the demo usable and restore only supported parameters; pin with Task 5 and Task 7 browser cases.

---

### Task 1: Private historical calculations and quality diagnostics

**Files:**
- Create: `quant-research/src/alpha_research/historical_risk_history.py`
- Create: `quant-research/tests/strategy_research/test_historical_risk_history.py`
- Test: fixtures in the new test module; do not commit production panel samples

**Interfaces:**
- Consumes: aligned wide date-by-security DataFrames for `realized_variance`, `ivhat`, `rjv`, `rljv`, `rsjv`, `realized_skewness` and `realized_kurtosis`.
- Produces: `build_risk_history(panels: Mapping[str, DataFrame], *, review_date: date, owner_revision: str, source_metadata: Mapping[str, object]) -> dict[str, object]`; `source_metadata` contains the stable source ID, seven input content hashes, units and key schema; returned object includes the public projection candidate plus the private receipt.

- [x] **Step 1: Write failing fixture tests** for key alignment, duplicate keys, missing/nonfinite/negative values, zero RV, raw IVhat above RV, additive residual, pooled versus median shares, period counts, rolling warm-up, tail-limited sensitivity and paired rank-correlation cohort.
- [x] **Step 2: Run the focused tests** with `uv run --locked --extra dev python -m pytest tests/strategy_research/test_historical_risk_history.py -q`; confirm failures identify the absent calculation API.
- [x] **Step 3: Implement the private calculation module**. Reuse the existing `factor_engine_legacy.hermite_factor_meta` calculation helpers for RV-state H3/H4/closeness; align all panels only after exact key equality checks; generate monthly/annual jump and Hermite summaries, short/long and tail sensitivity, daily rank correlations, and raw decomposition quality counts. Keep all ticker-keyed matrices in memory only and emit no such matrix in the projection candidate.
- [x] **Step 4: Run the focused tests** and confirm all hand-computable fixture expectations pass.
- [x] **Step 5: Commit** the module and focused tests in the private producer branch.

### Task 2: Reproducible private receipt and source note

**Files:**
- Create: `quant-research/scripts/research/experiments/build_historical_risk_history.py`
- Create: canonical English research note under `quant-research/docs/research/`
- Modify: `quant-research/docs/strategy-research/knowledge-metadata.md` and the existing knowledge manifest/index identified by its repository checks
- Test: `quant-research/tests/strategy_research/test_historical_risk_history.py`

**Interfaces:**
- Consumes: `build_risk_history` from Task 1 and the five audited retained wide panels.
- Produces: task-scoped private receipt under `DATA_ROOT/quant/quant-research/research/historical-risk-<task-id>/`, seven source hashes, owner code revision, key schemas, units, source coverage, commands and known limits; no `current`/`latest` alias is updated.

- [x] **Step 1: Add CLI tests** for missing inputs, malformed panel schemas, stable receipt fields and task-specific output paths.
- [x] **Step 2: Run the focused tests** and confirm the runner and receipt contract are absent.
- [x] **Step 3: Implement the runner and source note** with stable `knowledge/v2` identity and explicit authority reference. Record exact private source locators only in the private receipt/note, identify the original Hermite output as unavailable, and distinguish observed end date from review date.
- [x] **Step 4: Run focused tests and repository documentation validation**; execute the producer once against the qualified retained inputs into the designated task directory and inspect its receipt and aggregate outputs.
- [x] **Step 5: Commit** the runner, note, and index updates in the private producer branch.

### Task 3: Allowlisted private-to-public exporter

**Files:**
- Create: `quant-research/src/alpha_research/risk_history_publication.py`
- Create: `quant-research/tests/strategy_research/test_risk_history_publication.py`
- Modify: `quant-research/scripts/research/experiments/build_historical_risk_history.py`

**Interfaces:**
- Consumes: the private receipt from Task 2.
- Produces: `export_risk_history(receipt: Mapping[str, object]) -> dict[str, object]` with schema identity `observatory.risk_history.v1`; only the field allowlist in the approved spec can cross the repository boundary.

- [x] **Step 1: Write failing projection tests** for required IDs, periods, counts, bounded rates, unit/metric identity and source hash references; inject ticker rows, raw series, private paths, credentials, unknown keys and recipe parameters into the private receipt and assert none reach the exported projection.
- [x] **Step 2: Run the focused tests** and confirm the exporter is missing.
- [x] **Step 3: Implement the explicit allowlist exporter** and deterministic JSON serialization; calculate and return the published asset content hash without copying the private receipt.
- [x] **Step 4: Run focused tests and the private public-boundary audit**; compare projection keys against the allowlist and verify no private identifier or source locator is present.
- [x] **Step 5: Commit** exporter and tests, then open and merge the private producer PR after required checks pass.

### Task 4: Public asset contract, source review and demo quantile correction

**Files:**
- Create: `quant-factor-observatory/site/public/data/risk-history.json`
- Create: `quant-factor-observatory/scripts/check_factor_demo_quantiles.py`
- Create: `quant-factor-observatory/tests/test_risk_history_asset.py`
- Modify: `quant-factor-observatory/site/public/data/research-publication-manifest.json`
- Modify: `quant-factor-observatory/site/public/data/research-source-review.json`
- Modify: `quant-factor-observatory/site/public/data/factor-snapshot.json`
- Modify: `quant-factor-observatory/.github/workflows/validate.yml` only if the existing audit workflow does not already run the new check

**Interfaces:**
- Consumes: merged private PR asset projection, producer revision, source note authority identity and SHA-256.
- Produces: validated `observatory.risk_history.v1` asset and a deterministic demo quantile check using linear interpolation at p01/p25/p50/p75/p99.

- [x] **Step 1: Write failing Python tests** for valid asset acceptance, unknown/private fields, invalid counts/rates/source references, and quantile recomputation from the three same-date observations.
- [x] **Step 2: Run the focused tests** and confirm the new contract and quantile check fail as expected.
- [x] **Step 3: Add the reviewed aggregate projection**, register exact source identity/content hash in manifest and source review, recompute demo quantiles from its observations, and wire the consistency check into release validation.
- [x] **Step 4: Run** the focused tests, `python scripts/check_factor_demo_quantiles.py --check`, `python scripts/audit_public_release.py`, and `python scripts/audit_research_updates.py --check`.
- [x] **Step 5: Commit** asset, source registrations, check and tests in the public consumer branch.

### Task 5: Historical jump and Hermite explorer modes

**Files:**
- Create: `quant-factor-observatory/site/src/riskHistory.ts`
- Create: `quant-factor-observatory/site/src/pages/QualityPage.tsx` (shared contracts start here; full page in Task 6)
- Modify: `quant-factor-observatory/site/src/data.ts`
- Modify: `quant-factor-observatory/site/src/types.ts`
- Modify: `quant-factor-observatory/site/src/App.tsx`
- Modify: `quant-factor-observatory/site/src/pages/JumpPage.tsx`
- Modify: `quant-factor-observatory/site/src/pages/HermitePage.tsx`
- Modify: `quant-factor-observatory/site/src/shapeExplorationCopy.ts` and `site/src/i18n.ts`
- Test: `quant-factor-observatory/site/tests/shape-exploration.spec.ts`

**Interfaces:**
- Consumes: validated risk-history asset from Task 4.
- Produces: optional `loadRiskHistory(): Promise<RiskHistory | null>`; both explorers expose explicit `demo` and `historical` modes, month/year, metric/component and period controls backed by the asset.

- [x] **Step 1: Add failing unit/browser cases** for historical mode selection, monthly/annual aggregates, continuous remainder labeling, missing optional asset retry, and no demo substitution.
- [x] **Step 2: Run affected tests** and confirm the loader/modes are not implemented.
- [x] **Step 3: Implement asset parsing and explorer modes**. Keep demo controls separate; show exact values, eligible/excluded counts, pooled shares and per-observation medians with distinct labels; show RV-shape metric identities, sensitivity overlap and correlation counts with localized limits.
- [x] **Step 4: Run affected Playwright cases** in English and Chinese at desktop/mobile widths and verify missing asset leaves demo available with a localized retry.
- [x] **Step 5: Commit** the public explorer implementation.

### Task 6: Quality view, factor/research navigation and shareable URLs

**Files:**
- Modify: `quant-factor-observatory/site/src/pages/QualityPage.tsx`
- Modify: `quant-factor-observatory/site/src/App.tsx`
- Modify: `quant-factor-observatory/site/src/components/StudyNavigation.tsx` or the established factor navigation component used by `FactorPage.tsx`
- Modify: `quant-factor-observatory/site/src/pages/FactorPage.tsx`
- Modify: `quant-factor-observatory/site/src/pages/StudiesPage.tsx`
- Modify: `quant-factor-observatory/site/src/research.ts`, `site/src/types.ts`, `site/src/i18n.ts`, and `site/src/shapeExplorationCopy.ts`
- Modify: `quant-factor-observatory/site/public/data/research-studies.json`, study navigation asset, and factor navigation metadata as applicable
- Modify: `quant-factor-observatory/site/tests/shape-exploration.spec.ts` and relevant navigation tests

**Interfaces:**
- Consumes: validated `RiskHistory` and current route controls from Task 5.
- Produces: `/quality` source/coverage/quality route; canonical URL state for mode, metric, period, granularity and demo ticker/date; copy-link control with localized status.

- [x] **Step 1: Write failing tests** for source/hash/coverage/review-date display, factor-to-explorer compatible links, explorer-to-study/source links, canonical URL restore, unsupported parameters and copy success/failure.
- [x] **Step 2: Run focused tests** and confirm the route, links and URL contract are missing.
- [x] **Step 3: Implement the bilingual quality route, catalog links and validated URL state**; preserve unknown query parameters only when safe, otherwise canonicalize to supported controls without private IDs.
- [x] **Step 4: Run focused browser tests** for both locales, dark contrast and mobile horizontal containment.
- [x] **Step 5: Commit** quality, navigation and URL changes.

### Task 7: Integrated validation and ordered publication

**Files:**
- Modify only files exposed by Tasks 1–6 to fix verified integration issues.
- Test: both repositories' required suites and public live routes after deployment.

**Interfaces:**
- Consumes: merged private producer release and public consumer candidate.
- Produces: merged public PR whose Pages deployment loads `jumps`, `hermite` and `quality`, with URL restoration and source review verified.

- [x] **Step 1: Run private locked checks sequentially:** focused research tests, `PYTHONPATH=src:scripts/research/experiments:scripts/research/experiments/style_factors:tests/strategy_app:. uv run --locked --extra dev python -m pytest tests -q`, `python scripts/dev/check_documentation.py`, and `uv run --locked --extra dev python scripts/dev/ruff_layers.py --layer production --check-baseline`.
- [x] **Step 2: Run public checks sequentially:** `python -m unittest discover -s tests -v`, `python scripts/audit_public_release.py`, `python scripts/audit_research_updates.py --check`, the demo quantile check, `npm run build --prefix site`, and `npm run test:e2e --prefix site`.
- [x] **Step 3: Review** aggregate charts/tables, desktop/mobile screenshots, both locales, dark contrast, production asset network behavior and optional-load retry.
- [ ] **Step 4: Revalidate against current `main`, resolve any changes and rerun affected checks; open/merge the public PR only after the private producer PR is merged and required checks pass.**
- [ ] **Step 5: Confirm Pages deployment and smoke-test both supplied routes plus `/quality`; remove only task-owned branches/worktrees after merge, then fast-forward clean primary checkouts.**

