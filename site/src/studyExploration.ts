import { isForecastGuide, type ForecastGuideData } from './forecastGuide'
import type { Locale } from './i18n'

export type BilingualText = Record<Locale, string>
export type ExplorationStep = { id: string; period: BilingualText; status: string; title: BilingualText; question: BilingualText; finding: BilingualText; decision: BilingualText; source_ids: string[] }
export type ExplorationChart = { id: string; title: BilingualText; metric: BilingualText; context: BilingualText; interpretation: BilingualText; unit: 'number' | 'percent'; categories: BilingualText[]; series: { id: string; label: BilingualText; values: (number | null)[] }[]; source_ids: string[] }
export type StudyExplorationData = { guide?: ForecastGuideData; conclusion_changes?: import("./researchHub").ConclusionChange[]; schema_version: string; study_id: string; source_ref: string; source_revision: string; reviewed_at: string; evidence_stage: string; summary: BilingualText; next_question: BilingualText; sources: { id: string; source_ref: string; label: BilingualText }[]; steps: ExplorationStep[]; charts: ExplorationChart[] }

export function isStudyExploration(value: unknown, studyId: string, sourceRef?: string): value is StudyExplorationData {
  if (!value || typeof value !== 'object') return false
  const data = value as StudyExplorationData
  const text = (v: BilingualText) => v && typeof v['en-US'] === 'string' && typeof v['zh-CN'] === 'string'
  if (data.schema_version !== 'observatory.study_exploration.v1' || data.study_id !== studyId || data.source_ref !== sourceRef) return false
  if (typeof data.source_revision !== 'string' || !/^[0-9a-f]{40}$/.test(data.source_revision) || typeof data.reviewed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.reviewed_at) || typeof data.evidence_stage !== 'string') return false
  if (!text(data.summary) || !text(data.next_question) || !Array.isArray(data.sources) || !Array.isArray(data.steps) || !Array.isArray(data.charts)) return false
  if (!data.sources.length || !data.steps.length || !data.sources.every((s) => s && typeof s.id === 'string' && typeof s.source_ref === 'string' && s.source_ref.startsWith('doc:quant-research.') && text(s.label))) return false
  const sourceIds = new Set(data.sources.map((s) => s.id))
  const sources = (ids: string[]) => Array.isArray(ids) && ids.length > 0 && ids.every((id) => sourceIds.has(id))
  if (sourceIds.size !== data.sources.length) return false
  if (!data.steps.every((s) => s && typeof s.id === 'string' && ['diagnostic', 'protocol', 'pending', 'archive', 'hypothesis'].includes(s.status) && text(s.period) && text(s.title) && text(s.question) && text(s.finding) && text(s.decision) && sources(s.source_ids))) return false
  if (data.conclusion_changes && (!Array.isArray(data.conclusion_changes) || !data.conclusion_changes.every(c => c && typeof c.id === 'string' && typeof c.kind === 'string' && text(c.period) && text(c.before) && text(c.trigger) && text(c.after) && sources(c.source_ids)))) return false
  if (data.guide && (studyId !== 'fundamental-state-forecasting' || !isForecastGuide(data.guide) || !sources(data.guide.source_ids))) return false
  return data.charts.every((c) => c && typeof c.id === 'string' && text(c.title) && text(c.metric) && text(c.context) && text(c.interpretation) && ['number', 'percent'].includes(c.unit) && sources(c.source_ids) && Array.isArray(c.categories) && c.categories.length > 0 && c.categories.every(text) && Array.isArray(c.series) && c.series.length > 0 && c.series.every((s) => s && typeof s.id === 'string' && text(s.label) && Array.isArray(s.values) && s.values.length === c.categories.length && s.values.every((v) => v === null || (typeof v === 'number' && Number.isFinite(v)))))
}
