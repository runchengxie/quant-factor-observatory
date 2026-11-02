import { useLocale } from '../i18n'
import type { ExplorationChart, StudyExplorationData } from '../studyExploration'
import StudyComparisonChart, { formatStudyEvidence, formatStudyValue } from './StudyComparisonChart'

export default function ExpandedStudyReader({ data }: { data: StudyExplorationData }) {
  const { locale, copy } = useLocale()
  const reader = data.reader
  if (!reader) return null
  const labels = copy.studyExploration
  const claimed = new Set<string>()
  const sections = reader.sections.map(section => ({
    ...section,
    charts: section.chart_ids.flatMap(id => {
      const chart = data.charts.find(item => item.id === id)
      if (!chart || claimed.has(id)) return []
      claimed.add(id)
      return [chart]
    }),
  }))
  const remaining = data.charts.filter(chart => !claimed.has(chart.id))
  const chartLink = (id: string) => `#study-chart-${id}`
  const evidence = (chart: ExplorationChart) => <section key={chart.id} id={`study-chart-${chart.id}`} className="study-expanded-chart" aria-labelledby={`chart-title-${chart.id}`}>
    <h4 id={`chart-title-${chart.id}`}>{chart.title[locale]}</h4>
    <p className="panel-note">{chart.metric[locale]}</p>
    <p className="study-chart-context">{chart.context[locale]}</p>
    <p className="study-chart-mobile-note">{labels.expandedScrollNote}</p>
    <p className="panel-note">{reader.legend_note[locale]}</p>
    <StudyComparisonChart chart={chart} locale={locale} interactive />
    <p className="study-intermediate-conclusion">{chart.interpretation[locale]}</p>
    <span className="study-evidence-sources">{labels.source} · {chart.source_ids.map(id => <a key={id} href={`#study-source-${data.study_id}-${id}`}>{data.sources.find(source => source.id === id)?.label[locale]}</a>)}</span>
    <div className="study-values">
      <h5>{labels.expandedValues}</h5>
      <div className="table-scroll"><table className="factor-table">
        <caption>{chart.title[locale]} · {chart.metric[locale]}</caption>
        <thead><tr><th>{labels.category}</th>{chart.series.map(series => <th key={series.id}>{series.label[locale]}</th>)}</tr></thead>
        <tbody>{chart.categories.map((category, index) => <tr key={index}>
          <th scope="row">{category[locale]}</th>
          {chart.series.map(series => <td key={series.id}>{formatStudyValue(series.values[index], chart, locale)}
            {(series.months || series.lower) && <small className="study-interval">{formatStudyEvidence(series, index, chart, locale)}</small>}
          </td>)}
        </tr>)}</tbody>
      </table></div>
    </div>
  </section>
  return <div className="study-expanded-reader">
    <section className="panel study-reader" aria-labelledby="study-reader-title">
      <h2 id="study-reader-title">{reader.title[locale]}</h2>
      <p className="study-reader-verdict">{reader.verdict[locale]}</p>
      <nav aria-label={reader.navigation[locale]} className="study-reader-nav">
        {sections.map(section => <a key={section.id} href={`#reader-${section.id}`}>{section.title[locale]}</a>)}
        <a href="#study-exploration-comparison">{labels.remainingComparisons}</a>
        <a href="#study-exploration-path">{labels.path}</a>
        <a href="#study-exploration-sources">{labels.sources}</a>
      </nav>
    </section>
    {sections.map(section => <section className="panel study-reader-block" key={section.id} id={`reader-${section.id}`} aria-labelledby={`reader-title-${section.id}`}>
      <div className="study-reader-body">
        <h3 id={`reader-title-${section.id}`}>{section.title[locale]}</h3>
        {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph[locale]}</p>)}
        <nav className="study-reader-charts" aria-label={section.title[locale]}>{section.chart_ids.map(id => <a className="quiet-button" key={id} href={chartLink(id)}>{reader.open_chart[locale]} · {data.charts.find(chart => chart.id === id)?.title[locale]}</a>)}</nav>
      </div>
      {section.charts.map(evidence)}
    </section>)}
    <section className="panel study-reader-block" id="study-exploration-comparison" aria-labelledby="study-comparison-title">
      <h3 id="study-comparison-title">{labels.remainingComparisons}</h3>
      <nav className="study-reader-charts" aria-label={labels.remainingComparisons}>{remaining.map(chart => <a className="quiet-button" key={chart.id} href={chartLink(chart.id)}>{chart.title[locale]}</a>)}</nav>
      {remaining.map(evidence)}
    </section>
  </div>
}
