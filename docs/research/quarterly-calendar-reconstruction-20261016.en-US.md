# Complete-quarter financial forecast check

## Main result

After fixing the report-date matching and including all four source quarters, XGBoost still ranked companies worse on average than simply carrying forward the latest reported value. This held across four financial measures and horizons of one to four quarters. The test measures financial ordering, not share returns.

| Measure | Ahead | Model | Carry current value | Difference |
| --- | ---: | ---: | ---: | ---: |
| Asset profitability | 1 quarter | 0.805 | 0.846 | -0.041 |
| Gross margin | 1 quarter | 0.945 | 0.954 | -0.010 |
| Revenue growth | 1 quarter | 0.257 | 0.739 | -0.482 |
| Operating cash flow / revenue | 1 quarter | -0.017 | 0.120 | -0.137 |
| Asset profitability | 2 quarters | 0.642 | 0.767 | -0.124 |
| Gross margin | 2 quarters | 0.917 | 0.927 | -0.010 |
| Revenue growth | 2 quarters | 0.129 | 0.524 | -0.395 |
| Operating cash flow / revenue | 2 quarters | -0.031 | 0.185 | -0.216 |
| Asset profitability | 3 quarters | 0.616 | 0.713 | -0.097 |
| Gross margin | 3 quarters | 0.894 | 0.904 | -0.010 |
| Revenue growth | 3 quarters | 0.079 | 0.315 | -0.236 |
| Operating cash flow / revenue | 3 quarters | -0.014 | 0.133 | -0.147 |
| Asset profitability | 4 quarters | 0.690 | 0.715 | -0.026 |
| Gross margin | 4 quarters | 0.878 | 0.890 | -0.013 |
| Revenue growth | 4 quarters | 0.013 | 0.121 | -0.109 |
| Operating cash flow / revenue | 4 quarters | 0.009 | 0.402 | -0.393 |

Rank correlation describes whether the higher-ranked companies later remained higher. It is not a percentage return and does not mean that the model picked that percentage of companies correctly. The final column is model minus simple-baseline score; negative values favor carrying the current value forward.

## What the calendar fix changed

The earlier saved one-quarter tests omitted some fiscal quarters, including Q3. The corrected one-quarter run covers 57 or 58 report formations, with all four quarters represented. The old run had 41 formations and no Q3. On company/report-period keys shared with the old run, the correction recovered 15,655 previously missing future target values across all 16 measure/horizon pairs. Every old non-missing target value and target report period matched the corrected run.

The join now finds the exact future calendar quarter end using the full source panel, then removes a prediction only if that future report was already available on the feature date. Corrected training and test cohorts changed too, so the score difference from the old run does not isolate the calendar fix alone.

## Scope and limits

The experiment uses 205,037 retained earliest-disclosure rows. It tests ROA, gross margin, revenue growth and quarterly operating cash flow/revenue at one-, two-, three- and four-quarter horizons. Walk-forward training uses earlier formations only, with target reports required to be available before the test formation. Each formation's Spearman rank correlation receives equal weight in the average.

This is a retrospective diagnostic over a period already explored. Disclosure dates are reconstructed and the data provider's revision history is incomplete. Ridge emitted ill-conditioned-matrix warnings and remains an unstable diagnostic arm. It does not change the XGBoost comparison above.

The retained market-data audit still has six missing entry quotes, six missing exit quotes and twelve missing historical industry assignments. The October 15 follow-up matches all 12 missing quotes to same-day events in a complete suspension source. That explains their absence but does not establish executable prices. The historical return test remains unqualified. See the [fixed selection pilot](three-arm-selection-pilot-20261015.en-US.md). Free-cash-flow and dividend model tests remain pending until their point-in-time definitions are fixed.

The private research record retains the full protocol, source hashes, row-level outputs, reconciliation, warning and failure receipts. This public note contains aggregate results only.
