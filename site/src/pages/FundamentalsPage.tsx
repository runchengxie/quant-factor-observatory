import { ResearchStudiesLink } from '../components/ResearchExplorationEntries'
import { useMemo, useState } from 'react'
import DeferredLineChart from '../components/DeferredLineChart'
import DeferredBarChart from '../components/DeferredBarChart'
import ContextStrip from '../components/ContextStrip'
import type { FundamentalCatalog, FundamentalSnapshot } from '../types'
import { useLocale } from '../i18n'
import { localizeFundamentalFactor } from '../researchLocale'
import { explorationCopy } from '../explorationCopy'

const colors = ['#b64d33', '#7a9e92', '#c88b60', '#927eaa', '#8fa4c7', '#bb6c81']
const quantileLabels = ['p01', 'p25', 'p50', 'p75', 'p99']

export default function FundamentalsPage({ catalog, snapshot }: { catalog: FundamentalCatalog; snapshot: FundamentalSnapshot }) {
  const { locale } = useLocale()
  const english = locale === 'en-US'
  const copy = explorationCopy[locale].fundamentals
  const tickers = snapshot.coverage.representative_tickers
  const metricIds = useMemo(() => [...new Set(snapshot.series.map((item) => item.metric))], [snapshot.series])
  const [metric, setMetric] = useState('standardized_operating_profit')
  const [ticker, setTicker] = useState(tickers[0] ?? '')
  const activeMetric = metricIds.includes(metric) ? metric : metricIds[0] ?? ''
  const metricSeries = snapshot.series.filter((item) => item.metric === activeMetric)
  const metricTickers = [...new Set(metricSeries.map((item) => item.ticker))]
  const activeTicker = metricTickers.includes(ticker) ? ticker : metricTickers[0] ?? ''
  const activeSeries = metricSeries.find((item) => item.ticker === activeTicker)
  const seriesValues = activeSeries?.values ?? []
  const validSeriesObservations = seriesValues.filter((value) => value !== null).length
  const localizedFactors = catalog.factors.map((factor) => localizeFundamentalFactor(factor, locale))
  const core = localizedFactors.filter((factor) => factor.priority === 'core')
  const groups = [...new Set(localizedFactors.map((factor) => factor.family))]
  const valid = snapshot.latest_cross_section.count
  const missing = snapshot.latest_cross_section.missing
  const total = valid + missing
  const validRate = total ? valid / total * 100 : 0
  const metricLabel = copy.metricLabels[activeMetric] ?? activeMetric
  const metricDescription = copy.factorDescriptions[activeMetric] ?? ''
  const quantiles = [snapshot.latest_cross_section.p01, snapshot.latest_cross_section.p25, snapshot.latest_cross_section.p50, snapshot.latest_cross_section.p75, snapshot.latest_cross_section.p99]

  return <main className="page">
    <a className="back" href={import.meta.env.BASE_URL}>{copy.back}</a>
    <ResearchStudiesLink />
    <section className="detail-head"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p><span className="badge">PIT VINTAGE · {snapshot.vintage} · {snapshot.source === 'demo' ? copy.demo : copy.publicSnapshot}</span></section>
    <section className="panel research-verdict"><h2>{copy.conclusionLabel}</h2><p className="lede">{copy.conclusion}</p><p className="panel-note">{copy.exampleCoverage}</p></section>
    <ContextStrip items={[
      { label: copy.pitRange, value: `${snapshot.coverage.date_start} → ${snapshot.coverage.date_end}` },
      { label: copy.processedUniverse, value: `${snapshot.coverage.tickers_count.toLocaleString()} ${english ? 'tickers' : '只股票'}` },
      { label: copy.timeSeriesExamples, value: `${tickers.length} · ${tickers.join(' · ')}` },
      { label: copy.availabilityLabel, value: copy.availabilityBasis },
    ]} />
    <div className="metrics"><div className="metric-card"><span>{copy.processedTickers}</span><strong>{snapshot.coverage.tickers_count.toLocaleString()}</strong><small>{copy.pitCoverage}</small></div><div className="metric-card"><span>{copy.validOperatingProfit}</span><strong>{valid.toLocaleString()}</strong><small>{english ? `Missing ${missing.toLocaleString()}` : `缺失 ${missing.toLocaleString()}`}</small></div><div className="metric-card"><span>{copy.validShare}</span><strong>{validRate.toFixed(1)}%</strong><small>{copy.latestAvailable}</small></div><div className="metric-card"><span>{copy.median}</span><strong>{snapshot.latest_cross_section.p50?.toFixed(3) ?? '—'}</strong><small>{copy.standardizedProxy}</small></div></div>
    <section className="panel availability-panel" id="data-availability"><p className="eyebrow">{copy.availabilityEyebrow}</p><h2>{english ? 'How many stocks have a usable operating-profit value?' : '有多少只股票有可用的营业利润数据？'}</h2><div className="availability-bar" role="img" aria-label={english ? `${valid} valid, ${missing} missing out of ${total}` : `共 ${total} 只股票，${valid} 个有效值，${missing} 个缺失值`}><span style={{ width: `${validRate}%` }} /></div><div className="availability-legend"><span>{copy.valid} {valid.toLocaleString()} · {validRate.toFixed(1)}%</span><span>{copy.missing} {missing.toLocaleString()} · {(100 - validRate).toFixed(1)}%</span></div></section>
    <section className="panel quantile-panel"><div className="section-heading"><p className="eyebrow">{english ? 'STOCKS ON ONE DATE' : '同一日期的股票分布'} / {snapshot.latest_cross_section.metric}</p><h2>{english ? 'How do operating-profit values differ across stocks?' : '不同股票的营业利润数据有什么差异？'}</h2><p className="panel-note">{copy.distributionNote}</p></div><DeferredBarChart loadingLabel={copy.loadingChart} labels={quantileLabels} values={quantiles} colors={['#8fa4c7', '#7a9e92', '#b64d33', '#c88b60', '#927eaa']} /><div className="quantile-values">{quantileLabels.map((label, index) => <div key={label}><span>{label}</span><strong>{quantiles[index]?.toFixed(3) ?? '—'}</strong></div>)}</div></section>
    <section className="section"><div className="section-heading"><p className="eyebrow">{copy.coreEyebrow}</p><h2>{copy.coreTitle}</h2></div><div className="core-grid">{core.map((factor, index) => <div className="factor-tile" key={factor.id}><span className="tile-dot" style={{ background: colors[index % colors.length] }} /><p>{factor.family}</p><h3>{factor.name}</h3><strong>{factor.definition}</strong><small>{factor.meaning}</small></div>)}</div></section>
    <section className="section"><div className="section-heading"><p className="eyebrow">{copy.catalogEyebrow}</p><h2>{localizedFactors.length} {copy.entries}</h2></div><div className="catalog-grid">{groups.map((group) => { const factors = localizedFactors.filter((factor) => factor.family === group); return <details className="catalog-group" key={group}><summary><h3>{group}</h3><span>{factors.length} {copy.entries}</span></summary>{factors.map((factor) => <div className="catalog-row" key={factor.id}><span>{factor.name}</span><small>{factor.definition}</small></div>)}</details> })}</div></section>
    <section className="panel chart-panel exploration-panel"><div className="panel-head"><div><p className="eyebrow">{copy.timeSeries}</p><h2>{copy.metricLabels[activeMetric] ?? activeMetric}</h2><p className="panel-note">{metricDescription}</p></div></div>
      <div className="exploration-controls"><label>{copy.metric}<select aria-label={copy.metric} value={activeMetric} onChange={(event) => setMetric(event.target.value)}>{metricIds.map((id) => <option key={id} value={id}>{copy.metricLabels[id] ?? id}</option>)}</select></label><label>{copy.ticker}<select aria-label={copy.ticker} value={activeTicker} onChange={(event) => setTicker(event.target.value)}>{metricTickers.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
      {activeSeries ? <><DeferredLineChart loadingLabel={copy.loadingChart} dates={activeSeries.dates} showLegend={false} series={[{ name: metricLabel, values: seriesValues, color: colors[Math.max(metricIds.indexOf(activeMetric), 0) % colors.length] }]} /><p className="chart-caption">{copy.range}: {activeSeries.dates[0] ?? '—'} → {activeSeries.dates[activeSeries.dates.length - 1] ?? '—'} · {validSeriesObservations} {copy.observations}</p></> : <div className="chart-empty">{copy.noSeries}</div>}
    </section>
    <section className="panel warning-panel"><p className="eyebrow">{copy.guardrailsEyebrow}</p><h2>{copy.guardrailsTitle}</h2><ul>{copy.researchNotes.map((note) => <li key={note}>{note}</li>)}</ul><p>{english ? 'Catalog entries without published predictive evidence remain hypotheses or descriptive research.' : '尚无公开预测性证据的目录条目仍属于假设或描述性研究。'}</p></section>
  </main>
}
