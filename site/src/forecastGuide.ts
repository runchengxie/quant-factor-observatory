import type { BilingualText } from './studyExploration'

export type ForecastInterval = { block_quarters: number; lower: number | null; upper: number | null }
export type ForecastModel = { id: string; mean_rank_ic: number | null; mean_gain: number | null; paired_formations: number; win_fraction: number | null; intervals: ForecastInterval[]; annual: { year: number; formations: number; mean_gain: number | null }[] }
export type ForecastGroup = { target: string; horizon: number; rows: number; report_start: string; report_end: string; models: ForecastModel[] }
export type ChangeModel = { id: string; mae: number | null; rank_ic: number | null; direction_accuracy: number | null; negative_share: number | null; deterioration_precision: number | null; deterioration_recall: number | null; gain_vs_zero: number | null; gain_vs_seasonal: number | null }
export type ChangeGroup = { target: string; horizon: number; rows: number; formations: number; models: ChangeModel[] }
export type ReturnGroup = { width: number; periods: number; dates: string[]; wealth: number[]; drawdown: number[]; total_return: number; max_drawdown: number; archived_max_drawdown: number; average_turnover: number; average_cost_drag: number }
export type ForecastGuideData = { schema_version: string; source_ids: string[]; reviewed_at: string; paragraphs: BilingualText[]; groups: ForecastGroup[]; change_groups: ChangeGroup[]; returns: ReturnGroup[] }

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const numeric = (v: unknown) => v === null || finite(v)
const count = (v: unknown) => finite(v) && Number.isInteger(v) && v >= 0
const rate = (v: unknown) => v === null || (finite(v) && v >= 0 && v <= 1)
const date = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v))
const unique = (values: unknown[]) => new Set(values).size === values.length
const targets = ['roa', 'margin', 'growth', 'cash_conversion']
const models = ['persistence', 'ridge', 'pointwise', 'pairwise', 'listwise']
const changeModels = ['zero', 'seasonal', 'level_ridge', 'delta_ridge', 'level_xgb', 'delta_xgb']

function intervals(values: ForecastInterval[]) {
  return Array.isArray(values) && values.length === 2 && unique(values.map(i => i?.block_quarters)) && values.every(i => i && [4, 8].includes(i.block_quarters) && numeric(i.lower) && numeric(i.upper) && (i.lower === null ? i.upper === null : i.upper !== null && i.lower <= i.upper))
}

function forecastGroup(g: ForecastGroup) {
  if (!g || !targets.includes(g.target) || ![1, 2, 4].includes(g.horizon) || !count(g.rows) || !date(g.report_start) || !date(g.report_end) || g.report_start > g.report_end || !Array.isArray(g.models) || g.models.length !== 5 || !unique(g.models.map(m => m?.id))) return false
  const firstYear = Number(g.report_start.slice(0, 4)), lastYear = Number(g.report_end.slice(0, 4))
  if (firstYear < 1900 || lastYear > 2100 || lastYear - firstYear > 100) return false
  return g.models.every(m => m && models.includes(m.id) && numeric(m.mean_rank_ic) && numeric(m.mean_gain) && count(m.paired_formations) && rate(m.win_fraction) && intervals(m.intervals) && Array.isArray(m.annual) && m.annual.length > 0 && m.annual.every((a, index) => a && count(a.year) && a.year >= firstYear && a.year <= lastYear && (index === 0 || a.year > m.annual[index - 1].year) && count(a.formations) && numeric(a.mean_gain)))
}

function changeGroup(g: ChangeGroup) {
  return g && ['roa', 'margin'].includes(g.target) && [1, 4].includes(g.horizon) && count(g.rows) && count(g.formations) && Array.isArray(g.models) && g.models.length === 6 && unique(g.models.map(m => m?.id)) && g.models.every(m => m && changeModels.includes(m.id) && [m.mae, m.rank_ic, m.gain_vs_zero, m.gain_vs_seasonal].every(numeric) && [m.direction_accuracy, m.negative_share, m.deterioration_precision, m.deterioration_recall].every(rate))
}

function returnGroup(g: ReturnGroup) {
  return g && [10, 20, 30, 50, 100].includes(g.width) && count(g.periods) && g.periods > 0 && Array.isArray(g.dates) && g.dates.length === g.periods + 1 && g.dates.every((d, i) => date(d) && (i === 0 || d > g.dates[i - 1])) && Array.isArray(g.wealth) && g.wealth.length === g.dates.length && g.wealth[0] === 1 && g.wealth.every(v => finite(v) && v >= 0) && Array.isArray(g.drawdown) && g.drawdown.length === g.dates.length && g.drawdown[0] === 0 && g.drawdown.every(v => finite(v) && v >= -1 && v <= 0) && [g.total_return, g.max_drawdown, g.archived_max_drawdown, g.average_turnover, g.average_cost_drag].every(finite)
}

export function isForecastGuide(value: unknown): value is ForecastGuideData {
  if (!value || typeof value !== 'object') return false
  const d = value as ForecastGuideData
  if (d.schema_version !== 'observatory.forecast_guide.v1' || !date(d.reviewed_at) || !Array.isArray(d.source_ids) || !d.source_ids.length || !d.source_ids.every(s => typeof s === 'string') || !unique(d.source_ids)) return false
  if (!Array.isArray(d.paragraphs) || !d.paragraphs.length || !d.paragraphs.every(p => p && typeof p['en-US'] === 'string' && typeof p['zh-CN'] === 'string')) return false
  if (!Array.isArray(d.groups) || d.groups.length !== 12 || !d.groups.every(forecastGroup) || !unique(d.groups.map(g => `${g.target}-${g.horizon}`))) return false
  if (!Array.isArray(d.change_groups) || d.change_groups.length !== 4 || !d.change_groups.every(changeGroup) || !unique(d.change_groups.map(g => `${g.target}-${g.horizon}`))) return false
  return Array.isArray(d.returns) && d.returns.length === 5 && d.returns.every(returnGroup) && unique(d.returns.map(g => g.width))
}
