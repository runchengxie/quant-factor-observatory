import { useEffect, useRef, useState } from 'react'
import BarChart from '../components/BarChart'
import ContextStrip from '../components/ContextStrip'
import JumpComparison from '../components/JumpComparison'
import { jumpStatus, ratio } from '../shapeExploration'
import { shapeExplorationCopy } from '../shapeExplorationCopy'
import type { JumpRow, Snapshot } from '../types'
import { useLocale } from '../i18n'
import { explorationCopy } from '../explorationCopy'
import type { RiskHistory, RiskPeriod } from '../riskHistory'
import { loadRiskHistory } from '../data'
import { readRiskUrlState, writeRiskUrlState, type RiskMode } from '../shareableUrl'
import RiskModePanel from '../components/RiskModePanel'
import { riskHistoryCopy } from '../riskHistoryCopy'

const colors = ['#477a76', '#b64d33']
const share = ratio
const fixed = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : value.toFixed(6)
const jumpKeys = ['pooled_jump_share', 'pooled_large_jump_share', 'pooled_small_jump_share', 'median_observation_jump_share', 'positive_residual_prevalence'] as const

function HistoricalJumpPanel({ history, granularity, setGranularity, period, setPeriod, component, setComponent }: {
  history: RiskHistory
  granularity: 'monthly' | 'annual'
  setGranularity: (value: 'monthly' | 'annual') => void
  period: string
  setPeriod: (value: string) => void
  component: string
  setComponent: (value: string) => void
}) {
  const { locale } = useLocale()
  const text = riskHistoryCopy[locale]
  const rows = history.jump_history[granularity]
  const selected = rows.find((row) => row.period === period) ?? rows[rows.length - 1]
  const key = (jumpKeys as readonly string[]).includes(component) ? component as typeof jumpKeys[number] : jumpKeys[0]
  const value = (row: RiskPeriod) => row[key]
  const formatter = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
  return <section className="panel historical-risk-panel">
    <div className="exploration-controls">
      <label>{text.granularity}<select aria-label={text.granularity} value={granularity} onChange={(event) => { const next = event.target.value as 'monthly' | 'annual'; setGranularity(next); setPeriod(history.jump_history[next][history.jump_history[next].length - 1]?.period ?? '') }}>
        <option value="monthly">{text.monthly}</option><option value="annual">{text.annual}</option>
      </select></label>
      <label>{text.period}<select aria-label={text.period} value={selected?.period ?? ''} onChange={(event) => setPeriod(event.target.value)}>{rows.map((row) => <option key={row.period} value={row.period}>{row.period}{row.partial_period ? ' · ' + text.partial : ''}</option>)}</select></label>
      <label>{text.component}<select aria-label={text.component} value={key} onChange={(event) => setComponent(event.target.value)}>{jumpKeys.map((id, index) => <option key={id} value={id}>{[text.pooled, text.large, text.small, text.median, text.prevalence][index]}</option>)}</select></label>
    </div>
    {!selected ? <div className="chart-empty">{text.noAsset}</div> : <>
      <ContextStrip items={[
        { label: text.observedDates, value: selected.observed_dates.toLocaleString(locale) },
        { label: text.eligible, value: selected.eligible_stock_days.toLocaleString(locale) },
        { label: text.excluded, value: selected.excluded_stock_days.toLocaleString(locale) },
        { label: [text.pooled, text.large, text.small, text.median, text.prevalence][jumpKeys.indexOf(key)], value: value(selected) === null ? '—' : formatter.format(value(selected)!) },
      ]} />
      <div className="risk-chart"><BarChart labels={rows.map((row) => row.period)} values={rows.map((row) => value(row))} colors={['#b64d33']} percent /></div>
      <div className="table-scroll"><table className="factor-table shape-table" aria-label={text.historical}><thead><tr><th>{text.period}</th><th>{text.pooled}</th><th>{text.large}</th><th>{text.small}</th><th>{text.median}</th><th>{text.prevalence}</th><th>{text.eligible}</th><th>{text.excluded}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.period}><th scope="row">{row.period}{row.partial_period ? ' · ' + text.partial : ''}</th>{jumpKeys.map((id) => <td key={id}>{row[id] === null ? '—' : formatter.format(row[id]!)}</td>)}<td>{row.eligible_stock_days.toLocaleString(locale)}</td><td>{row.excluded_stock_days.toLocaleString(locale)}</td></tr>)}</tbody></table></div>
      <p className="panel-note">{text.remainder}: {selected.pooled_jump_share === null ? '—' : formatter.format(1 - selected.pooled_jump_share)}. {text.remainderCaveat} {text.notCurrent}</p>
    </>}
  </section>
}

function JumpBreakdown({ row, labels }: { row: JumpRow; labels: { component: string; value: string; share: string; jumpComposition: string; jumpShare: string; observedValues: string } }) {
  const rvParts = [
    { label: 'IVhat', value: row.ivhat, fraction: share(row.ivhat, row.rv) },
    { label: 'RJV', value: row.rjv, fraction: share(row.rjv, row.rv) },
  ]
  const jumpParts = [
    { label: 'RLJV', value: row.rljv, fraction: share(row.rljv, row.rjv) },
    { label: 'RSJV', value: row.rsjv, fraction: share(row.rsjv, row.rjv) },
  ]
  const tableRows = [
    { label: 'IVhat', value: row.ivhat, rv: share(row.ivhat, row.rv), rjv: null },
    { label: 'RJV', value: row.rjv, rv: share(row.rjv, row.rv), rjv: null },
    { label: 'RLJV', value: row.rljv, rv: share(row.rljv, row.rv), rjv: share(row.rljv, row.rjv) },
    { label: 'RSJV', value: row.rsjv, rv: share(row.rsjv, row.rv), rjv: share(row.rsjv, row.rjv) },
  ]
  return <>
    <div className="jump-chart-grid">
      <div><h3>{labels.share}</h3><BarChart labels={rvParts.map((item) => item.label)} values={rvParts.map((item) => item.fraction)} colors={colors} percent /></div>
      <div><h3>{labels.jumpComposition}</h3><BarChart labels={jumpParts.map((item) => item.label)} values={jumpParts.map((item) => item.fraction)} colors={['#c88b60', '#6d6b9a']} percent /></div>
    </div>
    <div className="table-scroll"><table className="factor-table jump-table"><thead><tr><th>{labels.component}</th><th>{labels.value}</th><th>{labels.share}</th><th>{labels.jumpShare}</th></tr></thead><tbody>{tableRows.map((item) => <tr key={item.label}><td>{item.label}</td><td>{fixed(item.value)}</td><td>{item.rv === null ? '—' : `${(item.rv * 100).toFixed(2)}%`}</td><td>{item.rjv === null ? '—' : `${(item.rjv * 100).toFixed(2)}%`}</td></tr>)}</tbody></table></div>
    <p className="annotation">{labels.observedValues}: RV = {fixed(row.rv)} · IVhat = {fixed(row.ivhat)} · RJV = {fixed(row.rjv)} · RLJV = {fixed(row.rljv)} · RSJV = {fixed(row.rsjv)}</p>
  </>
}

export default function JumpPage({ snapshot, riskHistory }: { snapshot: Snapshot; riskHistory: RiskHistory | null }) {
  const { locale } = useLocale()
  const english = locale === 'en-US'
  const copy = explorationCopy[locale].jumps
  const rows = snapshot.jump_decomposition
  const optionKey = (row: JumpRow) => `${row.ticker}|${row.date}`
  const initialUrl = readRiskUrlState()
  const [observation, setObservation] = useState(() => rows.find((item) => item.ticker === initialUrl.ticker && item.date === initialUrl.date) ? String(initialUrl.ticker) + '|' + String(initialUrl.date) : rows[0] ? optionKey(rows[0]) : '')
  const [history, setHistory] = useState(riskHistory)
  const [mode, setMode] = useState<RiskMode>(initialUrl.mode ?? 'demo')
  const [granularity, setGranularity] = useState<'monthly' | 'annual'>(initialUrl.granularity ?? 'monthly')
  const [period, setPeriod] = useState(initialUrl.period ?? '')
  const [component, setComponent] = useState(initialUrl.component ?? 'pooled_jump_share')
  const row = rows.find((item) => optionKey(item) === observation) ?? rows[0]
  const status = row ? jumpStatus(row) : 'unavailable'
  const identitiesPass = status === 'unavailable' ? null : status === 'valid'
  const labels = shapeExplorationCopy[locale]
  const dataset = snapshot.datasets[0]
  const detail = useRef<HTMLElement>(null)
  const periods = history?.jump_history[granularity] ?? []
  const activePeriod = periods.some((item) => item.period === period) ? period : periods[periods.length - 1]?.period ?? ''
  useEffect(() => {
    writeRiskUrlState({ mode, granularity, period: mode === 'historical' ? activePeriod : undefined, component, ticker: row?.ticker, date: row?.date })
  }, [mode, granularity, activePeriod, component, row?.ticker, row?.date])
  const onMode = (next: RiskMode) => {
    setMode(next)
    if (next === 'historical' && !history) void loadRiskHistory().then(setHistory)
  }

  if (mode === 'historical') return <main className="page shape-page">
    <a className="back" href={import.meta.env.BASE_URL}>{copy.back}</a>
    <section className="detail-head"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p><span className="badge">{riskHistoryCopy[locale].archived}</span></section>
    <RiskModePanel mode={mode} onMode={onMode} unavailable={!history} onRetry={() => { void loadRiskHistory().then(setHistory) }} />
    {history && <><HistoricalJumpPanel history={history} granularity={granularity} setGranularity={setGranularity} period={activePeriod} setPeriod={setPeriod} component={component} setComponent={setComponent} /><p className="panel-note"><a href={import.meta.env.BASE_URL + 'quality'}>{riskHistoryCopy[locale].source}</a> · <a href={import.meta.env.BASE_URL + 'studies'}>{riskHistoryCopy[locale].studies}</a></p></>}
  </main>

  return <main className="page shape-page">
    <a className="back" href={import.meta.env.BASE_URL}>{copy.back}</a>
    <section className="detail-head"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p><span className="badge">{snapshot.source === 'demo' ? copy.demo : `${snapshot.source} · ${dataset?.name ?? ''}`}</span></section>
    <RiskModePanel mode={mode} onMode={onMode} />
    <section className="panel research-verdict"><h2>{copy.conclusionLabel}</h2><p className="lede">{copy.conclusion}</p><p className="panel-note">{copy.boundary}</p></section>
    <ContextStrip items={[
      { label: copy.observation, value: `${rows.length} ${english ? 'rows' : '条观测'}` },
      { label: copy.snapshotDate, value: [...new Set(rows.map(item => item.date))].sort().join(' · ') || '—' },
      { label: copy.illustrativeUniverse, value: `${new Set(rows.map((item) => item.ticker)).size}` },
    ]} />
    <JumpComparison rows={rows} onInspect={item => { setObservation(optionKey(item)); requestAnimationFrame(() => { detail.current?.focus({ preventScroll: true }); detail.current?.scrollIntoView({ block: 'start' }) }) }} />
    {snapshot.source === 'demo' && <p className="panel-note">{labels.comparisonNote}</p>}
    <div className="jump-flow"><div><b>RV</b><span>{english ? 'Realized variance' : '实现方差'}</span></div><i>−</i><div><b>IVhat</b><span>{english ? 'Continuous variance estimate' : '连续方差估计'}</span></div><i>=</i><div className="accent"><b>RJV</b><span>{english ? 'Jump variance' : '跳跃方差'}</span></div><i>→</i><div><b>RLJV + RSJV</b><span>{english ? 'Large + small jumps' : '大跳跃 + 小跳跃'}</span></div></div>
    <section ref={detail} tabIndex={-1} className="panel chart-panel exploration-panel">
      <div className="panel-head"><div><p className="eyebrow">{copy.observation}</p><h2>{row?.date ?? '—'} · {row?.ticker ?? '—'}</h2></div><label className="series-select">{copy.observation}<select aria-label={copy.observation} value={row ? optionKey(row) : ''} onChange={(event) => setObservation(event.target.value)}>{rows.map((item) => <option key={optionKey(item)} value={optionKey(item)}>{item.ticker} · {item.date}</option>)}</select></label></div>
      {row ? <>
        <p className={`decomposition-status ${identitiesPass === null ? 'is-unavailable' : identitiesPass ? 'is-valid' : 'is-invalid'}`} role="status">{identitiesPass === null ? copy.checkUnavailable : identitiesPass ? copy.checkPassed : copy.checkFailed}</p>
        <div className="section-heading"><h2>{copy.rvShare}</h2></div>
        {status === 'valid' ? <JumpBreakdown row={row} labels={{ component: copy.component, value: copy.value, share: copy.share, jumpComposition: copy.jumpComposition, jumpShare: copy.jumpShare, observedValues: copy.observedValues }} /> : <p className="panel-note">{copy.observedValues}: RV = {fixed(row.rv)} · IVhat = {fixed(row.ivhat)} · RJV = {fixed(row.rjv)} · RLJV = {fixed(row.rljv)} · RSJV = {fixed(row.rsjv)}</p>}
        <p className="panel-note">{copy.identity}</p>
      </> : <div className="chart-empty">{copy.noData}</div>}
    </section>
    <section className="panel shape-next"><h2>{labels.nextTitle}</h2><p>{labels.jumpNext}</p><p className="panel-note">{labels.source}: {snapshot.source} · {labels.generated}: {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(snapshot.generated_at))} (Asia/Shanghai)</p></section>
  </main>
}
