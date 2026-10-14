export type DeclineCounts = {
  threshold: number; rows: number; true_positive: number; false_positive: number;
  false_negative: number; true_negative: number; precision: number | null;
  recall: number | null; prevalence: number | null;
}
export type RobustModel = {
  id: string; raw_mae: number | null; robust_mae: number | null;
  rank_ic: number | null; thresholds: DeclineCounts[];
}
export type CashPeriod = { period: number; formations: number; mean_gain: number | null; wins: number }
export type RobustGroup = {
  target: string; horizon: number; variant: string; rows: number; formations: number;
  report_start: string; report_end: string; models: RobustModel[];
  cash_ranking?: { rank_ic: number | null; gain_vs_current: number | null; wins: number; formations: number; paired_formations: number; annual: CashPeriod[]; fiscal_quarter: CashPeriod[] };
}
export type ForecastRobustnessData = {
  schema_version: string; groups: RobustGroup[];
  qualification: { candidate_count: number; entry_missing: number; exit_missing: number; industry_missing: number; interval_observations: number; return_qualified: false };
}
const numeric = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const count = (v: unknown): v is number => numeric(v) && Number.isSafeInteger(v) && v >= 0
const nullable = (v: unknown) => v === null || numeric(v)
const rate = (v: unknown) => v === null || (numeric(v) && v >= 0 && v <= 1)
const correlation = (v: unknown) => v === null || (numeric(v) && v >= -1 && v <= 1)
const unique = (values: unknown[]) => new Set(values).size === values.length
const date = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v))
const near = (a: number | null, b: number | null) => a === null ? b === null : b !== null && Math.abs(a - b) < 1e-9
const models = ['current', 'seasonal', 'level_ridge', 'delta_ridge', 'level_xgb', 'delta_xgb']
const variants = ['primary', 'milder_clipping', 'unclipped']
const targets = ['reported_roa', 'quarterly_net_profit', 'quarterly_cash_flow']

function decline(d: DeclineCounts, rows: number) {
  if (!d || ![.5, 1, 2].includes(d.threshold) || d.rows !== rows || ![d.rows, d.true_positive, d.false_positive, d.false_negative, d.true_negative].every(count)) return false
  const total = d.true_positive + d.false_positive + d.false_negative + d.true_negative
  const flagged = d.true_positive + d.false_positive, actual = d.true_positive + d.false_negative
  return total === rows && [d.precision, d.recall, d.prevalence].every(rate)
    && near(d.precision, flagged ? d.true_positive / flagged : null)
    && near(d.recall, actual ? d.true_positive / actual : null)
    && near(d.prevalence, rows ? actual / rows : null)
}

function group(g: RobustGroup) {
  if (!g || !targets.includes(g.target) || ![1, 4].includes(g.horizon) || !variants.includes(g.variant) || !count(g.rows) || !count(g.formations) || g.formations < 1 || !date(g.report_start) || !date(g.report_end) || g.report_start > g.report_end) return false
  const first = Number(g.report_start.slice(0, 4)), last = Number(g.report_end.slice(0, 4))
  if (first < 1900 || last > 2100 || last - first > 100 || g.formations > (last - first + 1) * 4 || g.rows < g.formations) return false
  if (!Array.isArray(g.models) || g.models.length !== 6 || !unique(g.models.map(m => m?.id)) || !g.models.every(m => m && models.includes(m.id) && [m.raw_mae, m.robust_mae].every(v => v === null || (numeric(v) && v >= 0)) && correlation(m.rank_ic) && Array.isArray(m.thresholds) && m.thresholds.length === 3 && unique(m.thresholds.map(t => t?.threshold)) && m.thresholds.every(t => decline(t, g.rows)))) return false
  if (g.target !== 'quarterly_cash_flow' || g.horizon !== 1) return g.cash_ranking === undefined
  const cash = g.cash_ranking
  if (!cash || !correlation(cash.rank_ic) || !nullable(cash.gain_vs_current) || !count(cash.paired_formations) || cash.paired_formations > g.formations || cash.formations !== g.formations || !count(cash.wins) || cash.wins > cash.paired_formations) return false
  const periods = (values: CashPeriod[], fiscal: boolean) => Array.isArray(values) && values.length > 0 && values.length <= (fiscal ? 4 : last - first + 1) && unique(values.map(p => p?.period)) && values.every(p => p && count(p.period) && (fiscal ? p.period >= 1 && p.period <= 4 : p.period >= first && p.period <= last) && count(p.formations) && p.formations <= g.formations && count(p.wins) && p.wins <= p.formations && nullable(p.mean_gain) && (p.formations === 0 ? p.mean_gain === null : p.mean_gain !== null)) && values.reduce((sum, p) => sum + p.formations, 0) === cash.paired_formations && values.reduce((sum, p) => sum + p.wins, 0) === cash.wins
  return periods(cash.annual, false) && periods(cash.fiscal_quarter, true)
}

export function isForecastRobustness(value: unknown): value is ForecastRobustnessData {
  if (!value || typeof value !== 'object') return false
  const d = value as ForecastRobustnessData
  if (d.schema_version !== 'observatory.forecast_robustness.v1' || !Array.isArray(d.groups) || d.groups.length !== 18 || !d.groups.every(group) || !unique(d.groups.map(g => `${g.target}-${g.horizon}-${g.variant}`))) return false
  for (const target of targets) for (const horizon of [1, 4]) {
    const compared = d.groups.filter(g => g.target === target && g.horizon === horizon)
    if (new Set(compared.map(g => `${g.rows}-${g.formations}-${g.report_start}-${g.report_end}`)).size !== 1) return false
    for (const threshold of [.5, 1, 2]) {
      const actualTotals = compared.flatMap(g => g.models.map(m => { const t = m.thresholds.find(t => t.threshold === threshold)!; return t.true_positive + t.false_negative }))
      if (new Set(actualTotals).size !== 1) return false
    }
  }
  const q = d.qualification
  return !!q && q.return_qualified === false && count(q.candidate_count) && q.candidate_count > 0 && count(q.interval_observations) && [q.entry_missing, q.exit_missing, q.industry_missing].every(v => count(v) && v <= q.candidate_count)
}
