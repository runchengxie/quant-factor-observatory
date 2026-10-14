import { useState } from 'react'
import LineChart from '../components/LineChart'
import ContextStrip from '../components/ContextStrip'
import type { Snapshot } from '../types'
import { useLocale } from '../i18n'
import { explorationCopy } from '../explorationCopy'
import { shapeExplorationCopy } from '../shapeExplorationCopy'
import { alignSeries, finite, summarize } from '../shapeExploration'

const metricIds = ['vol_rv_ts_closeness_60', 'h_daily_close60_ts_h3_60', 'h_daily_close60_ts_h4_60']
const colors = ['#b64d33', '#477a76', '#6d6b9a']

export default function HermitePage({ snapshot }: { snapshot: Snapshot }) {
  const { locale } = useLocale()
  const copy = explorationCopy[locale].hermite
  const labels = shapeExplorationCopy[locale]
  const format = (value: number | null) => finite(value) ? new Intl.NumberFormat(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value) : '—'
  const available = metricIds.filter(id => snapshot.series.some(item => item.metric === id))
  const [metric, setMetric] = useState(available[0] ?? '')
  const activeMetric = available.includes(metric) ? metric : available[0] ?? ''
  const sourceSeries = snapshot.series.filter(item => item.metric === activeMetric)
  const tickers = [...new Set(sourceSeries.map(item => item.ticker))]
  const [ticker, setTicker] = useState(tickers[0] ?? '')
  const activeTicker = tickers.includes(ticker) ? ticker : tickers[0] ?? ''
  const [compare, setCompare] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const invalidRange = !!start && !!end && start > end
  const { dates, series } = alignSeries(compare ? sourceSeries : sourceSeries.filter(item => item.ticker === activeTicker), start, end)
  const metricCopy = copy.metrics[activeMetric]
  const fullDates = [...new Set(sourceSeries.flatMap(item => item.dates))].sort()

  return <main className="page shape-page">
    <a className="back" href={import.meta.env.BASE_URL}>{copy.back}</a>
    <section className="detail-head"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p><span className="badge">{snapshot.source === 'demo' ? copy.demo : snapshot.source}</span></section>
    <section className="panel research-verdict"><h2>{copy.conclusionLabel}</h2><p className="lede">{copy.conclusion}</p><p className="panel-note">{copy.boundary}</p></section>
    <ContextStrip items={[
      { label: copy.coverage, value: `${fullDates[0] ?? '—'} → ${fullDates[fullDates.length - 1] ?? '—'}` },
      { label: labels.selectedTickers, value: `${series.length} · ${series.map(item => item.ticker).join(', ') || '—'}` },
      { label: labels.sampleDates, value: `${dates.length}` },
    ]} />
    <section className="panel chart-panel exploration-panel">
      <div className="exploration-controls">
        <label>{copy.metric}<select aria-label={copy.metric} value={activeMetric} onChange={event => setMetric(event.target.value)}>{available.map(id => <option key={id} value={id}>{copy.metrics[id].label}</option>)}</select></label>
        <label>{copy.ticker}<select aria-label={copy.ticker} value={activeTicker} disabled={compare} onChange={event => setTicker(event.target.value)}>{tickers.map(item => <option key={item}>{item}</option>)}</select></label>
        <label>{labels.start}<input type="date" value={start} onChange={event => setStart(event.target.value)} /></label>
        <label>{labels.end}<input type="date" value={end} onChange={event => setEnd(event.target.value)} /></label>
        <button type="button" className="quiet-button" onClick={() => { setStart(''); setEnd('') }}>{labels.reset}</button>
        <label className="shape-checkbox"><input type="checkbox" checked={compare} onChange={event => setCompare(event.target.checked)} />{labels.compare}</label>
      </div>
      {invalidRange ? <p role="alert">{labels.invalidRange}</p> : series.length && dates.length && metricCopy ? <>
        <div className="section-heading"><p className="eyebrow">{copy.series} · {activeMetric}</p><h2>{metricCopy.title}</h2><p className="panel-note">{metricCopy.description}</p></div>
        <div className="shape-trend">{series.some(item => item.values.some(finite)) ? <LineChart dates={dates} showLegend series={series.map(item => ({ name: item.ticker, values: item.values, color: colors[tickers.indexOf(item.ticker) % colors.length] }))} /> : <div className="chart-empty">{copy.noSeries}</div>}</div>
        <p className="chart-caption">{dates[0]} → {dates[dates.length - 1]} · {dates.length} {labels.sampleDates}</p>
        <h3>{labels.summary}</h3>
        <div className="table-scroll"><table className="factor-table shape-table" aria-label={labels.summary}><thead><tr>{[labels.ticker, labels.valid, labels.missing, labels.median, labels.min, labels.max].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{series.map(item => { const stats = summarize(item.values); return <tr key={item.ticker}><th scope="row">{item.ticker}</th><td>{stats.count} / {dates.length}</td><td>{stats.missing}</td><td>{format(stats.median)}</td><td>{format(stats.min)}</td><td>{format(stats.max)}</td></tr> })}</tbody></table></div>
        <p className="panel-note">{labels.dataNote}</p>
        <details className="shape-details"><summary>{labels.daily}</summary><div className="table-scroll shape-values"><table className="factor-table shape-table" aria-label={labels.daily}><thead><tr><th scope="col">{labels.date}</th>{series.map(item => <th key={item.ticker} scope="col">{item.ticker}</th>)}</tr></thead><tbody>{dates.map((date, index) => <tr key={date}><th scope="row">{date}</th>{series.map(item => <td key={item.ticker}>{format(item.values[index])}</td>)}</tr>)}</tbody></table></div></details>
      </> : <div className="chart-empty">{copy.noSeries}</div>}
      {snapshot.source === 'demo' && <p className="panel-note">{labels.demoCalendar}</p>}
    </section>
    <section className="panel shape-next"><h2>{labels.nextTitle}</h2><p>{labels.hermiteNext}</p><p className="panel-note">{labels.source}: {snapshot.source} · {labels.generated}: {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(snapshot.generated_at))} (Asia/Shanghai)</p></section>
  </main>
}
