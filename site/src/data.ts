import { DataLoadError } from './dataErrors'
import type { Alpha810Snapshot, FundamentalCatalog, FundamentalSnapshot, RdAnnualEvidence, Snapshot, StudyCatalog } from './types'
import { parseRiskHistory, type RiskHistory } from './riskHistory'

const required = ['schema_version', 'generated_at', 'source', 'datasets', 'factor_groups', 'factors', 'series', 'cross_section', 'jump_decomposition'] as const
const fundamentalRequired = ['schema_version', 'source', 'vintage', 'coverage', 'latest_cross_section', 'validation', 'series', 'notes'] as const
const alpha810Required = ['kind', 'schema_version', 'generated_at', 'data_version', 'code_revision', 'dataset', 'config', 'factors', 'quality', 'public_limits'] as const

export async function loadSnapshot(): Promise<Snapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/factor-snapshot.json`)
  if (!response.ok) throw new DataLoadError('snapshotLoad', { status: response.status })
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object') throw new DataLoadError('snapshotFormat')
  for (const key of required) if (!(key in value)) throw new DataLoadError('snapshotField', { field: key })
  return value as Snapshot
}

export async function loadRiskHistory(): Promise<RiskHistory | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/risk-history.json`)
    if (!response.ok) return null
    return parseRiskHistory(await response.json())
  } catch {
    return null
  }
}

export function findSeries(snapshot: Snapshot, ticker: string, metric: string) {
  return snapshot.series.find((item) => item.ticker === ticker && item.metric === metric)
}

export async function loadFundamentalData(): Promise<{ catalog: FundamentalCatalog; snapshot: FundamentalSnapshot }> {
  const base = import.meta.env.BASE_URL
  const [catalogResponse, snapshotResponse] = await Promise.all([
    fetch(`${base}data/fundamental-factor-catalog.json`),
    fetch(`${base}data/fundamental-snapshot.json`),
  ])
  if (!catalogResponse.ok || !snapshotResponse.ok) throw new DataLoadError('fundamentalLoad')
  const catalogValue: unknown = await catalogResponse.json()
  const snapshotValue: unknown = await snapshotResponse.json()
  if (!catalogValue || typeof catalogValue !== 'object' || !Array.isArray((catalogValue as { factors?: unknown }).factors)) throw new DataLoadError('fundamentalCatalogFormat')
  if (!snapshotValue || typeof snapshotValue !== 'object') throw new DataLoadError('fundamentalFormat')
  for (const key of fundamentalRequired) if (!(key in snapshotValue)) throw new DataLoadError('fundamentalField', { field: key })
  return { catalog: catalogValue as FundamentalCatalog, snapshot: snapshotValue as FundamentalSnapshot }
}

export async function loadStudies(): Promise<StudyCatalog> {
  const base = import.meta.env.BASE_URL
  const response = await fetch(`${base}data/research-studies.json`)
  if (!response.ok) throw new DataLoadError('studiesLoad', { status: response.status })
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object' || !Array.isArray((value as { studies?: unknown }).studies)) {
    throw new DataLoadError('studiesFormat')
  }
  return value as StudyCatalog
}

export async function loadRdAnnualEvidence(): Promise<RdAnnualEvidence> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/rd-investment-annual.json`)
  if (!response.ok) throw new DataLoadError('annualLoad', { status: response.status })
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object') throw new DataLoadError('annualFormat')
  const candidate = value as Partial<RdAnnualEvidence>
  if (!Array.isArray(candidate.series) || typeof candidate.source_vintage !== 'string') {
    throw new DataLoadError('annualFields')
  }
  if (candidate.publication_status !== 'legacy_unaligned_diagnostic') {
    throw new DataLoadError('annualStatus')
  }
  for (const series of candidate.series) {
    if (!Array.isArray(series.years) || !['fwd20', 'fwd220'].includes(series.horizon)) {
      throw new DataLoadError('annualSeries')
    }
  }
  return candidate as RdAnnualEvidence
}

export async function loadAlpha810Snapshot(): Promise<Alpha810Snapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/alpha810-snapshot.json`)
  if (!response.ok) throw new DataLoadError('alphaLoad', { status: response.status })
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object') throw new DataLoadError('alphaFormat')
  for (const key of alpha810Required) if (!(key in value)) throw new DataLoadError('alphaField', { field: key })
  const candidate = value as { kind?: unknown; schema_version?: unknown; factors?: unknown }
  if (candidate.kind !== 'moneytree_factor_evidence_snapshot' || !['1.0', '1.1', '1.2'].includes(String(candidate.schema_version))) {
    throw new DataLoadError('alphaVersion')
  }
  if (!Array.isArray(candidate.factors)) throw new DataLoadError('alphaFactors')
  if (candidate.schema_version === '1.1' || candidate.schema_version === '1.2') {
    const diagnostics = value as Record<string, unknown>
    for (const key of ['uncertainty', 'temporal_validation', 'multiple_testing']) {
      if (!diagnostics[key] || typeof diagnostics[key] !== 'object') {
        throw new DataLoadError('alphaDiagnostic', { field: key })
      }
    }
  }
  if (candidate.schema_version === '1.2') {
    const diagnostics = value as Record<string, unknown>
    if (!diagnostics.inference_sensitivity || typeof diagnostics.inference_sensitivity !== 'object') {
      throw new DataLoadError('alphaSensitivity')
    }
  }
  return value as Alpha810Snapshot
}
