import { lazy, Suspense, useState } from 'react'
import { StudyConnections, SourceReviewWarning, StudyEvidenceSummary, StudyFilters, filterStudies } from '../components/ResearchEvidenceHub'
import type { RdAnnualEvidence, Study, StudyCatalog, StudySeries } from '../types'
import { useLocale } from '../i18n'
import { RdAnnualEvidencePanel } from './RdAnnualEvidence'
import { rdInvestmentCopy } from '../rdInvestmentCopy'
const StudyNavigation = lazy(() => import('../components/StudyNavigation'))
const StudyExploration = lazy(() => import('../components/StudyExploration'))
const href = (id: string) => `${import.meta.env.BASE_URL}studies/${id}`
const localizedStudy = (study: Study, locale: 'en-US' | 'zh-CN') => ({ ...study, ...(study.translations?.[locale] ?? {}) })
const localizedSeries = (series: StudySeries, locale: 'en-US' | 'zh-CN') => ({ ...series, ...(series.translations[locale] ?? {}) })
const taxonomyLabels = (study: Study, labels: Record<string, string>) => [
  ...(study.market ? [study.market] : []),
  ...(study.method ?? []),
  ...(study.frequency ?? []),
  ...(study.evidence_stage ? [study.evidence_stage] : []),
].map((key) => labels[key] ?? key)

export function StudiesPage({ catalog }: { catalog: StudyCatalog }) {
  const { locale, copy } = useLocale()
  const english = locale === 'en-US'
  const [query, setQuery] = useState(''), [market, setMarket] = useState(''), [stage, setStage] = useState('')
  const visible = filterStudies(catalog.studies, locale, query, market, stage, copy.studyBriefs)
  const groupedIds = new Set((catalog.series ?? []).flatMap((series) => series.study_ids))
  const ungroupedStudies = visible.filter((study) => !groupedIds.has(study.id))
  return <main className="page study-page">
    <section className="detail-head"><p className="eyebrow">FACTOR RESEARCH / STUDIES</p><h1>{english ? 'Research studies' : '因子研究专题'}</h1><p className="lede">{english ? 'Review research hypotheses and historical evidence with explicit data definitions, validation status, and open questions.' : '从研究假设到历史证据，逐项标明数据口径、检验状态和仍待解决的问题。'}</p><span className="badge">{english ? 'Updated' : '更新于'} {catalog.updated_at}</span></section>
    <p>{copy.researchHub.indexNote}</p>
    <p className="panel-note">{english ? 'Reading the tags: “cross-sectional” compares stocks on the same date; a “portfolio replay” rebuilds holdings from historical rules; a “prospective holdout” is a future period kept aside until the method is fixed. These labels describe how a study was checked, not how strong its conclusion is.' : '标签这样理解：“截面排序”是在同一天比较不同股票；“组合回放”是按历史规则重建持仓；“前瞻留出期”是先封存、等方法固定后再检验的未来区间。这些标签说明研究怎样检查，不代表结论有多可靠。'}</p>
    <StudyFilters studies={catalog.studies} query={query} market={market} stage={stage} setQuery={setQuery} setMarket={setMarket} setStage={setStage} />
    <p className="study-navigation-links"><a href={href('evidence')}>{copy.researchHub.evidenceLink}</a><a href={href('compare')}>{copy.researchHub.compare}</a></p>
    {!visible.length && <p role="status">{copy.researchHub.empty}</p>}
    {(catalog.series ?? []).map((rawSeries) => {
      const series = localizedSeries(rawSeries, locale)
      const studies = visible.filter((study) => rawSeries.study_ids.includes(study.id))
      if (!studies.length) return null
      return <section className="study-series" key={series.id} aria-labelledby={`series-${series.id}`}>
        <div className="panel study-series-intro">
          <p className="eyebrow">{copy.studies.seriesEyebrow}</p><h2 id={`series-${series.id}`}>{series.title}</h2>
          <p>{series.summary}</p><p>{series.scope}</p><p className="study-series-boundary">{series.evidence_boundary}</p>
          {series.id === 'fundamental' && <p className="study-series-boundary">{english ? `${series.candidate_coverage.candidate_ids.length} catalog definitions are tracked as hypotheses; ${series.candidate_coverage.candidate_level_predictive_validation_ids.length} have published candidate-level predictive validation.` : `当前跟踪 ${series.candidate_coverage.candidate_ids.length} 个因子目录定义，均作为研究假设；已发布逐因子预测性验证结果 ${series.candidate_coverage.candidate_level_predictive_validation_ids.length} 个。`}</p>}
          <a className="section-link" href={`${import.meta.env.BASE_URL}${series.candidate_href}`}>{copy.studies.candidateLink} ({series.candidate_count})</a>
        </div>
        <section className="study-grid" aria-label={series.title}>{studies.map((rawStudy) => {
          const study = localizedStudy(rawStudy, locale)
          return <a className="study-card" href={href(study.id)} key={study.id}>
            <span className={`study-status study-status-${study.status}`}>{study.status_label}</span>
            <small>{study.family}</small><h2>{study.title}</h2><p>{copy.studyBriefs[study.id] ?? study.summary}</p><SourceReviewWarning study={study} />
            <p className="study-card-scope">{study.evidence_summary?.sample[locale] ?? study.period}</p>
            <p className="study-card-gap">{copy.researchHub.gap}{english ? ': ' : '：'}{study.limits[0]}</p>
            <div className="study-taxonomy" aria-label={copy.studies.studyClassifications}>{taxonomyLabels(study, copy.studyTaxonomy).map((label) => <span className="tag" key={label}>{label}</span>)}</div>
            {study.exploration_counts && <p className="study-exploration-preview">{study.exploration_counts.steps} {copy.studyExploration.steps} · {study.exploration_counts.charts} {copy.studyExploration.charts}</p>}
            <span className="study-link">{english ? 'Read study →' : '阅读研究 →'}</span>
          </a>
        })}</section>
      </section>
    })}
    {ungroupedStudies.length > 0 && <section className="study-series study-ungrouped">
      {catalog.series?.length ? <div className="section-heading"><h2>{copy.studies.otherStudies}</h2></div> : null}
      <div className="study-grid">{ungroupedStudies.map((rawStudy) => { const study = localizedStudy(rawStudy, locale); return <a className="study-card" href={href(study.id)} key={study.id}>
        <span className={`study-status study-status-${study.status}`}>{study.status_label}</span>
        <small>{study.family}</small><h2>{study.title}</h2><p>{copy.studyBriefs[study.id] ?? study.summary}</p><SourceReviewWarning study={study} />
        <p className="study-card-scope">{study.evidence_summary?.sample[locale] ?? study.period}</p>
        <p className="study-card-gap">{copy.researchHub.gap}{english ? ': ' : '：'}{study.limits[0]}</p>
        {study.method || study.market || study.evidence_stage ? <div className="study-taxonomy" aria-label={copy.studies.studyClassifications}>{taxonomyLabels(study, copy.studyTaxonomy).map((label) => <span className="tag" key={label}>{label}</span>)}</div> : null}
        {study.exploration_counts && <p className="study-exploration-preview">{study.exploration_counts.steps} {copy.studyExploration.steps} · {study.exploration_counts.charts} {copy.studyExploration.charts}</p>}
            <span className="study-link">{english ? 'Read study →' : '阅读研究 →'}</span>
      </a> })}</div>
    </section>}
  </main>
}

export function StudyDetailPage({ study, updatedAt, rdAnnual, catalog }: { catalog?: StudyCatalog; study: Study | undefined; updatedAt: string; rdAnnual?: RdAnnualEvidence }) {
  const { locale, copy } = useLocale()
  const english = locale === 'en-US'
  if (!study) return <main className="page"><a className="back" href={`${import.meta.env.BASE_URL}studies`}>← {english ? 'Back to research studies' : '返回研究专题'}</a><h1>{english ? 'Study not found' : '找不到这项研究'}</h1></main>
  const content = localizedStudy(study, locale)
  const rdGuide = rdInvestmentCopy[locale]
  return <main className="page study-page">
    <a className="back" href={`${import.meta.env.BASE_URL}studies`}>← {english ? 'All studies' : '全部研究专题'}</a>
    <section className="detail-head"><p className="eyebrow">{content.family}</p><h1>{content.title}</h1><p className="lede">{content.summary}</p><div className="detail-tags"><span className={`study-status study-status-${study.status}`}>{content.status_label}</span><span className="tag">{copy.studies.updated} {updatedAt}</span>{taxonomyLabels(study, copy.studyTaxonomy).map((label) => <span className="tag" key={label}>{label}</span>)}</div></section>
    <div className="study-columns"><section className="panel"><p className="eyebrow">{copy.studies.highlights}</p><h2>{copy.studies.whatCan}</h2><ul>{content.findings.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="panel"><p className="eyebrow">{copy.studies.limitsLabel}</p><h2>{english ? 'What this evidence does not establish' : '还不能据此推断什么'}</h2><ul>{content.limits.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
    {study.id === 'rd-investment' && <section className="panel rd-method-panel"><p className="eyebrow">{rdGuide.eyebrow}</p><h2>{rdGuide.title}</h2><p className="lede">{rdGuide.lead}</p><section><h3>{rdGuide.rankIcTitle}</h3><p>{rdGuide.rankIcNote}</p></section><details open><summary>{rdGuide.variantsTitle}</summary><div className="table-scroll"><table className="factor-table"><thead><tr><th>{rdGuide.variantNameLabel}</th><th>{rdGuide.variantExplanationLabel}</th></tr></thead><tbody>{rdGuide.variants.map(([name, definition]) => <tr key={name}><th scope="row">{name}</th><td>{definition}</td></tr>)}</tbody></table></div></details><details><summary>{rdGuide.timingTitle}</summary><ul className="method-notes">{rdGuide.timingNotes.map((note) => <li key={note}>{note}</li>)}</ul></details><details><summary>{rdGuide.top200Title}</summary><p>{rdGuide.top200Note}</p></details><details><summary>{rdGuide.methodsTitle}</summary><p>{rdGuide.methodsNote}</p></details><details><summary>{rdGuide.boundaryTitle}</summary><p>{rdGuide.boundary}</p></details><p className="panel-note">{rdGuide.sourceLead} <a href={`${import.meta.env.BASE_URL}research/rd-investment-method.html`}>{rdGuide.sourceLink}</a>.</p></section>}
    <StudyEvidenceSummary study={study} />
    <section className="study-brief"><article><p className="eyebrow">{copy.studies.question}</p><h2>{copy.studyQuestions[study.id] ?? content.title}</h2></article><article><p className="eyebrow">{copy.studies.design}</p><p>{content.source_note}</p><small>{copy.studies.interval}: {content.period}</small></article><article><p className="eyebrow">{copy.studies.openGap}</p><p>{content.limits[0] ?? (english ? 'No published evidence limits are available.' : '暂无已发布的证据边界。')}</p></article></section>
    {study.navigation_asset && <Suspense fallback={<p className="panel">{copy.loading}</p>}><StudyNavigation study={study} /></Suspense>}
    {study.exploration_asset && <Suspense fallback={<p className="panel">{copy.studyExploration.loading}</p>}><StudyExploration study={study} /></Suspense>}
    {content.rows.length > 0 && <section className="panel"><div className="section-heading"><p className="eyebrow">AGGREGATE EVIDENCE</p><h2>{english ? 'Historical comparison' : '历史对照'}</h2></div><div className="table-scroll"><table className="factor-table"><thead><tr>{content.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{content.rows.map((row) => <tr key={row[0]}>{row.map((value, index) => <td key={content.columns[index]}>{value}</td>)}</tr>)}</tbody></table></div></section>}
    {study.id === 'rd-investment' && rdAnnual ? <RdAnnualEvidencePanel data={rdAnnual} /> : null}
    {study.id === 'rd-investment' && !rdAnnual ? <p className="panel rd-annual-unavailable">{copy.rdAnnual.annualUnavailable}</p> : null}
    {study.research_log?.length ? <section className="panel research-log"><div className="section-heading"><p className="eyebrow">EXPLORATION RECORD</p><h2>{english ? 'Research log' : '探索过程记录'}</h2></div><ol>{study.research_log.map((entry) => <li key={`${entry.date}-${entry.stage}`}><time>{entry.date}</time><div><strong>{english ? entry.stage_en : entry.stage}</strong><p>{english ? entry.note_en : entry.note}</p></div></li>)}</ol></section> : null}

    {catalog && <StudyConnections study={study} catalog={catalog} />}
    {study.source_url && study.id !== 'rd-investment' && <p className="study-source"><a href={study.source_url} target="_blank" rel="noopener noreferrer">{english ? 'View public method and evidence notes ↗' : '查看已公开的原始方法与数据核对 ↗'}</a></p>}
  </main>
}
