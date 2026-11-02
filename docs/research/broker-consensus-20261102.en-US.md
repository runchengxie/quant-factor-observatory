# Broker forecast research publication

The broker-consensus study publishes coverage, historical-update limitations and four factor diagnostics. Its initial research note is `doc:quant-research.research.broker-consensus-20261102`, pinned to merged owner revision `85888563c3f50f3df59e27463c459177fefbbfc1`. The paired valuation and endpoint follow-up is `doc:quant-research.research.broker-consensus-followup-20261102`, pinned to merged owner revision `d15080a74702a8913c612128aa34846946f54b28`. Original run code identity is separate from these owner review versions.

The source acquisition covers 191 months and 2,749,081 report/forecast-period records. The research scores 188 formation months, January 2011 through August 2026; provider-time availability yields only 50 or 52 valid factor months. All evidence remains retrospective. Historical first availability, complete vendor vintages and executable returns are not certified.

`broker-consensus-aggregate.json` and `broker-consensus-followup.json` are recursive allowlist exports from the private owner. They contain aggregate counts, valuation comparisons, calendar-aware uncertainty intervals and source identities. No per-security rows, reports, holdings, private paths or research parameters are public. The initial builder derives twelve selectable charts. `scripts/append_broker_followup.py` adds six charts and three reviewed stages while preserving the initial results. Neither script calculates a factor or runs a backtest.

Rebuild only after reviewing the owner note and aggregate:

```bash
python scripts/build_broker_consensus.py \
  --owner-revision <merged-owner-commit> --runner-sha256 <original-runner-sha256>
python scripts/append_broker_followup.py \
  --source <private-owner-allowlist-export> --owner-revision <merged-owner-commit>
python scripts/build_evidence_review_records.py
```

The follow-up compares reported and forecast earnings yields on the same stock-month cohort. The four paired forecast-minus-reported RankIC intervals include zero. The adjusted forecast rank residual remains positively associated with later returns in the retrospective sample. This result is descriptive. It has no untouched holdout and is not an executable return claim.

The endpoint audit classifies 11,498 missing endpoints across 8,399 stock-month rows. Recorded suspensions overlap 10,764 endpoints. Current listing metadata is diagnostic only. No settlement value is imputed. A bounded 20-case provider query returned no quotes and does not represent every unresolved endpoint.

The prospective protocol requires completed immutable daily snapshots before each decision cutoff. Missed dates stay missing. The first eligible formation is planned for the final exchange session of November 2026. No prospective forecast or future return result is published yet.

Retain each estimate's valid-month count and descriptive interval. The chart scale includes interval endpoints; exact values and source details open by default for this topic. Fewer than twelve valid months has no estimated interval. Cost summaries use complete endpoint months only, exclude borrowing, impact and terminal liquidation, and cannot establish a continuous investable strategy.

The source auditor now preserves auxiliary public-asset review records when appending a study baseline. Existing seven study baselines and risk-history asset records remain unchanged. The live source check detected a pre-existing owner-source change for the fundamental-state-forecasting topic; that topic is marked for review without rewriting its evidence or recapturing its pinned source baseline.

Independent publication review confirmed aggregate equality and found missing per-series sample counts and intervals beside charts. The final projection and chart rendering include these fields, with contract and browser regressions. Chinese copy states that earlier provider-clock eligible counts are zero and explains the monthly collection/return dates at first use.

## Plain-language reader and benchmark evidence, reviewed November 3, 2026

The page now leads with the current stock-selection decision. Evidence is insufficient to treat broker consensus as a reliable standalone stock-selection factor. Some retrospective associations remain, while original vintages, forecast-specific return increments and investability remain unresolved. Profit-prediction accuracy is discussed separately from stock returns.

The benchmark and coverage follow-up is `doc:quant-research.research.broker-consensus-benchmark-20261102`, reviewed at owner revision `8559b14fd5bbbfa1ec6a14440efc2231f29dbc34`. It compares forecasts with the prior annual profit disclosed by each cutoff, reports profitable and loss-making companies separately, and retains paired uncertainty and missing-baseline counts. Coverage comparisons include raw groups and a fixed profit/year/industry-controlled regression. The regression is descriptive, uses later-realized profit, and does not establish causation or a minimum-coverage rule.

`broker-consensus-benchmark.json` contains only the allowlisted aggregate comparisons, coverage counts, regression estimates, intervals and source identity. Private paths, source-file maps and company records are excluded recursively. Seven new charts bring the total to 25. All 18 original charts and seven research stages are retained. The reader paragraphs, precise tables and source records remain expanded. All 25 charts are expanded directly on the page. Each chart appears once beneath its first linked reader section; remaining historical charts follow in an expanded evidence section. Shared references jump to the same chart through ordinary anchors. Every exact table is visible without opening a disclosure. Legend buttons can hide a series while retaining every exact table value. Axes rescale with the visible series. Intervals without monthly sample counts retain interval labels without inventing a month count.

After rebuilding the initial and paired-valuation projections above, regenerate the reader using the reviewed public asset:

```bash
python scripts/build_broker_consensus_reader.py
python scripts/build_evidence_review_records.py
```

To review a new private-owner result, pass `--result` to the reader builder. Its fixed recursive allowlist emits the public aggregate first. Review the source note, numbers and context before capturing the broker study's updated source baseline. Other studies' review records must remain unchanged.
