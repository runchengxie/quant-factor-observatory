# Factor Observatory Plain Language Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Explain every reader-facing specialist term, formula, and data field in the Factor Observatory while keeping its full research record intact.

**Architecture:** Audit the rendered site from its user-facing string catalogs, React pages, and published aggregate records. Add contextual explanations in the existing bilingual copy sources and maintain a route-by-route inventory so every definition can be traced to its evidence source.

**Tech Stack:** React, TypeScript, static JSON content, bilingual locale catalogs.

**Spec:** `docs/superpowers/specs/2026-10-04-plain-language-evidence-audit-design.md`

## Global Constraints

- Review every public rendered route in English and Simplified Chinese.
- Preserve all formulas, identifiers, values, units, dates, sample scope, sources, uncertainty, and evidence status.
- Do not change calculations, source mappings, raw values, or machine schemas.
- Do not guess definitions; identify the source or state what remains undefined.
- Do not add or run tests for this editorial task; use `git diff --check`, source comparison, and required PR CI.

## Review Focus

- A familiar abbreviation can describe different metrics; confirm the explanation against the page's exact measure and unit.
- Published aggregate fields can lack a documented interpretation; keep the field identifier and mark the meaning unresolved rather than infer it.
- Bilingual explanations can drift; compare the English and Chinese inventory rows before closing each page group.
- Added definitions can imply more evidence than the study has; preserve historical, descriptive, and non-tradability limits adjacent to the result.
- Long copy can obscure the chart or table; preserve the existing responsive and first-screen content order.

---

### Task 1: Build the rendered-content inventory

**Files:**
- Create: `docs/superpowers/reviews/2026-10-04-factor-observatory-term-inventory.md`
- Inspect: `site/src/i18n.ts`, `site/src/explorationCopy.ts`, `site/src/pages/*.tsx`, `site/src/components/*.tsx`, `site/public/data/research-studies.json`, `site/public/data/study-exploration/*.json`, `site/public/data/study-navigation/*.json`, and `site/public/data/rd-investment-annual.json`

**Interfaces:**
- Produces an inventory with route, locale, displayed name or formula, source of definition, plain-language meaning, and any unresolved boundary.

- [ ] List every public route from `site/src/App.tsx` and every dynamic study-detail route from the published catalog.
- [ ] Read the rendered UI strings and the exact aggregate fields used by each route; exclude fields that are never displayed.
- [ ] Trace each candidate definition to a published method, source record, or formula. Mark unsupported definitions unresolved.
- [ ] Check that all routes, both locales, chart labels, tables, controls, status tags, and expandable source notes are represented.

**Check:** Compare the inventory against `site/src/App.tsx`, `site/src/pages/`, and the IDs in the published study catalog. No route or displayed metric may be absent.

### Task 2: Explain factor catalog, factor detail, and fundamentals

**Files:**
- Modify: `site/src/pages/OverviewPage.tsx`, `site/src/pages/FactorExplorerPage.tsx`, `site/src/pages/FactorPage.tsx`, `site/src/pages/FundamentalsPage.tsx`, `site/src/research.ts`, `site/src/i18n.ts`, and only the existing copy fields in `site/public/data/fundamental-factor-catalog.json` if a displayed definition is missing there
- Update: the inventory from Task 1

**Interfaces:**
- Consumes the sourced definitions and unresolved items in Task 1.
- Produces bilingual reader notes for factor score, family, coverage, direction, point-in-time availability, cross-sectional ranking, standardized values, quantile cutoffs, and the table fields actually shown.

- [ ] Explain each displayed score and comparison in the same place as its label or table, retaining identifiers and units.
- [ ] Distinguish factor score from realized return, data availability from sample coverage, and standardized score units from money.
- [ ] Explain P01/P50/P99 and other displayed cutoffs as positions in the stated sample; retain exact percentiles and date scope.
- [ ] Preserve the number of catalog entries, example tickers, missing-value handling, and existing method limits.
- [ ] Compare the final displayed fields against the source catalog and inventory.

**Check:** Manually trace each new sentence to the inventory source. Confirm no UI definition adds a prediction claim or changes a field's unit.

### Task 3: Explain Alpha 810 metrics and inference

**Files:**
- Modify: `site/src/pages/Alpha810OverviewPage.tsx`, `site/src/pages/Alpha810FactorPage.tsx`, and relevant Alpha 810 entries in `site/src/i18n.ts`
- Inspect without changing data: `site/public/data/alpha810-snapshot.json`
- Update: the inventory from Task 1

**Interfaces:**
- Produces bilingual explanations for each visible aggregate metric, test, interval, and table field, sourced from the public Alpha 810 contract and snapshot metadata.

- [ ] Explain IC, RankIC, positive-rate share, group spread, coverage, p-value, BY-adjusted q-value, HAC/Newey–West lag, confidence interval, and block-bootstrap range where each is first displayed.
- [ ] Explain the numerator, denominator, observation unit, and comparison direction for visible rates and counts.
- [ ] Preserve the complete formulas, q-value threshold, family size, lag settings, interval values, and limitations on dependence, selection bias, point-in-time validity, and tradability.
- [ ] Explain only the metrics present in each schema version; do not imply an unavailable statistic exists.

**Check:** Compare every label and explanation to `docs/alpha810-public-contract.md` and the snapshot schema fields. Confirm all currently displayed values and boundaries remain present.

### Task 4: Explain exploration and study evidence pages

**Files:**
- Modify: `site/src/explorationCopy.ts`, `site/src/pages/HermitePage.tsx`, `site/src/pages/JumpPage.tsx`, `site/src/pages/StudiesPage.tsx`, `site/src/pages/StudyComparisonPage.tsx`, `site/src/pages/ResearchEvidencePage.tsx`, `site/src/components/StudyExploration.tsx`, `site/src/components/StudyNavigation.tsx`, and existing bilingual values in the rendered `site/public/data/study-exploration/*.json`, `site/public/data/study-navigation/*.json`, and `site/public/data/rd-investment-annual.json`
- Update: the inventory from Task 1

**Interfaces:**
- Produces sourced explanations for terms used by the eight published studies, evidence navigation, charts, and comparisons.

- [ ] Explain displayed Hermite and jump terms, keep the decomposition identity intact, and define each symbol without changing arithmetic or scale.
- [ ] For each study, explain chart metric, baseline, sample/horizon, units, evidence stage, and source status where shown.
- [ ] Explain the distinction between forecast errors, return correlations, portfolio replay, annual summaries, and prospective holdout where those labels appear.
- [ ] Explain audit-card fields and unknown status values using their recorded definitions; keep stable status identifiers intact.
- [ ] Retain conclusion changes, source dates, missing evidence, sample counts, and all limits in both locales.

**Check:** Review each study route against its source records. Confirm comparison groups remain like-for-like and historical differences are not presented as future or executable results.

### Task 5: Final completeness review and PR

**Files:**
- Review: all files changed in Tasks 1–4 and the inventory
- Update: `site/tests/observatory.spec.ts` only if an existing visible-copy assertion directly contradicts the approved copy

- [ ] Re-open every inventory route/locale entry and mark the explanation's final file and location.
- [ ] Compare the pre-change and final source to confirm no evidence, sample, formula, identifier, unit, date, provenance, or limitation was removed.
- [ ] Check disclosure controls retain accessible names and are keyboard-operable by inspection.
- [ ] Run `git diff --check`; do not run a local test suite.
- [ ] Commit and push this repository's task branch, open a PR to `main`, and merge only after required CI passes.

**Expected result:** `git diff --check` exits successfully; every inventory item maps to visible bilingual copy or an explicit unresolved-definition note; all required PR checks pass.
