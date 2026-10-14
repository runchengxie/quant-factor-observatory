export type RiskMode = 'demo' | 'historical'
export type RiskUrlState = {
  mode: RiskMode
  period?: string
  granularity?: 'monthly' | 'annual'
  metric?: string
  component?: string
  ticker?: string
  date?: string
}
const periodPattern = /^\d{4}(?:-\d{2})?$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const tickerPattern = /^\d{1,6}$/

export function readRiskUrlState(search = window.location.search): Partial<RiskUrlState> {
  const params = new URLSearchParams(search)
  const result: Partial<RiskUrlState> = {}
  const mode = params.get('mode')
  if (mode === 'demo' || mode === 'historical') result.mode = mode
  const period = params.get('period')
  if (period && periodPattern.test(period)) result.period = period
  const granularity = params.get('granularity')
  if (granularity === 'monthly' || granularity === 'annual') result.granularity = granularity
  const metric = params.get('metric')
  if (metric && ['rv_shape_h3', 'rv_shape_h4', 'rv_shape_closeness', 'vol_rv_ts_closeness_60', 'h_daily_close60_ts_h3_60', 'h_daily_close60_ts_h4_60'].includes(metric)) result.metric = metric
  const component = params.get('component')
  if (component && ['pooled', 'large', 'small', 'median', 'prevalence', 'pooled_jump_share', 'pooled_large_jump_share', 'pooled_small_jump_share', 'median_observation_jump_share', 'positive_residual_prevalence'].includes(component)) result.component = component
  const ticker = params.get('ticker')
  if (ticker && tickerPattern.test(ticker)) result.ticker = ticker
  const day = params.get('date')
  if (day && datePattern.test(day) && !Number.isNaN(Date.parse(day + 'T00:00:00Z'))) result.date = day
  return result
}

export function writeRiskUrlState(state: RiskUrlState): void {
  const url = new URL(window.location.href)
  const params = new URLSearchParams()
  params.set('mode', state.mode)
  if (state.mode === 'historical') {
    if (state.period) params.set('period', state.period)
    if (state.granularity) params.set('granularity', state.granularity)
    if (state.component) params.set('component', state.component)
  }
  if (state.metric) params.set('metric', state.metric)
  if (state.mode === 'demo' && state.ticker && tickerPattern.test(state.ticker)) params.set('ticker', state.ticker)
  if (state.mode === 'demo' && state.date && datePattern.test(state.date)) params.set('date', state.date)
  url.search = params.toString()
  window.history.replaceState({}, '', url)
}

export async function copyCurrentUrl(): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(window.location.href)
    return true
  } catch {
    return false
  }
}
