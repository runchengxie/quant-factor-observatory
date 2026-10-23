import type { StudyCatalog } from '../types'
import { useLocale } from '../i18n'
import { homeCopy } from '../homeCopy'
import EvidenceReviewDate from '../components/EvidenceReviewDate'
import { SourceReviewWarning } from '../components/ResearchEvidenceHub'
import '../styles/reader-home.css'

const href = (route: string) => import.meta.env.BASE_URL + route

export default function OverviewPage({ studies }: { studies: StudyCatalog }) {
  const { locale, copy } = useLocale()
  const text = homeCopy[locale]
  const selected = studies.studies
    .map(study => ({ study, content: { ...study, ...study.translations?.[locale] } }))
    .filter(({ content }) => content.rows.length > 0 && content.findings.length > 0)
    .slice(0, 3)
  return <main className="page reader-home">
    <section className="hero">
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1><p className="lede">{text.intro}</p>
      <div className="home-actions"><a className="home-primary-link" href={href('studies')}>{text.browse} →</a><a href={href('studies/compare')}>{text.compare} →</a></div>
    </section>
    <section className="section home-findings" aria-labelledby="home-findings-title">
      <div className="section-heading"><p className="eyebrow">{text.selected}</p>
        <h2 id="home-findings-title">{text.findings}</h2>
        <p className="section-description">{text.selectionNote}</p>
      </div>
      <div className="home-finding-grid">{selected.map(({ study, content }) =>
        <article className="home-finding-card" key={study.id}>
          <span className={'study-status study-status-' + study.status}>{content.status_label}</span>
          <small>{content.family}</small>
          <h3><a href={href('studies/' + study.id)}>{content.title}</a></h3>
          <p>{copy.studyBriefs[study.id] ?? content.findings[0]}</p>
          <SourceReviewWarning study={study} />
          <dl className="home-study-sample"><dt>{text.sample}</dt><dd>{study.evidence_summary?.sample[locale] ?? content.period}</dd></dl>
          <div className="home-finding-limit"><strong>{text.limit}</strong>{content.limits[0]}</div>
          <EvidenceReviewDate recordKey={study.id} />
          <a className="study-link" href={href('studies/' + study.id)}>{text.read}</a>
        </article>)}</div>
      {!selected.length && <p role="status">{text.empty}</p>}
      <p className="home-records"><a href={href('studies')}>{text.browse} →</a><a href={href('studies/evidence')}>{text.records} →</a></p>
    </section>
    <section className="section home-tools" aria-labelledby="home-tools-title">
      <div className="section-heading"><p className="eyebrow">{text.tools}</p><h2 id="home-tools-title">{text.toolsTitle}</h2><p className="section-description">{text.toolsIntro}</p></div>
      <div className="home-tool-grid">
        <a className="home-tool-card" href={href('factors')}><h3>{text.catalogTitle}</h3><p>{text.catalogBody}</p><span>{text.catalogLink}</span></a>
        <a className="home-tool-card" href={href('alpha810')}><h3>{text.alphaTitle}</h3><p>{text.alphaBody}</p><span>{text.alphaLink}</span></a>
      </div>
    </section>
    <section className="section home-observations" aria-labelledby="home-observations-title">
      <div className="section-heading"><p className="eyebrow">{text.observations}</p><h2 id="home-observations-title">{text.observationsTitle}</h2><p className="section-description">{text.observationsNote}</p></div>
      <div className="home-observation-grid">{(['jumps', 'hermite', 'fundamentals'] as const).map(route =>
        <a href={href(route)} key={route}><h3>{text[route]} →</h3><p>{text[route + 'Body' as keyof typeof text]}</p></a>)}</div>
      <p className="home-records"><a href={href('quality')}>{text.quality} →</a></p>
    </section>
  </main>
}
