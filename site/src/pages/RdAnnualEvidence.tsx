import { useState } from 'react'
import { useLocale } from '../i18n'
import { rdAnnualPlainCopy } from '../rdAnnualPlainCopy'
import type { RdAnnualEvidence, RdAnnualSeries } from '../types'

const FACTORS = ['rd_mv', 'rd_mv_resid', 'rd_ev', 'rd_capitalized', 'rd_sales', 'rd_assets', 'rd_growth']

function formatPercent(value: number | null, locale: string) {
  return value === null ? '—' : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

function findSeries(data: RdAnnualEvidence, factor: string, horizon: string): RdAnnualSeries | undefined {
  return data.series.find((item) => item.factor === factor && item.horizon === horizon)
}

export function RdAnnualEvidencePanel({ data }: { data: RdAnnualEvidence }) {
  const { locale, copy } = useLocale()
  const labels = { ...copy.rdAnnual, ...rdAnnualPlainCopy[locale] } as typeof copy.rdAnnual
  const [factor, setFactor] = useState('rd_mv')
  const [horizon, setHorizon] = useState<'fwd20' | 'fwd220'>('fwd20')
  const series = findSeries(data, factor, horizon)
  if (!series) return null

  const values = series.years.flatMap((point) => point.rank_ic === null ? [] : [point.rank_ic])
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const range = max - min || 1
  const plot = { left: 44, right: 790, top: 20, bottom: 188 }
  const y = (value: number) => plot.top + ((max - value) / range) * (plot.bottom - plot.top)
  const zeroY = y(0)
  const step = (plot.right - plot.left) / series.years.length
  const barWidth = Math.min(34, step * 0.54)

  return <section className="panel rd-annual-panel" aria-labelledby="rd-annual-title">
    <div className="section-heading">
      <p className="eyebrow">{labels.eyebrow}</p>
      <h2 id="rd-annual-title">{labels.title}</h2>
      <p className="panel-note">{labels.description}</p>
    </div>
    <div className="rd-annual-boundary">
      <h3>{labels.extensionTitle}</h3>
      <p>{labels.extensionDescription.replace('{vintage}', data.source_vintage).replace('{start}', data.requested_start).replace('{end}', data.market_data_as_of)}</p>
      <p>{labels.publicNotice}</p>
    </div>
    <div className="rd-annual-controls">
      <label>{labels.factorLabel}
        <select aria-label={labels.factorLabel} value={factor} onChange={(event) => setFactor(event.target.value)}>
          {FACTORS.map((key) => <option key={key} value={key}>{labels.factors[key] ?? key}</option>)}
        </select>
      </label>
      <label>{labels.horizonLabel}
        <select aria-label={labels.horizonLabel} value={horizon} onChange={(event) => setHorizon(event.target.value as 'fwd20' | 'fwd220')}>
          <option value="fwd20">{labels.fwd20}</option>
          <option value="fwd220">{labels.fwd220}</option>
        </select>
      </label>
      <span>{labels.signalWindow}: {series.signal_start ?? '—'} – {series.signal_end ?? '—'}</span>
    </div>
    <div className="rd-annual-chart-wrap">
      <svg className="rd-annual-chart" viewBox="0 0 820 232" role="img" aria-labelledby="rd-annual-chart-title rd-annual-chart-desc">
        <title id="rd-annual-chart-title">{labels.chartTitle}</title>
        <desc id="rd-annual-chart-desc">{labels.chartDescription}</desc>
        <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} className="rd-annual-axis" />
        <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} className="rd-annual-axis" />
        <line x1={plot.left} x2={plot.right} y1={zeroY} y2={zeroY} className="rd-annual-zero" />
        {series.years.map((point, index) => {
          const center = plot.left + step * (index + 0.5)
          const valueY = point.rank_ic === null ? zeroY : y(point.rank_ic)
          const rectY = Math.min(valueY, zeroY)
          const rectHeight = Math.max(0, Math.abs(zeroY - valueY))
          const valid = point.rank_ic !== null
          return <g key={point.year}>
            {valid
              ? <rect x={center - barWidth / 2} y={rectY} width={barWidth} height={Math.max(1, rectHeight)} className={point.rank_ic! >= 0 ? 'rd-annual-bar-positive' : 'rd-annual-bar-negative'}>
                <title>{`${point.year}: ${formatPercent(point.rank_ic, locale)}`}</title>
              </rect>
              : <circle cx={center} cy={zeroY} r="4" className="rd-annual-bar-missing"><title>{`${point.year}: ${labels.statuses[point.evidence_status] ?? point.evidence_status}`}</title></circle>}
            <text x={center} y="211" textAnchor="middle" className="rd-annual-year">{point.year}</text>
          </g>
        })}
        <text x="4" y={plot.top + 4} className="rd-annual-axis-label">{formatPercent(max, locale)}</text>
        <text x="4" y={plot.bottom + 4} className="rd-annual-axis-label">{formatPercent(min, locale)}</text>
      </svg>
    </div>
    <p className="rd-annual-measure-note">{labels.measureNote}</p>
    <div className="table-scroll">
      <table className="factor-table rd-annual-table" aria-label={labels.tableLabel}>
        <thead><tr>
          <th>{labels.year}</th><th>{labels.months}</th><th>{labels.rankIc}</th><th>{labels.topBottom}</th>
          <th>{labels.coverage}</th><th>{labels.medianNames}</th><th>{labels.status}</th>
        </tr></thead>
        <tbody>{series.years.map((point) => <tr key={point.year}>
          <td>{point.year}</td><td>{point.cross_sections}</td><td>{formatPercent(point.rank_ic, locale)}</td>
          <td>{formatPercent(point.top_minus_bottom, locale)}</td><td>{formatPercent(point.coverage_mean, locale)}</td>
          <td>{point.median_universe_n === null ? '—' : new Intl.NumberFormat(locale).format(point.median_universe_n)}</td>
          <td>{labels.statuses[point.evidence_status] ?? point.evidence_status}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="panel-note">{labels.overlapNote}</p>
  </section>
}
