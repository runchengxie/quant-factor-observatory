import EvidenceReviewDate from './EvidenceReviewDate'
import { useState } from 'react'
import type { Study, StudyCatalog } from '../types'
import { useLocale } from '../i18n'
const href = (id: string) => `${import.meta.env.BASE_URL}studies/${id}`
export function filterStudies(studies: Study[], locale: 'en-US' | 'zh-CN', query: string, market: string, stage: string, briefs: Record<string, string>) {
  return studies.filter(s => (!market || s.market === market) && (!stage || s.evidence_stage === stage) && [s.id, briefs[s.id] ?? '', (s.translations?.[locale] ?? s).title, (s.translations?.[locale] ?? s).summary, (s.translations?.[locale] ?? s).family].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
}

type FilterProps = { studies: Study[]; query: string; market: string; stage: string; setQuery: (value: string) => void; setMarket: (value: string) => void; setStage: (value: string) => void }
export function StudyFilters({ studies, query, market, stage, setQuery, setMarket, setStage }: FilterProps) {
  const { copy } = useLocale(), c = copy.researchHub
  return <div className="hub-filters">
    <label>{c.search}<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <label>{c.market}<select aria-label={c.market} value={market} onChange={e => setMarket(e.target.value)}><option value="">{c.all}</option>{['a_share', 'hong_kong'].map(m => <option key={m} value={m}>{copy.studyTaxonomy[m]}</option>)}</select></label>
    <label>{c.stage}<select aria-label={c.stage} value={stage} onChange={e => setStage(e.target.value)}><option value="">{c.allStages}</option>{Array.from(new Set(studies.map(s => s.evidence_stage).filter(Boolean))).map(s => <option key={s} value={s}>{copy.studyTaxonomy[s ?? '']}</option>)}</select></label>
  </div>
}

function ReviewDate({ value }: { value: string }) {
  const { locale, copy } = useLocale()
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return <span>{copy.researchHub.unknownDate}</span>
  return <span>{copy.researchHub.checked} <time dateTime={value}>{new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)}</time>{locale === 'zh-CN' ? '（北京时间）' : ' (Asia/Shanghai)'}</span>
}

export function SourceReviewWarning({ study }: { study: Study }) {
  const { copy } = useLocale()
  const status = study.source_review_status?.status
  return status && status !== 'matched' ? <p className="research-boundary source-review-warning">{copy.researchHub[status] ?? status}</p> : null
}

export function StudyEvidenceSummary({ study }: { study: Study }) {
  const { locale, copy } = useLocale(), c = copy.researchHub
  const content = { ...study, ...study.translations?.[locale] }
  return <section className="panel study-evidence-summary">
    <h2>{c.detailEvidence}</h2><EvidenceReviewDate recordKey={study.id} />
    <dl className="study-evidence-fields">{study.evidence_summary && <>
      <div><dt>{c.sample}</dt><dd>{study.evidence_summary.sample[locale]}</dd><dd>{study.evidence_summary.input_basis[locale]}</dd></div>
      <div><dt>{c.scope}</dt><dd>{study.evidence_summary.scope[locale]}</dd></div>
      <div><dt>{c.baseline}</dt><dd>{study.evidence_summary.baseline[locale]}</dd></div>
    </>}<div><dt>{c.gap}</dt><dd>{content.limits[0]}</dd></div></dl>
    <SourceReviewWarning study={study} />
    <details className="study-source-record"><summary>{c.sourceDetails}</summary>
      {study.source_review_status && <><p>{c[study.source_review_status.status] ?? study.source_review_status.status}</p><p><ReviewDate value={study.source_review_status.checked_at} /></p><code>{study.source_review_status.checked_at}</code></>}
      <p>{content.source_note}</p><code>{study.source_ref}</code>
    </details>
  </section>
}

export function ResearchEvidenceHub({ catalog }: { catalog: StudyCatalog }) {
  const { locale, copy } = useLocale(), c = copy.researchHub, n = copy.studyNavigation
  const [query, setQuery] = useState(''), [market, setMarket] = useState(''), [stage, setStage] = useState('')
  const [view, setView] = useState('problem'), [negativeOnly, setNegativeOnly] = useState(false), [openTasksOnly, setOpenTasksOnly] = useState(false)
  const studies = filterStudies(catalog.studies, locale, query, market, stage, copy.studyBriefs)
    .filter(s => view !== 'decision' || !negativeOnly || s.navigation_summary?.negative_result)
    .filter(s => view !== 'decision' || !openTasksOnly || s.navigation_summary?.tasks.some(task => task.status !== 'completed'))
  if (!catalog.studies.some(s => s.evidence_summary)) return null
  return <section className="panel research-evidence-hub"><h1>{c.title}</h1>
    <div className="hub-filters"><label>{n.view}<select aria-label={n.view} value={view} onChange={e=>setView(e.target.value)}>{['problem','experiment','decision'].map(v=><option key={v} value={v}>{n[v+'View']}</option>)}</select></label>{view === 'decision' && <><label><input type="checkbox" checked={openTasksOnly} onChange={e=>setOpenTasksOnly(e.target.checked)}/>{n.openTasksOnly}</label><label><input type="checkbox" checked={negativeOnly} onChange={e=>setNegativeOnly(e.target.checked)}/>{n.negativeOnly}</label></>}</div>
    <StudyFilters studies={catalog.studies} query={query} market={market} stage={stage} setQuery={setQuery} setMarket={setMarket} setStage={setStage} />
    <p><a href={href('compare')}>{locale === 'en-US' ? 'Compare past experiments' : '比较历史实验'} →</a></p>
    {view === 'problem' ? <div className="table-scroll"><table className="factor-table"><thead><tr>{[c.study,c.sample,c.baseline,c.gap,c.review].map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{studies.map(s => { const t = { ...s, ...s.translations?.[locale] }; return <tr key={s.id}><td><a href={href(s.id)}>{t.title}</a><p>{t.summary}</p><span className="tag">{copy.studyTaxonomy[s.evidence_stage ?? ''] ?? t.status_label}</span></td><td><p>{s.evidence_summary?.sample[locale]}</p><p>{s.evidence_summary?.input_basis[locale]}</p><p>{s.evidence_summary?.scope[locale]}</p></td><td>{s.evidence_summary?.baseline[locale]}</td><td>{t.limits[0]}</td><td>{s.source_review_status ? <>{c[s.source_review_status.status] ?? s.source_review_status.status}<small><ReviewDate value={s.source_review_status.checked_at} /></small></> : '—'}</td></tr> })}</tbody></table></div> : <div className="table-scroll"><table className="factor-table"><thead><tr><th>{c.study}</th><th>{view === 'experiment' ? n.experimentView : n.decisionView}</th><th>{view === 'experiment' ? n.reproduction : n.queue}</th></tr></thead><tbody>{studies.map(s=>{const t={...s,...s.translations?.[locale]},meta=s.navigation_summary;const tasks=meta?.tasks.filter(task=>!openTasksOnly||task.status!=='completed');return <tr key={s.id}><td><a href={href(s.id)}>{t.title}</a></td><td>{view === 'experiment' ? (s.method ?? []).map(m=>copy.studyTaxonomy[m]).join(' · ') : n[meta?.decision ?? ''] ?? '—'}</td><td>{view === 'experiment' ? <><code>{meta?.run_id ?? '—'}</code><p>{n[meta?.reproduction_status ?? ''] ?? '—'}</p></> : <><p>{meta?.resume_when[locale]}</p>{tasks?.map(task=><p key={task.id}><span className="tag">{task.priority} · {n[task.status]}</span> {task.action[locale]}</p>)}</>}</td></tr>})}</tbody></table>{view === 'decision' && <p>{n.negativeNote}</p>}</div>}{!studies.length && <p className="empty-state">{openTasksOnly ? n.noOpenTasks : c.empty}</p>}
    {!!catalog.research_hub?.change_entries.length && <details><summary>{c.changes} ({catalog.research_hub.change_entries.length})</summary>{catalog.research_hub.change_entries.map(entry => <article className="hub-change" key={`${entry.study_id}-${entry.id}`}><a href={href(entry.study_id)}>{(catalog.studies.find(s => s.id === entry.study_id)?.translations?.[locale] ?? catalog.studies.find(s => s.id === entry.study_id))?.title}</a><p>{entry.period[locale]}</p><dl><dt>{c.before}</dt><dd>{entry.before[locale]}</dd><dt>{c.trigger}</dt><dd>{entry.trigger[locale]}</dd><dt>{c.after}</dt><dd>{entry.after[locale]}</dd></dl><details><summary>{c.sourceDetails}</summary><code>{entry.source_ref}</code></details></article>)}</details>}
  </section>
}
export function StudyConnections({ study, catalog }: { study: Study; catalog: StudyCatalog }) {
 const { locale, copy } = useLocale()
 return study.related_studies?.length ? <section className="panel"><h2>{copy.researchHub.related}</h2>{study.related_studies.map(link => { const target = catalog.studies.find(s => s.id === link.study_id); return target ? <article key={link.study_id}><a href={href(target.id)}>{target.translations?.[locale]?.title ?? target.title}</a><p>{link.rationale[locale]}</p></article> : null })}</section> : null
}
