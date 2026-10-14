import { useState } from 'react'
import type { JumpRow } from '../types'
import { useLocale } from '../i18n'
import { shapeExplorationCopy } from '../shapeExplorationCopy'
import { finite, jumpStatus, ratio } from '../shapeExploration'

const parts = ['ivhat', 'rljv', 'rsjv'] as const
const colors = ['#477a76', '#c88b60', '#6d6b9a']
export default function JumpComparison({ rows, onInspect }: { rows: JumpRow[]; onInspect: (row: JumpRow) => void }) {
  const { locale } = useLocale()
  const copy = shapeExplorationCopy[locale]
  const [scale, setScale] = useState('percent')
  const [sort, setSort] = useState('ticker')
  const format = (value: number | null, percent = false) => finite(value) ? new Intl.NumberFormat(locale, percent ? { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumSignificantDigits: 6 }).format(value) : '—'
  const sorted = [...rows].sort((a, b) => {
    const tie = a.ticker.localeCompare(b.ticker) || a.date.localeCompare(b.date)
    if (sort === 'rv') return (finite(b.rv) ? b.rv : -Infinity) - (finite(a.rv) ? a.rv : -Infinity) || tie
    if (sort === 'share') return (jumpStatus(b) === 'valid' ? ratio(b.rjv, b.rv) ?? -Infinity : -Infinity) - (jumpStatus(a) === 'valid' ? ratio(a.rjv, a.rv) ?? -Infinity : -Infinity) || tie
    return tie
  })
  const plotted = sorted.filter(row => jumpStatus(row) === 'valid' && finite(row.rv) && row.rv > 0)
  const max = scale === 'percent' ? 1 : Math.max(...plotted.map(row => row.rv!), 0)
  const height = 50 + plotted.length * 70
  const statusLabel = { valid: copy.passed, invalid: copy.failed, unavailable: copy.unavailable }
  return <section className="panel shape-comparison">
    <h2>{copy.comparison}</h2>
    <div className="exploration-controls">
      <label>{copy.scale}<select value={scale} onChange={event => setScale(event.target.value)}><option value="percent">{copy.percent}</option><option value="absolute">{copy.absolute}</option></select></label>
      <label>{copy.sort}<select value={sort} onChange={event => setSort(event.target.value)}><option value="ticker">{copy.byTicker}</option><option value="rv">{copy.byRv}</option><option value="share">{copy.byShare}</option></select></label>
    </div>
    <p className="panel-note">{copy.checks}: {rows.filter(row => jumpStatus(row) === 'valid').length} / {rows.length} · {scale === 'percent' ? copy.percent : copy.units}</p>
    <div className="chart-legend">{parts.map((part, index) => <span key={part}><i style={{ backgroundColor: colors[index] }} />{part === 'ivhat' ? 'IVhat' : part.toUpperCase()}</span>)}</div>
    {plotted.length > 0 && <div className="table-scroll"><svg className="jump-comparison-svg" viewBox={`0 0 820 ${height}`} role="img" aria-label={copy.comparison}>
      {[0, .25, .5, .75, 1].map(tick => <g key={tick}><line x1={180 + tick * 620} x2={180 + tick * 620} y1="24" y2={height - 24} stroke="var(--rule-soft)" /><text x={180 + tick * 620} y="16" textAnchor={tick === 1 ? 'end' : 'middle'} fill="var(--muted)" fontSize="12">{format(tick * max, scale === 'percent')}</text></g>)}
      {plotted.map((row, index) => <g key={`${row.ticker}|${row.date}`}><text x="8" y={52 + index * 70} fill="var(--ink)" fontSize="14">{row.ticker}</text><text x="8" y={72 + index * 70} fill="var(--muted)" fontSize="12">{row.date}</text>{parts.map((part, partIndex) => {
        const denominator = scale === 'percent' ? row.rv! : 1
        const offset = parts.slice(0, partIndex).reduce((sum, key) => sum + row[key]!, 0) / denominator / max * 620
        return <rect key={part} x={180 + offset} y={35 + index * 70} width={row[part]! / denominator / max * 620} height="34" fill={colors[partIndex]}><title>{row.ticker} · {row.date} · {part}: {format(row[part]! / denominator, scale === 'percent')}</title></rect>
      })}</g>)}
      <line x1="180" x2="180" y1="24" y2={height - 24} stroke="var(--muted)" />
    </svg></div>}
    <p className="panel-note">{copy.chartNote}</p>
    <div className="table-scroll"><table className="factor-table shape-table" aria-label={copy.comparison}><thead><tr>{[copy.ticker, copy.date, 'RV', 'IVhat', 'RJV', 'RLJV', 'RSJV', copy.percent, copy.check, copy.open].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{sorted.map(row => <tr key={`${row.ticker}|${row.date}`}><th scope="row">{row.ticker}</th><td>{row.date}</td>{[row.rv, row.ivhat, row.rjv, row.rljv, row.rsjv].map((value, index) => <td key={index}>{format(value)}</td>)}<td>{jumpStatus(row) === 'valid' ? format(ratio(row.rjv, row.rv), true) : '—'}</td><td>{statusLabel[jumpStatus(row)]}</td><td><button type="button" className="quiet-button" onClick={() => onInspect(row)} aria-label={`${copy.open} ${row.ticker} ${row.date}`}>{copy.open}</button></td></tr>)}</tbody></table></div>
  </section>
}
