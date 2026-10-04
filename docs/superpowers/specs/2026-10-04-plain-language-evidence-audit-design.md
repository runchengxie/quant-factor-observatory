# Public Research Plain Language Audit Design

**Date:** 2026-10-04  
**Repositories:** `quant-factor-observatory`, `quant-market-research`

## Goal

Make every technical term, calculation, and displayed source field that can block a general reader's understanding easier to interpret across both public research sites, while preserving the full research record and technical meaning.

## Audience and success criteria

The primary reader is interested in the research result but may not know quantitative-finance, statistics, accounting, or data-engineering vocabulary. A reader should be able to understand what each displayed number describes, how it was calculated at a high level, what comparison it supports, and what it cannot establish.

The audit is complete when:

1. Every public page and rendered research document in scope has been reviewed in English and Simplified Chinese.
2. Every specialist term, equation, metric label, and source-field identifier that materially affects interpretation has a nearby plain-language explanation.
3. Original technical names, equations, values, units, provenance, sample details, evidence status, and limitations remain available and accurate.
4. No definition is guessed where a source or approved method does not establish it; the page says what is unknown and points to the available source record.
5. Repeated definitions use consistent bilingual wording within each repository.

## Scope

### Quant Factor Observatory

Review all public rendered surfaces: overview, factor catalog and factor detail, fundamentals, Alpha 810 overview and factor detail, study index and each public study detail, evidence hub and comparison, annual R&D evidence, jump decomposition, and Hermite distribution pages. Include user-facing strings held in locale catalogs and the published aggregate study, exploration, and navigation records when they appear on these pages.

### Quant Market Research

Review all public pages registered for publication, including the overview, research index, topic and workbench pages, data/source pages, and the English and Simplified Chinese research documents in the public registry. Include explanatory text rendered from published, reviewed aggregate snapshots and dictionaries.

### Out of scope

- Internal plans, agent instructions, runbooks, unpublished research notes, raw vendor data, private implementations, and machine-only schema fields that readers never see.
- Changes to research calculations, evidence classification, dataset values, source mappings, equations, sample definitions, or publication boundaries.
- Simplifying a technical label by silently replacing or deleting its original name.

## Reader-facing treatment

### Terms and acronyms

At the first point where a term is needed, state the original term and give a short explanation of what it means on that page. Explain abbreviations when they first appear. Keep familiar domain labels where they identify an actual method or metric; put the explanation immediately beside the label, in a note, or in an accessible disclosure. Avoid unexplained abbreviations in headings and navigation.

### Formulas and statistics

Keep each published equation and notation intact. Explain each symbol, unit, and operation in plain language, then say what the resulting number means in the displayed comparison. Preserve distinctions between metrics that look similar, such as IC and RankIC, turnover rate and traded value, cumulative return and annualized return, volatility and drawdown, and estimate versus realized outcome.

### Raw source fields and table values

Keep a source-field identifier available where traceability requires it. Pair it with a human-readable label and one-sentence definition of the represented quantity, population, period, and unit when known. Explain special values and nulls. Never infer an undocumented field definition or expose private source paths or unpublished recipe details.

### Long methods and provenance

Lead with the reader's question or the current conclusion. Keep complete derivations, experiment steps, source identities, dates, sample scope, calculation details, caveats, and changes in interpretation. Put lengthy reproduction and provenance records behind native accessible disclosure controls when this improves scanning; the full record must remain available and searchable in page content.

### Localization and consistency

Write natural English and Simplified Chinese independently rather than translating word for word. Keep stable identifiers and data contracts language-neutral. Put new site UI strings in the factor site's locale catalogs or use the market site's established bilingual content mechanism. Use the same definition for a repeated term within each site, while preserving distinctions where a term has a different meaning in context.

## Editorial workflow

1. Build a page-by-page inventory of rendered terms, equations, field names, and other labels that need interpretation.
2. Check each item against the repository's source contracts, data dictionaries, calculations, source records, and applicable research notes.
3. Record the exact displayed name, the sourced meaning, the intended plain-language explanation, and any unresolved definition in both locales.
4. Edit the appropriate reader-facing page or locale source. Do not alter the underlying values or machine contracts.
5. Compare every edited page with its pre-edit evidence and provenance to confirm that no detail was removed, generalized, or overstated.
6. Keep the audit inventory as a review aid in the task branch; it may be removed before merge if it duplicates the final source and is not useful as ongoing documentation.

## Implementation boundaries and validation

The work will be delivered in a separate PR per repository, both targeting the user's `main`. The factor site remains the first PR only because this design document is stored there; there is no data-provider dependency between the two sites.

Required repository checks and CI must pass before merge. Reviewers should focus on statistical meaning, distinctions among similar measures, bilingual clarity, preserved sample/provenance information, and whether every rendered technical label has an explanation. No test behavior should be weakened to accommodate longer copy; adjust layout or phrasing if an existing page contract is affected.

## Known open questions for the audit

- Some displayed abbreviations and aggregate fields may lack a public definition. Preserve the identifier and state the known boundary rather than reverse-engineering or guessing.
- Older archived studies can use terms differently from current research. Definitions must follow each study's own recorded method and dates.
- Dense tables may need a reader note or accessible disclosure rather than repeating a full definition in every cell.
