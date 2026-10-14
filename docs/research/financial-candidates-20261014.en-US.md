# Does adding last year's reports improve the forecast?

[简体中文](financial-candidates-20261014.zh-CN.md)

Seasonal financial history improves the tested net-profit forecast. For operating cash flow, last year's comparable target quarter is already a strong ordering baseline. The model needs to improve on that baseline to show what the added forecast contributes.

The retrospective comparison covers 28 source-report quarters from 2019 Q1 through 2025 Q4, with 92,135 net-profit and 91,895 cash-flow rows. Each target uses identical train/test completeness masks across all methods. Additional history changes the eligible sample, and base models are refitted, so these results do not replace the earlier larger-sample scores.

| Fixed method | Net-profit Rank IC | Operating-cash-flow Rank IC |
|---|---:|---:|
| Latest value | 0.629 | 0.136 |
| Available prior-year target quarter | 0.658 | 0.419 |
| Base numeric model | 0.658 | 0.300 |
| Numeric model plus seasonal inputs | 0.731 | 0.444 |
| Base ranking model | 0.634 | 0.214 |
| Ranking model plus seasonal inputs | 0.680 | 0.347 |
| Equal latest-value/base-ranker percentile blend | 0.648 | 0.202 |

Rank IC compares predicted and later financial company orderings. It is neither a correct-prediction percentage nor a stock return. Means weight test rounds equally; decline confusion counts pool common rows.

The single-quarter net-profit/assets numeric forecast reduces raw MAE from 1.354 to 1.237 percentage points, an 8.62% reduction versus the refitted base model. Its rank gain over the seasonal baseline averages 0.073 and is positive in 27/28 rounds. At the fixed one-point decline threshold its precision/recall are 65.63%/41.80%, versus 60.26%/25.06% for the base model. The simpler seasonal control catches more declines with less reliable flags.

For cash flow/revenue, the augmented numeric model adds mean rank gain 0.025 over the seasonal baseline, positive in 28/28 rounds. Both ranking arms and the equal blend remain behind the seasonal ordering. However, the seasonal baseline's numerical error is very large, and the augmented model's raw MAE remains 132.998 percentage points. Accurate company order does not imply accurate amounts. Alternative accounting denominators need evaluation.

Operating cash flow minus reported long-lived-asset spending is computable on 98.93% of the audited raw cash-flow records. It differs from the supplied free-cash-flow field and remains a separate candidate. Enterprise and equity free cash flow must also remain distinct. Complete field provenance stays in the source research record. Dividend events have retained implementation records, but announcement, ex-date and payment date differ; missing events are not zero payouts. No new FCF/dividend strategy return is calculated.

The era has already been explored. Announcement dates reconstruct availability, original financial revisions remain incomplete, and historical investability is not certified. Every fixed method is retained; no trading policy is selected. A forward plan proposes forecasting 2026 Q4 from Q3 reports, with sealing by November 15, 2026 at 00:00 UTC and scoring after June 30, 2027 at 00:00 UTC. It has no sealed predictions yet.

Investment comparisons still need identical stocks, dates, execution and costs, with current fundamentals, valuation and forecasts tested incrementally. Missing quotes, suspension, industry and execution qualification remain unresolved.

Stable source record is `quant-research.experiment.financial-candidates-20261014`. This public summary excludes security rows, private reproduction paths and model parameters.
