export const riskMetricIds = ['rv_shape_h3', 'rv_shape_h4', 'rv_shape_closeness'] as const
export type RiskMetricId = (typeof riskMetricIds)[number]
export type RiskGranularity = 'monthly' | 'annual'

export type RiskPeriod = {
  period: string
  observed_dates: number
  sampled_securities: number
  eligible_stock_days: number
  excluded_stock_days: number
  pooled_jump_share: number | null
  pooled_large_jump_share: number | null
  pooled_small_jump_share: number | null
  median_observation_jump_share: number | null
  positive_residual_prevalence: number | null
  partial_period: boolean
}
export type RiskDistribution = {
  period: string
  valid_observations: number
  missing_observations: number
  median: number | null
  p10: number | null
  p90: number | null
}
export type RiskPairRow = {
  period: string
  paired_dates: number
  paired_observations: number
  mean_daily_rank_correlation: number | null
  weighting: string
}
export type RiskPair = {
  paired_dates: number
  paired_observations: number
  monthly: RiskPairRow[]
  annual: RiskPairRow[]
}
export type RiskHistory = {
  kind: 'observatory.risk_history'
  schema_version: '1.0'
  source: {
    source_id: string
    source_note_id: string
    source_hashes: Record<string, string>
    producer_repository: string
    producer_revision: string
    review_date: string
    evidence_stage: string
  }
  coverage: {
    date_start: string
    date_end: string
    observed_dates: number
    sampled_securities: number
    aligned_stock_days: number
    point_in_time_qualified: false
    units: string
  }
  definitions: Record<string, Record<string, string>>
  quality: {
    grid_stock_days: number
    complete_risk_observations: number
    missing_value_count: number
    nonfinite_value_count: number
    negative_risk_value_count: number
    zero_rv_count: number
    raw_ivhat_above_rv_count: number
    raw_ivhat_rjv_reconciliation_failures: number
    rjv_rljv_rsjv_reconciliation_failures: number
    eligible_stock_days: number
    excluded_stock_days: number
    panels: Record<string, { valid_values: number; missing_values: number; nonfinite_values: number; negative_risk_values?: number }>
  }
  jump_history: { monthly: RiskPeriod[]; annual: RiskPeriod[] }
  shape_history: {
    metrics: Record<RiskMetricId, { valid_observations: number; missing_observations: number; monthly: RiskDistribution[]; annual: RiskDistribution[] }>
    window_sensitivity: Record<RiskMetricId, RiskPair>
    tail_sensitivity: Record<RiskMetricId, RiskPair>
    correlations: Record<RiskMetricId, Record<string, RiskPair & { weighting: string }>>
  }
  limitations: Record<'en-US' | 'zh-CN', string[]>
}

const panelIds = ['realized_variance', 'ivhat', 'rjv', 'rljv', 'rsjv', 'realized_skewness', 'realized_kurtosis']
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const hasExactKeys = (value: unknown, keys: string[]): value is Record<string, unknown> =>
  isRecord(value) && Object.keys(value).length === keys.length && keys.every((key) => key in value)
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const isRate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
const isNullableNumber = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value))

function validPeriodRows(value: unknown, granularity: 'monthly' | 'annual'): value is RiskPeriod[] {
  const keys = ['period', 'observed_dates', 'sampled_securities', 'eligible_stock_days', 'excluded_stock_days',
    'pooled_jump_share', 'pooled_large_jump_share', 'pooled_small_jump_share',
    'median_observation_jump_share', 'positive_residual_prevalence', 'partial_period']
  const pattern = granularity === 'monthly' ? /^\d{4}-\d{2}$/ : /^\d{4}$/
  return Array.isArray(value) && value.every((row) =>
    hasExactKeys(row, keys) && typeof row.period === 'string' && pattern.test(row.period)
    && ['observed_dates', 'sampled_securities', 'eligible_stock_days', 'excluded_stock_days'].every((key) => isCount(row[key]))
    && ['pooled_jump_share', 'pooled_large_jump_share', 'pooled_small_jump_share', 'median_observation_jump_share', 'positive_residual_prevalence'].every((key) => row[key] === null || isRate(row[key]))
    && typeof row.partial_period === 'boolean')
}

function validDistributionRows(value: unknown): boolean {
  return Array.isArray(value) && value.every((row) => hasExactKeys(
    row, ['period', 'valid_observations', 'missing_observations', 'median', 'p10', 'p90'],
  ) && typeof row.period === 'string' && isCount(row.valid_observations)
    && isCount(row.missing_observations) && isNullableNumber(row.median)
    && isNullableNumber(row.p10) && isNullableNumber(row.p90))
}

function validPair(value: unknown, correlations = false): boolean {
  if (!isRecord(value) || !isCount(value.paired_dates) || !isCount(value.paired_observations)
    || !Array.isArray(value.monthly) || !Array.isArray(value.annual)) return false
  if (correlations && value.weighting !== 'equal_weight_by_date') return false
  return [...value.monthly, ...value.annual].every((row) =>
    hasExactKeys(row, ['period', 'paired_dates', 'paired_observations', 'mean_daily_rank_correlation', 'weighting'])
    && typeof row.period === 'string' && isCount(row.paired_dates) && isCount(row.paired_observations)
    && isNullableNumber(row.mean_daily_rank_correlation) && row.weighting === 'equal_weight_by_date')
}

export function parseRiskHistory(value: unknown): RiskHistory | null {
  if (!hasExactKeys(value, ['kind', 'schema_version', 'source', 'coverage', 'definitions', 'quality', 'jump_history', 'shape_history', 'limitations'])
    || value.kind !== 'observatory.risk_history' || value.schema_version !== '1.0') return null
  const source = value.source
  const coverage = value.coverage
  const quality = value.quality
  const jumps = value.jump_history
  const shape = value.shape_history
  if (!isRecord(source) || !isRecord(coverage) || !isRecord(quality) || !isRecord(jumps) || !isRecord(shape)) return null
  const sourceHashes = source.source_hashes
  if (!hasExactKeys(source, ['source_id', 'source_note_id', 'source_hashes', 'producer_repository', 'producer_revision', 'review_date', 'evidence_stage'])
    || source.source_id !== 'minute-risk.factor-panels.mf_volatility_32.archived'
    || source.source_note_id !== 'doc:quant-research.research.historical-risk-retained-panel-20261014'
    || source.producer_repository !== 'runchengxie/quant-research'
    || typeof source.producer_revision !== 'string' || !/^[a-f0-9]{40}$/.test(source.producer_revision)
    || !hasExactKeys(sourceHashes, panelIds) || panelIds.some((name) => typeof sourceHashes[name] !== 'string' || !/^[a-f0-9]{64}$/.test(sourceHashes[name] as string))) return null
  if (!hasExactKeys(coverage, ['date_start', 'date_end', 'observed_dates', 'sampled_securities', 'aligned_stock_days', 'point_in_time_qualified', 'units'])
    || !isCount(coverage.observed_dates) || !isCount(coverage.sampled_securities)
    || coverage.aligned_stock_days !== coverage.observed_dates * coverage.sampled_securities
    || coverage.point_in_time_qualified !== false || typeof coverage.date_start !== 'string'
    || typeof coverage.date_end !== 'string') return null
  const panels = quality.panels
  const qualityKeys = ['grid_stock_days', 'complete_risk_observations', 'missing_value_count', 'nonfinite_value_count', 'negative_risk_value_count', 'zero_rv_count', 'raw_ivhat_above_rv_count', 'raw_ivhat_rjv_reconciliation_failures', 'rjv_rljv_rsjv_reconciliation_failures', 'eligible_stock_days', 'excluded_stock_days', 'panels']
  if (!hasExactKeys(quality, qualityKeys) || !isCount(quality.grid_stock_days) || quality.grid_stock_days !== coverage.aligned_stock_days
    || !isCount(quality.eligible_stock_days) || !isCount(quality.excluded_stock_days)
    || quality.eligible_stock_days + quality.excluded_stock_days !== quality.grid_stock_days
    || !hasExactKeys(panels, panelIds) || panelIds.some((name) => {
      const panel = panels[name]
      const keys = name === 'realized_skewness' || name === 'realized_kurtosis'
        ? ['valid_values', 'missing_values', 'nonfinite_values']
        : ['valid_values', 'missing_values', 'nonfinite_values', 'negative_risk_values']
      return !hasExactKeys(panel, keys) || !keys.every((key) => isCount(panel[key]))
    })
    || !qualityKeys.filter((key) => key !== 'panels').every((key) => isCount(quality[key]))) return null
  if (!hasExactKeys(jumps, ['monthly', 'annual'])
    || !validPeriodRows(jumps.monthly, 'monthly') || !validPeriodRows(jumps.annual, 'annual')) return null
  if (!hasExactKeys(shape, ['metrics', 'window_sensitivity', 'tail_sensitivity', 'correlations'])) return null
  for (const group of ['metrics', 'window_sensitivity', 'tail_sensitivity', 'correlations']) {
    const members = shape[group]
    if (!hasExactKeys(members, [...riskMetricIds])) return null
  }
  const metricRows = shape.metrics as Record<RiskMetricId, unknown>
  const windows = shape.window_sensitivity as Record<RiskMetricId, unknown>
  const tails = shape.tail_sensitivity as Record<RiskMetricId, unknown>
  const correlations = shape.correlations as Record<RiskMetricId, unknown>
  for (const id of riskMetricIds) {
    const metric = metricRows[id]
    if (!hasExactKeys(metric, ['valid_observations', 'missing_observations', 'monthly', 'annual'])
      || !isCount(metric.valid_observations) || !isCount(metric.missing_observations)
      || !validDistributionRows(metric.monthly) || !validDistributionRows(metric.annual)
      || !validPair(windows[id]) || !validPair(tails[id])) return null
    const references = correlations[id]
    if (!hasExactKeys(references, ['realized_variance', 'realized_skewness', 'realized_kurtosis'])
      || Object.values(references).some((pair) => !validPair(pair, true))) return null
  }
  if (!hasExactKeys(value.limitations, ['en-US', 'zh-CN'])
    || !Array.isArray(value.limitations['en-US']) || !Array.isArray(value.limitations['zh-CN'])) return null
  return value as unknown as RiskHistory
}
