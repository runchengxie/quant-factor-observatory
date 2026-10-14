import { forecastReaderCopy } from '../forecastReaderCopy'
import ForecastGuide from './ForecastGuide'
import { Fragment, useEffect, useState } from 'react'
import { useLocale } from '../i18n'
import type { Study } from '../types'
import { isStudyExploration, type StudyExplorationData } from '../studyExploration'
import StudyComparisonChart, { formatStudyValue } from './StudyComparisonChart'

function ExplorationContent({ data }: { data: StudyExplorationData }) {
  const { locale, copy } = useLocale()
  const labels = copy.studyExploration
  const [chartId, setChartId] = useState(data.charts[0]?.id ?? '')
  const chart = data.charts.find((c) => c.id === chartId) ?? data.charts[0]
  const Archive = data.guide ? 'details' : Fragment
  const sourceLink = (id: string) => `#study-source-${data.study_id}-${id}`
  const sourceNames = (ids: string[]) => <span className="study-evidence-sources">{labels.source}: {ids.map((id) => <a key={id} href={sourceLink(id)}>{data.sources.find((s) => s.id === id)?.label[locale]}</a>)}</span>
  const comparison = (<section className="panel study-exploration-comparison" id="study-exploration-comparison" aria-labelledby="study-comparison-title">
      <h2 id="study-comparison-title">{labels.comparison}</h2>
      {chart ? <>
        <label className="study-exploration-select">{labels.chooseChart}<select aria-label={labels.chooseChart} value={chart.id} onChange={(e) => setChartId(e.target.value)}>{data.charts.map((c) => <option key={c.id} value={c.id}>{c.title[locale]}</option>)}</select></label>
        <h3>{chart.title[locale]}</h3><p className="panel-note">{chart.metric[locale]}</p><p className="study-chart-context">{chart.context[locale]}</p>
        <p className="study-chart-mobile-note">{labels.scrollNote}</p><StudyComparisonChart chart={chart} locale={locale} />
        <p className="study-intermediate-conclusion"><strong>{labels.readChart}</strong> {chart.interpretation[locale]}</p>{sourceNames(chart.source_ids)}
        <details className="study-values"><summary>{labels.values}</summary><div className="table-scroll"><table className="factor-table"><caption>{chart.title[locale]} · {chart.metric[locale]}</caption><thead><tr><th>{labels.category}</th>{chart.series.map((s) => <th key={s.id}>{s.label[locale]}</th>)}</tr></thead><tbody>{chart.categories.map((category, i) => <tr key={i}><th scope="row">{category[locale]}</th>{chart.series.map((s) => <td key={s.id}>{formatStudyValue(s.values[i], chart, locale)}</td>)}</tr>)}</tbody></table></div></details>
      </> : <p className="study-no-performance">{labels.noPerformance}</p>}
    </section>)
  return <section className="study-exploration" aria-labelledby="study-exploration-title">
    {data.guide && <ForecastGuide guide={data.guide} exploration={data} comparison={comparison} />}
    <Archive {...(data.guide ? { className: 'forecast-archive' } : {})}>{data.guide && <summary>{forecastReaderCopy[locale].archive}</summary>}
    <section className="panel study-exploration-head"><p className="eyebrow">{labels.eyebrow}</p><h2 id="study-exploration-title">{labels.title}</h2><p>{data.summary[locale]}</p><nav className="study-exploration-nav" aria-label={labels.navigation}><a href="#study-exploration-comparison">{labels.comparison}</a><a href="#study-exploration-path">{labels.path}</a><a href="#study-exploration-sources">{labels.sources}</a></nav></section>
    {!data.guide && comparison}
    <section className="panel" id="study-exploration-path" aria-labelledby="study-path-title"><h2 id="study-path-title">{labels.path}</h2><p className="panel-note">{labels.pathNote}</p><ol className="study-exploration-steps">{data.steps.map((step, index) => <li key={step.id}>
      <div className="study-step-marker"><span>{String(index + 1).padStart(2, '0')}</span><small>{step.period[locale]}</small><span className="study-step-status">{labels[step.status] ?? labels.diagnostic}</span></div>
      <article><h3>{step.title[locale]}</h3><dl><div><dt>{labels.question}</dt><dd>{step.question[locale]}</dd></div><div><dt>{labels.finding}</dt><dd>{step.finding[locale]}</dd></div><div><dt>{labels.decision}</dt><dd>{step.decision[locale]}</dd></div></dl>{sourceNames(step.source_ids)}</article>
    </li>)}</ol><div className="study-next-question"><strong>{labels.nextQuestion}</strong><p>{data.next_question[locale]}</p></div></section>
    {!!data.conclusion_changes?.length && <section className="panel study-conclusion-changes"><h2>{copy.researchHub.changes}</h2>{data.conclusion_changes.map(change => <article className="hub-change" key={change.id}><p>{change.period[locale]}</p><dl><dt>{copy.researchHub.before}</dt><dd>{change.before[locale]}</dd><dt>{copy.researchHub.trigger}</dt><dd>{change.trigger[locale]}</dd><dt>{copy.researchHub.after}</dt><dd>{change.after[locale]}</dd></dl>{sourceNames(change.source_ids)}</article>)}</section>}
    <details className="panel study-exploration-sources" id="study-exploration-sources"><summary>{labels.sources}</summary><p className="panel-note">{labels.sourceNote} · {labels.reviewed}: {data.reviewed_at}</p><ul>{data.sources.map((source) => <li id={`study-source-${data.study_id}-${source.id}`} key={source.id}><strong>{source.label[locale]}</strong><code>{source.source_ref}</code></li>)}</ul><small>{labels.sourceRevision}: <code>{data.source_revision.slice(0, 12)}</code></small></details>
    </Archive>
  </section>
}

export default function StudyExploration({ study }: { study: Study }) {
  const { copy } = useLocale()
  const [data, setData] = useState<StudyExplorationData | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setData(null); setFailed(false)
    const asset = study.exploration_asset
    if (!asset || !/^data\/study-exploration\/[a-z0-9-]+\.json$/.test(asset)) { setFailed(true); return () => controller.abort() }
    fetch(`${import.meta.env.BASE_URL}${asset}`, { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error('unavailable'); return response.json() }).then((value: unknown) => {
      if (!isStudyExploration(value, study.id, study.source_ref)) throw new Error('invalid projection')
      if (!controller.signal.aborted) setData(value)
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [study.id, study.source_ref, study.exploration_asset, attempt])
  if (failed) return <section className="panel" role="status"><p>{copy.studyExploration.unavailable}</p><button className="quiet-button" onClick={() => setAttempt((v) => v + 1)}>{copy.retry}</button></section>
  if (!data) return <p className="panel" role="status">{copy.studyExploration.loading}</p>
  return <ExplorationContent key={study.id} data={data} />
}
