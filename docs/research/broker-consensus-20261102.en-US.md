# Broker forecast research publication

The broker-consensus study publishes coverage, historical-update limitations and four factor diagnostics. Its authoritative research note is `doc:quant-research.research.broker-consensus-20261102`, pinned to merged owner revision `85888563c3f50f3df59e27463c459177fefbbfc1`. Original run code identity is separate from the owner review version.

The source acquisition covers 191 months and 2,749,081 report/forecast-period records. The research scores 188 formation months, January 2011 through August 2026; provider-time availability yields only 50 or 52 valid factor months. All evidence remains retrospective. Historical first availability, complete vendor vintages and executable returns are not certified.

`broker-consensus-aggregate.json` is the private owner's recursive allowlist export. It contains only annual counts, aggregate coverage, factor diagnostics, calendar-aware uncertainty intervals and source identities. No per-security rows, reports, holdings, private paths or research parameters are public. The generator derives twelve selectable charts, the study catalog entry, publication manifest and trust/navigation projection from this export. It does not calculate a factor or run a backtest.

Rebuild only after reviewing the owner note and aggregate:

```bash
python scripts/build_broker_consensus.py \
  --owner-revision <merged-owner-commit> --runner-sha256 <original-runner-sha256>
python scripts/build_evidence_review_records.py
```

Retain each estimate's valid-month count and descriptive interval. The chart scale includes interval endpoints; exact values and source details open by default for this topic. Fewer than twelve valid months has no estimated interval. Cost summaries use complete endpoint months only, exclude borrowing, impact and terminal liquidation, and cannot establish a continuous investable strategy.

The source auditor now preserves auxiliary public-asset review records when appending a study baseline. Existing seven study baselines and risk-history asset records remain unchanged. The live source check detected a pre-existing owner-source change for the fundamental-state-forecasting topic; that topic is marked for review without rewriting its evidence or recapturing its pinned source baseline.

Independent publication review confirmed aggregate equality and found missing per-series sample counts and intervals beside charts. The final projection and chart rendering include these fields, with contract and browser regressions. Chinese copy states that earlier provider-clock eligible counts are zero and explains the monthly collection/return dates at first use.
