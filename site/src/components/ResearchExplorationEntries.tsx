import EvidenceReviewDate from './EvidenceReviewDate'
import { useLocale } from '../i18n'
import { researchEntryCopy } from '../researchEntryCopy'

const routes = ['jumps', 'hermite', 'fundamentals'] as const
const href = (path: string) => import.meta.env.BASE_URL + path

export default function ResearchExplorationEntries() {
  const { locale } = useLocale()
  const text = researchEntryCopy[locale]
  return <section className="research-exploration-entries" aria-labelledby="research-exploration-entries-title">
    <div className="section-heading"><h2 id="research-exploration-entries-title">{text.title}</h2><p className="panel-note">{text.note}</p></div>
    <div className="study-grid">{routes.map(route => <article className="panel exploration-entry" key={route}>
      <span className="tag">{text[route].stage}</span>
      <h3><a href={href(route)}>{text[route].title} →</a></h3>
      <p>{text[route].description}</p><EvidenceReviewDate recordKey={route} />
      <p className="panel-note">{route === 'fundamentals' ? <><a href={href('fundamentals#data-availability')}>{text.availability}</a> · <a href={href('data/fundamental-snapshot.json')}>{text.snapshot}</a></> : <a href={href('quality')}>{text.sourceQuality}</a>}</p>
    </article>)}</div>
  </section>
}

export function Alpha810CatalogEntry() {
  const { locale } = useLocale()
  const text = researchEntryCopy[locale].alpha810
  return <section className="panel alpha810-catalog-entry" aria-labelledby="alpha810-catalog-title">
    <span className="tag">{text.stage}</span><h2 id="alpha810-catalog-title">{text.title}</h2>
    <p>{text.description}</p><EvidenceReviewDate recordKey="alpha810" /><a className="section-link" href={href('alpha810')}>{text.link}</a>
  </section>
}

export function ResearchStudiesLink() {
  const { locale } = useLocale()
  return <p className="study-navigation-links"><a href={href('studies')}>{researchEntryCopy[locale].back}</a></p>
}
