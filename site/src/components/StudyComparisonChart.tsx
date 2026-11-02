import type { Locale } from '../i18n'
import type { ExplorationChart } from '../studyExploration'

const colors = ['var(--study-series-1, #315b74)', 'var(--study-series-2, #b64d33)', 'var(--study-series-3, #33796c)', 'var(--study-series-4, #967326)', 'var(--study-series-5, #795a94)']
export function formatStudyValue(value: number | null, chart: ExplorationChart, locale: Locale) {
  return value === null ? '—' : new Intl.NumberFormat(locale, chart.unit === 'percent' ? { style: 'percent', maximumFractionDigits: 2 } : { maximumFractionDigits: chart.series.some(s => s.lower) ? 5 : 3 }).format(value)
}

export function formatStudyEvidence(series: ExplorationChart['series'][number], index: number, chart: ExplorationChart, locale: Locale) {
  if (!series.months) return ''
  const months = series.months[index]
  const low = series.lower?.[index], high = series.upper?.[index]
  const interval = low != null && high != null ? `[${formatStudyValue(low, chart, locale)}, ${formatStudyValue(high, chart, locale)}]` : (locale === 'zh-CN' ? '未估计' : 'not estimated')
  return locale === 'zh-CN' ? `有效${months}个月，95％区间${interval}` : `${months} months; 95% interval ${interval}`
}

export default function StudyComparisonChart({ chart, locale }: { chart: ExplorationChart; locale: Locale }) {
  const values = chart.series.flatMap((s) => [...s.values, ...(s.lower ?? []), ...(s.upper ?? [])].filter((v): v is number => v !== null))
  const low = Math.min(0, ...values), high = Math.max(0, ...values)
  const pad = (high - low || 1) * .12
  const min = low < 0 ? low - pad : 0, max = high + pad
  const left = 240, right = 820, row = Math.max(64, chart.series.length * 18 + 20)
  const height = 48 + chart.categories.length * row
  const x = (v: number) => left + (v - min) / (max - min) * (right - left)
  const truncate = (v: string) => v.length > 31 ? `${v.slice(0, 29)}…` : v
  return <div className="study-comparison-chart">
    <div className="study-chart-legend">{chart.series.map((s, index) => <span key={s.id}><i style={{ background: colors[index % colors.length] }} />{s.label[locale]}</span>)}</div>
    <div className="study-chart-scroll"><svg className="study-exploration-svg" role="img" aria-label={`${chart.title[locale]} · ${chart.metric[locale]}`} viewBox={`0 0 920 ${height}`}>
      <title>{chart.title[locale]}</title><desc>{chart.context[locale]} {chart.interpretation[locale]}</desc>
      {Array.from({ length: 5 }, (_, i) => { const v = min + (max - min) * i / 4; return <g key={i}><line x1={x(v)} x2={x(v)} y1={30} y2={height - 10} className="study-chart-grid" /><text x={x(v)} y={19} textAnchor="middle" className="study-chart-label">{formatStudyValue(v, chart, locale)}</text></g> })}
      <line x1={x(0)} x2={x(0)} y1={30} y2={height - 10} className="study-chart-zero" />
      {chart.categories.map((category, i) => <g key={i}>
        <text x={left - 15} y={40 + i * row + row / 2} textAnchor="end" className="study-chart-label"><title>{category[locale]}</title>{truncate(category[locale])}</text>
        {chart.series.map((s, j) => { const v = s.values[i]; const lower = s.lower?.[i], upper = s.upper?.[i]; const y = 40 + i * row + j * 18; return <g key={s.id}>
          {v === null ? <text x={x(0) + 8} y={y + 10} className="study-chart-label">—</text> : <>
            <rect x={Math.min(x(v), x(0))} y={y} width={Math.max(1, Math.abs(x(v) - x(0)))} height={12} fill={colors[j % colors.length]}><title>{category[locale]} · {s.label[locale]} · {formatStudyValue(v, chart, locale)} {formatStudyEvidence(s, i, chart, locale)}</title></rect>
            {lower != null && upper != null && <g className="study-uncertainty" stroke="currentColor" strokeWidth={1.5}><title>{formatStudyEvidence(s, i, chart, locale)}</title><line x1={x(lower)} x2={x(upper)} y1={y + 6} y2={y + 6} /><line x1={x(lower)} x2={x(lower)} y1={y + 2} y2={y + 10} /><line x1={x(upper)} x2={x(upper)} y1={y + 2} y2={y + 10} /></g>}
            <text x={x(v >= 0 ? Math.max(v, upper ?? v) : Math.min(v, lower ?? v)) + (v >= 0 ? 6 : -6)} y={y + 10} textAnchor={v >= 0 ? 'start' : 'end'} className="study-chart-value">{formatStudyValue(v, chart, locale)}</text>
          </>}
        </g> })}
      </g>)}
    </svg></div>
  </div>
}
