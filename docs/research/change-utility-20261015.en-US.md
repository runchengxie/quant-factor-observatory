# Do financial forecasts find companies that are improving?

Sorting companies by their predicted future financial level tends to favor companies that are already strong. We tested a second score that subtracts today’s value from the predicted future value. In this historical sample, ranking by predicted improvement more often picked companies whose financial ratio rose in the following quarter.

The test covers 28 quarterly formations from 2019 Q1 through 2025 Q4. Each round uses the same companies across the fixed comparisons. “Improved” means the next-quarter ratio was strictly higher than the current ratio. The two targets are quarterly net profit relative to assets and operating cash flow relative to revenue. They are financial ratios, not stock returns.

## What happened in the top 10%?

| Companies selected by | Net-profit ratio rose | Cash-flow ratio rose |
|---|---:|---:|
| All eligible companies | 47.9% | 52.0% |
| Predicted future financial level | 43.3% | 57.4% |
| Seasonal level forecast minus current value | 77.3% | 88.6% |
| Model trained directly on next-quarter change | 75.7% | 87.9% |

Each test round selected its highest-ranked 10% separately, then the reported rates averaged the rounds equally. The first row is the overall share of companies whose ratio rose. The other rows show that ranking predicted improvement selected more improvers than ranking by future level alone.

The direct change model did not improve on the simpler calculation. For net profit/assets, its mean absolute error was 1.434 percentage points and its Rank IC for change was 0.480. The seasonal level forecast minus today’s value scored 1.237 and 0.511. For cash flow/revenue, direct change slightly reduced mean absolute error from 132.998 to 130.079 percentage points, but Rank IC fell from 0.683 to 0.672 and direction accuracy fell from 77.8% to 76.9%. Cash-flow ratios still have very large outliers, so that small error reduction does not establish reliable amount forecasts.

At a fixed one-point decline threshold, direct change produced more reliable warnings but missed more declines. Net-profit decline precision/recall were 74.8%/25.0% for direct change and 66.3%/42.1% for level forecast minus current. Cash-flow values were 73.8%/66.5% and 72.3%/73.5%. This threshold is a descriptive test, not a validated business-risk boundary.

## What this says about a stock strategy

The result supports a limited conclusion. The forecast contains information about next-quarter financial ratios, and subtracting the current value helps find firms whose ratios later rose. A higher ratio does not guarantee a rising share price. Ratios can also change when their denominator changes, and investors may already know the information.

A separate, older forecast-plus-valuation replay covered 26 irregular formation periods. Its annualized returns after the stated trading cost were -0.39% for Top10 and -1.16% for Top20. It used an earlier score and did not compare against current fundamentals plus valuation on the same stocks and dates. It therefore gives no return estimate for this new forecast and does not isolate the incremental value of forecasting.

Historical prices, suspension status, industry coverage and execution conditions still need qualification. The next return test needs the same eligible companies, dates, valuation inputs and trading assumptions for current fundamentals, current fundamentals plus valuation, and the forecast added to that score.

The next financial-input comparisons are adjusted net profit, operating cash flow relative to assets, and single-quarter versus trailing-four-quarter cash flow. Their statement definitions, availability dates, denominators and missing-data rules need to be fixed before fitting. Free cash flow and dividends also require separate definitions; missing dividend events cannot be assumed to mean zero payouts.

This is a retrospective study of years already examined. It does not select a model or qualify a trading strategy. The full research record preserves the per-quarter results and limits.
