import type { Locale } from './i18n'

const EN = {
  "snapshotLoad": "Cannot load research snapshot (HTTP {status})",
  "snapshotFormat": "Invalid research snapshot format",
  "snapshotField": "Research snapshot is missing field: {field}",
  "fundamentalLoad": "Cannot load fundamental research data",
  "fundamentalCatalogFormat": "Invalid fundamental factor catalog format",
  "fundamentalFormat": "Invalid fundamental research snapshot format",
  "fundamentalField": "Fundamental research snapshot is missing field: {field}",
  "studiesLoad": "Cannot load research studies (HTTP {status})",
  "studiesFormat": "Invalid research study data format",
  "annualLoad": "Cannot load annual R&D factor evidence (HTTP {status})",
  "annualFormat": "Invalid annual R&D factor evidence format",
  "annualFields": "Annual R&D factor evidence is missing series or source vintage",
  "annualStatus": "Unsupported annual R&D factor evidence status",
  "annualSeries": "Invalid annual R&D factor series format",
  "alphaLoad": "Cannot load Alpha 810 research snapshot (HTTP {status})",
  "alphaFormat": "Invalid Alpha 810 research snapshot format",
  "alphaField": "Alpha 810 snapshot is missing field: {field}",
  "alphaVersion": "Unsupported Alpha 810 snapshot version",
  "alphaFactors": "Invalid Alpha 810 factor evidence format",
  "alphaDiagnostic": "Alpha 810 v1.1 is missing a valid {field} diagnostic field",
  "alphaSensitivity": "Alpha 810 v1.2 is missing a valid inference_sensitivity diagnostic field"
} as const

type ErrorKey = keyof typeof EN
const ZH: Record<ErrorKey, string> = {
  "snapshotLoad": "无法加载研究快照（HTTP {status}）",
  "snapshotFormat": "研究快照格式无效",
  "snapshotField": "研究快照缺少字段：{field}",
  "fundamentalLoad": "基本面研究数据未能加载",
  "fundamentalCatalogFormat": "基本面因子目录格式无效",
  "fundamentalFormat": "基本面研究快照格式无效",
  "fundamentalField": "基本面研究快照缺少字段：{field}",
  "studiesLoad": "无法加载研究专题（HTTP {status}）",
  "studiesFormat": "研究专题数据格式无效",
  "annualLoad": "无法加载研发因子年度证据（HTTP {status}）",
  "annualFormat": "研发因子年度证据格式无效",
  "annualFields": "研发因子年度证据缺少序列或来源版本",
  "annualStatus": "研发因子年度证据状态不受支持",
  "annualSeries": "研发因子年度序列格式无效",
  "alphaLoad": "Alpha 810 研究快照未能加载（HTTP {status}）",
  "alphaFormat": "Alpha 810 研究快照格式无效",
  "alphaField": "Alpha 810 快照缺少字段：{field}",
  "alphaVersion": "Alpha 810 快照版本不受支持",
  "alphaFactors": "Alpha 810 因子证据格式无效",
  "alphaDiagnostic": "Alpha 810 v1.1 缺少有效的 {field} 诊断字段",
  "alphaSensitivity": "Alpha 810 v1.2 缺少有效的 inference_sensitivity 诊断字段"
}

export class DataLoadError extends Error {
  constructor(readonly key: ErrorKey, readonly details: Record<string, string | number> = {}) {
    super(interpolate(EN[key], details))
    this.name = 'DataLoadError'
  }
}

function interpolate(template: string, details: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(details[key] ?? match))
}

export function formatDataLoadError(error: Error, locale: Locale): string {
  if (!(error instanceof DataLoadError)) return error.message
  return interpolate((locale === 'zh-CN' ? ZH : EN)[error.key] ?? EN[error.key], error.details)
}
