import ForecastReader from './ForecastReader'
import { forecastReaderCopy } from '../forecastReaderCopy'
import { useState } from 'react'
import { useLocale } from '../i18n'
import { forecastGuideCopy } from '../forecastGuideCopy'
import type { ForecastGuideData } from '../forecastGuide'
import type { StudyExplorationData } from '../studyExploration'

const colors = ['var(--study-series-1, #315b74)', 'var(--study-series-2, #b64d33)', 'var(--study-series-3, #33796c)', 'var(--study-series-4, #967326)', 'var(--study-series-5, #795a94)', '#60823c']
type Curve = { label: string; values: (number | null)[] }

function Plot({ title, x, labels, curves, number }: { title: string; x: number[]; labels: string[]; curves: Curve[]; number: (v: number | null) => string }) {
  const values = curves.flatMap(c => c.values.filter((v): v is number => v !== null))
  const low = Math.min(0, ...values), high = Math.max(0, ...values)
  const pad = (high - low || 1) * .08
  const min = low - pad, max = high + pad
  const xs = (v: number) => 65 + (v - Math.min(...x)) / (Math.max(...x) - Math.min(...x) || 1) * 730
  const ys = (v: number) => 250 - (v - min) / (max - min) * 220
  return <div className="forecast-plot"><div className="study-chart-legend">{curves.map((c, i) => <span key={c.label}><i style={{ background: colors[i % colors.length] }} />{c.label}</span>)}</div><svg role="img" aria-label={title} viewBox="0 0 880 300"><title>{title}</title>
    {[min, 0, max].map((v, i) => <g key={i}><line x1="65" x2="795" y1={ys(v)} y2={ys(v)} className={v === 0 ? 'study-chart-zero' : 'study-chart-grid'} /><text x="57" y={ys(v) + 4} textAnchor="end">{number(v)}</text></g>)}
    {x.map((v, i) => <text key={i} x={xs(v)} y="280" textAnchor="middle">{x.length <= 15 || i === 0 || i === x.length - 1 || i % 5 === 0 ? labels[i] : ''}</text>)}
    {curves.map((curve, j) => { let connected = false; const path = curve.values.map((v, i) => { if (v === null) { connected = false; return '' } const part = `${connected ? 'L' : 'M'}${xs(x[i])},${ys(v)}`; connected = true; return part }).join(' ')
      return <g key={curve.label}><path d={path} fill="none" stroke={colors[j % colors.length]} strokeWidth="2" strokeDasharray={j > 2 ? `${j * 2} 3` : undefined} />{curve.values.map((v, i) => v === null ? null : <circle key={i} cx={xs(x[i])} cy={ys(v)} r="3" fill={colors[j % colors.length]}><title>{`${labels[i]} · ${curve.label} ${number(v)}`}</title></circle>)}</g>
    })}
  </svg></div>
}

function IntervalPlot({ title, intervals, mean, label, number }: { title: string; intervals: { block_quarters: number; lower: number | null; upper: number | null }[]; mean: number | null; label: string; number: (v: number | null) => string }) {
  const values = [...intervals.flatMap(i => [i.lower, i.upper]), mean].filter((v): v is number => v !== null)
  const low = Math.min(0, ...values), high = Math.max(0, ...values), pad = (high - low || 1) * .12
  const x = (v: number) => 180 + (v - low + pad) / (high - low + 2 * pad) * 580
  return <div className="forecast-plot"><svg role="img" aria-label={title} viewBox="0 0 880 190"><title>{title}</title><line x1={x(0)} x2={x(0)} y1="20" y2="145" className="study-chart-zero" />
    {[low - pad, 0, high + pad].map((v, i) => <text key={i} x={x(v)} y="175" textAnchor="middle">{number(v)}</text>)}
    {intervals.map((interval, i) => { const y = 50 + i * 65; return <g key={interval.block_quarters}><text x="155" y={y + 5} textAnchor="end">{interval.block_quarters} {label}</text>{interval.lower === null || interval.upper === null || mean === null ? <text x="185" y={y}>{number(null)}</text> : <><line x1={x(interval.lower)} x2={x(interval.upper)} y1={y} y2={y} stroke={colors[0]} strokeWidth="3" /><circle cx={x(mean)} cy={y} r="5" fill={colors[0]} /><title>{`${number(mean)} [${number(interval.lower)}, ${number(interval.upper)}]`}</title></>}</g> })}
  </svg></div>
}

export default function ForecastGuide({ guide, exploration }: { guide: ForecastGuideData; exploration: StudyExplorationData }) {
  const { locale } = useLocale(), c = forecastGuideCopy[locale]
  const [target, setTarget] = useState('roa'), [horizon, setHorizon] = useState(1), [model, setModel] = useState('pairwise'), [width, setWidth] = useState(20)
  const number = (v: number | null) => v === null ? c.unknown : new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)
  const pct = (v: number | null) => v === null ? c.unknown : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(v)
  const group = guide.groups.find(g => g.target === target && g.horizon === horizon)!
  const activeModel = group.models.find(m => m.id === model)!
  const horizonGroups = guide.groups.filter(g => g.target === target).sort((a, b) => a.horizon - b.horizon)
  const models = ['ridge', 'pointwise', 'pairwise', 'listwise']
  const annual = activeModel.annual
  const annualMap = new Map(annual.map(a => [a.year, a]))
  const years = Array.from({ length: annual[annual.length - 1].year - annual[0].year + 1 }, (_, i) => annual[0].year + i)
  const returnGroup = guide.returns.find(g => g.width === width)!
  const sources = guide.source_ids.map(id => exploration.sources.find(s => s.id === id)!)
  return <section className="forecast-guide" aria-labelledby="forecast-guide-title">
    <ForecastReader guide={guide} />
    <details className="forecast-full-details"><summary>{forecastReaderCopy[locale].details}</summary>
    <section className="panel forecast-intro"><p className="eyebrow">{c.stage} · {c.date}</p><h2 id="forecast-guide-title">{c.title}</h2>{guide.paragraphs.map((p, i) => <p key={i}>{p[locale]}</p>)}</section>
    <nav className="study-exploration-nav" aria-label={c.title}><a href="#forecast-gain">{c.gainTitle}</a><a href="#forecast-stability">{c.stabilityTitle}</a><a href="#forecast-return">{c.returnTitle}</a><a href="#forecast-glossary">{c.glossaryTitle}</a></nav>
    <section className="panel"><h2>{c.workflowTitle}</h2><ol className="forecast-workflow">{c.workflow.map(([title, text], i) => <li key={title}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
    <section className="panel" id="forecast-gain"><h2>{c.gainTitle}</h2><p>{c.gainNote}</p><p className="study-chart-mobile-note">{c.scrollNote}</p><div className="table-scroll"><table className="factor-table forecast-heatmap"><caption>{c.gainTitle}</caption><thead><tr><th>{c.target}</th><th>{c.horizon}</th>{models.map(m => <th key={m}>{c.models[m]}</th>)}</tr></thead><tbody>{guide.groups.map(g => {
      const baseline = g.models.find(m => m.id === 'persistence')!.mean_rank_ic
      return <tr key={`${g.target}-${g.horizon}`}><th scope="row">{c.targets[g.target]}</th><td>{g.horizon} {c.quarters}</td>{models.map(m => { const estimate = g.models.find(v => v.id === m)!.mean_rank_ic
        const value = estimate === null || baseline === null ? null : Number(estimate.toFixed(3)) - Number(baseline.toFixed(3))
        return <td key={m} data-cell={`${g.target}-${g.horizon}-${m}`} className={value === null || value === 0 ? '' : value > 0 ? 'forecast-gain-positive' : 'forecast-gain-negative'} style={value === null || value === 0 ? undefined : { background: `rgba(${value > 0 ? '51,121,108' : '182,77,51'},${Math.min(.28, .05 + Math.abs(value) * .5)})` }}>{number(value)}</td>
      })}</tr>
    })}</tbody></table></div></section>
    <section className="panel"><h2>{c.horizonTitle}</h2><div className="exploration-controls"><label>{c.target}<select aria-label={c.target} value={target} onChange={e => setTarget(e.target.value)}>{Object.entries(c.targets).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label></div><p>{c.horizonNote}</p><p className="study-chart-mobile-note">{c.scrollNote}</p>
      <Plot title={c.horizonTitle} x={horizonGroups.map(g => g.horizon)} labels={horizonGroups.map(g => `${g.horizon} ${c.quarters}`)} curves={['persistence', ...models].map(m => ({ label: c.models[m], values: horizonGroups.map(g => g.models.find(v => v.id === m)!.mean_rank_ic) }))} number={number} />
      <details><summary>{c.values}</summary><div className="table-scroll"><table className="factor-table"><caption>{c.horizonTitle}</caption><thead><tr><th>{c.horizon}</th><th>{c.rows}</th><th>{c.sample}</th>{['persistence', ...models].map(m => <th key={m}>{c.models[m]}</th>)}</tr></thead><tbody>{horizonGroups.map(g => <tr key={g.horizon}><th>{g.horizon}</th><td>{g.rows.toLocaleString(locale)}</td><td>{g.report_start} / {g.report_end}</td>{g.models.map(m => <td key={m.id}>{number(m.mean_rank_ic)}</td>)}</tr>)}</tbody></table></div></details>
    </section>
    <section className="panel" id="forecast-stability"><h2>{c.stabilityTitle}</h2><div className="exploration-controls"><label>{c.horizon}<select value={horizon} onChange={e => setHorizon(Number(e.target.value))}>{[1, 2, 4].map(v => <option key={v} value={v}>{v} {c.quarters}</option>)}</select></label><label>{c.model}<select value={model} onChange={e => setModel(e.target.value)}>{models.map(m => <option key={m} value={m}>{c.models[m]}</option>)}</select></label></div><p>{c.stabilityNote}</p><p><strong>{c.targets[target]} · {horizon} {c.quarters} · {c.models[model]}</strong></p>
      <Plot title={c.annualTitle} x={years} labels={years.map(String)} curves={[{ label: c.gain, values: years.map(y => annualMap.get(y)?.mean_gain ?? null) }]} number={number} />
      <p>{c.gain} {number(activeModel.mean_gain)} · {c.win} {pct(activeModel.win_fraction)} · {c.formations} {activeModel.paired_formations}</p>
      <details><summary>{c.values}</summary><div className="table-scroll"><table className="factor-table"><caption>{c.annualTitle}</caption><thead><tr><th>{c.year}</th><th>{c.formations}</th><th>{c.gain}</th></tr></thead><tbody>{years.map(y => <tr key={y}><th>{y}</th><td>{annualMap.get(y)?.formations ?? c.unknown}</td><td>{number(annualMap.get(y)?.mean_gain ?? null)}</td></tr>)}</tbody></table></div></details>
      <h3>{c.intervalsTitle}</h3><p>{c.intervalNote}</p><IntervalPlot title={c.intervalsTitle} intervals={activeModel.intervals} mean={activeModel.mean_gain} label={c.quarters} number={number} /><div className="table-scroll"><table className="factor-table"><caption>{c.intervalsTitle}</caption><thead><tr><th>{c.block}</th><th>{c.gain}</th><th>{c.range}</th></tr></thead><tbody>{activeModel.intervals.map(i => <tr key={i.block_quarters}><th>{i.block_quarters} {c.quarters}</th><td>{number(activeModel.mean_gain)}</td><td>{number(i.lower)} / {number(i.upper)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="panel"><h2>{c.changeTitle}</h2><p>{c.changeNote}</p><p className="panel-note">{c.changeUnit}</p>{guide.change_groups.map(g => <details key={`${g.target}-${g.horizon}`} open={g.target === 'roa' && g.horizon === 1}><summary>{c.targets[g.target]} · {g.horizon} {c.quarters} · {g.formations} {c.formations} · {g.rows.toLocaleString(locale)} {c.rows}</summary><p>{c.prevalence} {pct(g.models[0].negative_share)}{g.horizon === 4 ? ` · ${c.seasonalIdentity}` : null}</p><div className="table-scroll"><table className="factor-table"><caption>{c.targets[g.target]} · {g.horizon} {c.quarters}</caption><thead><tr><th>{c.model}</th><th>{c.mae}</th><th>{c.zeroGain}</th><th>{c.seasonalGain}</th><th>{c.precision}</th><th>{c.recall}</th></tr></thead><tbody>{g.models.map(m => <tr key={m.id}><th scope="row">{c.models[m.id]}</th><td>{number(m.mae)}</td><td>{number(m.gain_vs_zero)}</td><td>{number(m.gain_vs_seasonal)}</td><td>{pct(m.deterioration_precision)}</td><td>{pct(m.deterioration_recall)}</td></tr>)}</tbody></table></div></details>)}<p className="forecast-caveat">{c.changeLimit}</p></section>
    <section className="panel" id="forecast-return"><h2>{c.returnTitle}</h2><p className="forecast-caveat"><strong>{c.returnStatus}</strong></p><p>{c.returnNote}</p><p>{c.returnCorrection}</p><div className="exploration-controls"><label>{c.width}<select value={width} onChange={e => setWidth(Number(e.target.value))}>{guide.returns.map(g => <option key={g.width} value={g.width}>{g.width}</option>)}</select></label></div>
      <Plot title={c.wealth} x={returnGroup.dates.map(d => new Date(`${d}T00:00:00Z`).getTime())} labels={returnGroup.dates} curves={[{ label: c.wealth, values: returnGroup.wealth }]} number={number} />
      <Plot title={c.drawdown} x={returnGroup.dates.map(d => new Date(`${d}T00:00:00Z`).getTime())} labels={returnGroup.dates} curves={[{ label: c.drawdown, values: returnGroup.drawdown }]} number={pct} />
      <div className="table-scroll"><table className="factor-table"><caption>{c.returnTitle}</caption><thead><tr><th>{c.width}</th><th>{c.totalReturn}</th><th>{c.correctedDrawdown}</th><th>{c.archivedDrawdown}</th><th>{c.turnover}</th><th>{c.cost}</th></tr></thead><tbody>{guide.returns.map(g => <tr key={g.width}><th>{g.width}</th><td>{pct(g.total_return)}</td><td>{pct(g.max_drawdown)}</td><td>{pct(g.archived_max_drawdown)}</td><td>{pct(g.average_turnover)}</td><td>{pct(g.average_cost_drag)}</td></tr>)}</tbody></table></div>
      <details><summary>{c.values}</summary><div className="table-scroll"><table className="factor-table"><caption>{c.wealth}</caption><thead><tr><th>{c.dateLabel}</th><th>{c.wealth}</th><th>{c.drawdown}</th></tr></thead><tbody>{returnGroup.dates.map((d, i) => <tr key={d}><th>{d}</th><td>{number(returnGroup.wealth[i])}</td><td>{pct(returnGroup.drawdown[i])}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="panel" id="forecast-glossary"><h2>{c.glossaryTitle}</h2><dl className="forecast-glossary">{c.glossary.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl><h3>{c.nextTitle}</h3><ul>{c.next.map(p => <li key={p}>{p}</li>)}</ul><details><summary>{c.source}</summary><ul>{sources.map(s => <li key={s.id}>{s.label[locale]} <code>{s.source_ref}</code></li>)}</ul></details></section>
    </details>
  </section>
}
