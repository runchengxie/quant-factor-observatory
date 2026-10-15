import { useLocale } from '../i18n'
import { forecastSelection } from '../forecastSelection'
import { forecastSelectionCopy } from '../forecastSelectionCopy'

export default function ForecastSelectionPilot() {
  const { locale } = useLocale()
  const c = forecastSelectionCopy[locale], data = forecastSelection
  const number = new Intl.NumberFormat(locale)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(data.asOf + 'T00:00:00Z'))
  return <section id="forecast-selection-pilot" className="panel" aria-labelledby="forecast-selection-title">
    <p className="eyebrow">{c.asOf.replace('{date}', date)}</p>
    <h2 id="forecast-selection-title">{c.title}</h2>
    <p>{c.lead}</p>
    <div className="selection-pilot-cohorts">{data.cohorts.map(cohort => <article key={cohort.id}>
      <h3>{c[cohort.id]}</h3>
      <p className="panel-note">{cohort.id === 'historical' ? c.historicalStatus : c.forwardStatus}</p>
      <strong>{number.format(cohort.same)} / {number.format(data.holdings)}</strong>
      <div className="selection-pilot-slots" role="img" aria-label={c.chart.replace('{cohort}', c[cohort.id]).replace('{same}', number.format(cohort.same)).replace('{total}', number.format(data.holdings))}>
        {Array.from({ length: data.holdings }, (_, index) => <span aria-hidden="true" className={'selection-slot' + (index >= cohort.same ? ' changed' : '')} key={index} />)}
      </div>
      <p className="panel-note">{c.scope}<br />{number.format(cohort.candidates)} / {number.format(cohort.common)}</p>
    </article>)}</div>
    <p className="panel-note">{c.same} · {c.changed}</p>
    <p>{c.units}</p>
    <p>{c.meaning}</p>
    <h3>{c.noReturns}</h3>
    <p>{c.orders}</p>
    <p>{c.futureNote}</p>
    <details><summary>{c.rules}</summary><p>{c.buyRule}</p><p>{c.sellRule}</p></details>
    <p><a href={`https://github.com/runchengxie/quant-factor-observatory/blob/main/docs/research/three-arm-selection-pilot-20261015.${locale}.md`}>{c.sources}</a></p>
  </section>
}
