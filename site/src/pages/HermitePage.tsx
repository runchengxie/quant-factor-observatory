import { ResearchStudiesLink } from '../components/ResearchExplorationEntries'
import { useEffect, useState } from 'react'
import LineChart from '../components/LineChart'
import ContextStrip from '../components/ContextStrip'
import type { Snapshot } from '../types'
import { useLocale } from '../i18n'
import { explorationCopy } from '../explorationCopy'
import { shapeExplorationCopy } from '../shapeExplorationCopy'
import { alignSeries, finite, summarize } from '../shapeExploration'
import type { RiskHistory, RiskMetricId } from '../riskHistory'
import { riskMetricIds } from '../riskHistory'
import { loadRiskHistory } from '../data'
import { readRiskUrlState, writeRiskUrlState, type RiskMode } from '../shareableUrl'
import RiskModePanel from '../components/RiskModePanel'
import { riskHistoryCopy } from '../riskHistoryCopy'

const metricIds = ['vol_rv_ts_closeness_60', 'h_daily_close60_ts_h3_60', 'h_daily_close60_ts_h4_60']
const colors = ['#b64d33', '#477a76', '#6d6b9a']

function HistoricalHermitePanel({ history, metric, setMetric, granularity, setGranularity, period, setPeriod }: {
  history: RiskHistory
  metric: RiskMetricId
  setMetric: (value: RiskMetricId) => void
  granularity: 'monthly' | 'annual'
  setGranularity: (value: 'monthly' | 'annual') => void
  period: string
  setPeriod: (value: string) => void
}) {
  const { locale } = useLocale()
  const text = riskHistoryCopy[locale]
  const rows = history.shape_history.metrics[metric][granularity]
  const selected = rows.find((row) => row.period === period) ?? rows[rows.length - 1]
  const metricLabels: Record<RiskMetricId, string> = {
    rv_shape_h3: text.h3,
    rv_shape_h4: text.h4,
    rv_shape_closeness: text.closeness,
  }
  const format = (value: number | null) => value === null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(value)
  const windowRows = history.shape_history.window_sensitivity[metric][granularity]
  const tailRows = history.shape_history.tail_sensitivity[metric][granularity]
  const correlationRows = history.shape_history.correlations[metric]
  const pairAt = (pair: { period: string; paired_dates: number; paired_observations: number; mean_daily_rank_correlation: number | null }[]) => pair.find((item) => item.period === selected?.period)
  const window = pairAt(windowRows)
  const tail = pairAt(tailRows)
  return <section className="panel historical-risk-panel">
    <div className="exploration-controls">
      <label>{text.metric}<select aria-label={text.metric} value={metric} onChange={(event) => { const next = event.target.value as RiskMetricId; setMetric(next); const options = history.shape_history.metrics[next][granularity]; setPeriod(options[options.length - 1]?.period ?? '') }}>{Object.entries(metricLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
      <label>{text.granularity}<select aria-label={text.granularity} value={granularity} onChange={(event) => { const next = event.target.value as 'monthly' | 'annual'; setGranularity(next); const options = history.shape_history.metrics[metric][next]; setPeriod(options[options.length - 1]?.period ?? '') }}><option value="monthly">{text.monthly}</option><option value="annual">{text.annual}</option></select></label>
      <label>{text.period}<select aria-label={text.period} value={selected?.period ?? ''} onChange={(event) => setPeriod(event.target.value)}>{rows.map((row) => <option key={row.period}>{row.period}</option>)}</select></label>
    </div>
    <h2>{metricLabels[metric]}</h2>
    {selected && <ContextStrip items={[
      { label: text.valid, value: selected.valid_observations.toLocaleString(locale) },
      { label: text.missing, value: selected.missing_observations.toLocaleString(locale) },
      { label: text.medianMetric, value: format(selected.median) },
      { label: 'P10 / P90', value: format(selected.p10) + ' / ' + format(selected.p90) },
    ]} />}
    <div className="risk-chart">{rows.length ? <LineChart dates={rows.map((row) => row.period)} series={[{ name: metricLabels[metric], values: rows.map((row) => row.median), color: colors[riskMetricIds.indexOf(metric)] }]} /> : <div className="chart-empty">{text.noAsset}</div>}</div>
    <div className="table-scroll"><table className="factor-table shape-table" aria-label={text.metric}><thead><tr><th>{text.period}</th><th>{text.valid}</th><th>{text.missing}</th><th>P10</th><th>{text.medianMetric}</th><th>P90</th></tr></thead><tbody>{rows.map((row) => <tr key={row.period}><th scope="row">{row.period}</th><td>{row.valid_observations.toLocaleString(locale)}</td><td>{row.missing_observations.toLocaleString(locale)}</td><td>{format(row.p10)}</td><td>{format(row.median)}</td><td>{format(row.p90)}</td></tr>)}</tbody></table></div>
    {selected && <div className="detail-grid">
      <section className="panel"><h3>{text.sensitivity}</h3><p>{text.pairedDates}: {window?.paired_dates.toLocaleString(locale) ?? '—'}</p><p>{text.pairedObs}: {window?.paired_observations.toLocaleString(locale) ?? '—'}</p><strong>{format(window?.mean_daily_rank_correlation ?? null)}</strong></section>
      <section className="panel"><h3>{text.tailSensitivity}</h3><p>{text.pairedDates}: {tail?.paired_dates.toLocaleString(locale) ?? '—'}</p><p>{text.pairedObs}: {tail?.paired_observations.toLocaleString(locale) ?? '—'}</p><strong>{format(tail?.mean_daily_rank_correlation ?? null)}</strong></section>
    </div>}
    <section className="panel"><h3>{text.correlations}</h3><div className="table-scroll"><table className="factor-table"><thead><tr><th>{text.reference}</th><th>{text.pairedDates}</th><th>{text.pairedObs}</th><th>{text.meanSpearman}</th></tr></thead><tbody>{Object.entries(correlationRows).map(([name, pair]) => { const item = pairAt(pair[granularity]); return <tr key={name}><th scope="row">{name}</th><td>{item?.paired_dates.toLocaleString(locale) ?? '—'}</td><td>{item?.paired_observations.toLocaleString(locale) ?? '—'}</td><td>{format(item?.mean_daily_rank_correlation ?? null)}</td></tr> })}</tbody></table></div></section>
    <p className="panel-note">{text.limit} {history.limitations[locale].join(' ')}</p>
  </section>
}

export default function HermitePage({ snapshot, riskHistory }: { snapshot: Snapshot; riskHistory: RiskHistory | null }) {
  const { locale } = useLocale()
  const copy = explorationCopy[locale].hermite
  const labels = shapeExplorationCopy[locale]
  const format = (value: number | null) => finite(value) ? new Intl.NumberFormat(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value) : '—'
  const available = metricIds.filter(id => snapshot.series.some(item => item.metric === id))
  const initialUrl = readRiskUrlState()
  const [metric, setMetric] = useState(available.includes(initialUrl.metric ?? '') ? initialUrl.metric! : available[0] ?? '')
  const activeMetric = available.includes(metric) ? metric : available[0] ?? ''
  const sourceSeries = snapshot.series.filter(item => item.metric === activeMetric)
  const tickers = [...new Set(sourceSeries.map(item => item.ticker))]
  const [ticker, setTicker] = useState(initialUrl.ticker && tickers.includes(initialUrl.ticker) ? initialUrl.ticker : tickers[0] ?? '')
  const activeTicker = tickers.includes(ticker) ? ticker : tickers[0] ?? ''
  const [compare, setCompare] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState(initialUrl.date ?? '')
  const [history, setHistory] = useState(riskHistory)
  const [mode, setMode] = useState<RiskMode>(initialUrl.mode ?? 'demo')
  const initialHistoricalMetric = riskMetricIds.includes(initialUrl.metric as RiskMetricId) ? initialUrl.metric as RiskMetricId : 'rv_shape_h3'
  const [historicalMetric, setHistoricalMetric] = useState<RiskMetricId>(initialHistoricalMetric)
  const [granularity, setGranularity] = useState<'monthly' | 'annual'>(initialUrl.granularity ?? 'monthly')
  const [period, setPeriod] = useState(initialUrl.period ?? '')
  const invalidRange = !!start && !!end && start > end
  const { dates, series } = alignSeries(compare ? sourceSeries : sourceSeries.filter(item => item.ticker === activeTicker), start, end)
  const metricCopy = copy.metrics[activeMetric]
  const fullDates = [...new Set(sourceSeries.flatMap(item => item.dates))].sort()
  const historicalRows = history?.shape_history.metrics[historicalMetric][granularity] ?? []
  const activePeriod = historicalRows.some((item) => item.period === period) ? period : historicalRows[historicalRows.length - 1]?.period ?? ''
  useEffect(() => {
    writeRiskUrlState({ mode, granularity, period: mode === 'historical' ? activePeriod : undefined, metric: mode === 'historical' ? historicalMetric : activeMetric, ticker: activeTicker, date: end || fullDates[fullDates.length - 1] })
  }, [mode, granularity, activePeriod, historicalMetric, activeTicker, end, fullDates])
  const onMode = (next: RiskMode) => {
    setMode(next)
    if (next === 'historical' && !history) void loadRiskHistory().then(setHistory)
  }

  if (mode === 'historical') return <main className="page shape-page">
    <a className="back" href={import.meta.env.BASE_URL}>{copy.back}</a>
    <ResearchStudiesLink />
    <section className="detail-head"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p><span className="badge">{riskHistoryCopy[locale].archived}</span></section>
    <RiskModePanel mode={mode} onMode={onMode} unavailable={!history} onRetry={() => { void loadRiskHistory().then(setHistory) }} />
    {history && <><HistoricalHermitePanel history={history} metric={historicalMetric} setMetric={setHistoricalMetric} granularity={granularity} setGranularity={setGranularity} period={activePeriod} setPeriod={setPeriod} /><p className="panel-note"><a href={import.meta.env.BASE_URL + 'quality'}>{riskHistoryCopy[locale].source}</a> · <a href={import.meta.env.BASE_URL + 'studies'}>{riskHistoryCopy[locale].studies}</a></p></>}
  </main>

  return <main className="page shape-page">
    <a className="back" href={import.meta.env.BASE_URL}>{copy.back}</a>
    <ResearchStudiesLink />
    <section className="detail-head"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p><span className="badge">{snapshot.source === 'demo' ? copy.demo : snapshot.source}</span></section>
    <RiskModePanel mode={mode} onMode={onMode} />
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
