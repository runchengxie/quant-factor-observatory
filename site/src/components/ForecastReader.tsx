import { useLocale } from '../i18n'
import { forecastReaderCopy } from '../forecastReaderCopy'
import type { ForecastGuideData } from '../forecastGuide'

const improvementRates = [
  { id: 'all', values: [0.479, 0.520] },
  { id: 'level', values: [0.433, 0.574] },
  { id: 'levelChange', values: [0.773, 0.886] },
  { id: 'directChange', values: [0.757, 0.879] },
] as const

function ImprovementChart({ copy, locale }: { copy: (typeof forecastReaderCopy)['en-US']; locale: string }) {
  const percent = (value: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
  const groups = [
    { id: 'profit', values: improvementRates.map(row => row.values[0]) },
    { id: 'cash', values: improvementRates.map(row => row.values[1]) },
  ] as const
  return <div className="forecast-improvement-chart" role="group" aria-label={copy.improvementChartTitle}>
    <div className="forecast-improvement-legend">{improvementRates.map((row, index) => <span key={row.id}><i className={`series-${index}`} />{copy.improvementMethods[row.id]}</span>)}</div>
    <div className="forecast-improvement-groups">{groups.map(group => <article key={group.id}>
      <h3>{copy.improvementTargets[group.id]}</h3>
      {group.values.map((value, index) => <div className="forecast-improvement-row" key={improvementRates[index].id}>
        <span>{copy.improvementMethods[improvementRates[index].id]}</span>
        <div className="forecast-improvement-track" role="img" aria-label={`${copy.improvementMethods[improvementRates[index].id]} ${percent(value)}`}><i className={`series-${index}`} style={{ width: `${value * 100}%` }} /></div>
        <strong>{percent(value)}</strong>
      </div>)}
    </article>)}</div>
  </div>
}

export default function ForecastReader({ guide, part = 'intro' }: { guide: ForecastGuideData; part?: 'intro' | 'comparisons' | 'consistency' | 'business' | 'investment' }) {
  const { locale } = useLocale(), c = forecastReaderCopy[locale]
  const number = (value: number | null) => value === null ? c.unavailable : new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)
  const comparisons = [
    { target: 'roa', model: 'pairwise', title: c.roa, note: c.roaNote },
    { target: 'margin', model: 'pointwise', title: c.margin, note: c.marginNote },
    { target: 'cash_conversion', model: 'pairwise', title: c.cash, note: c.cashNote },
  ]
  const cashModel = guide.groups.find(g => g.target === 'cash_conversion' && g.horizon === 1)!.models.find(m => m.id === 'pairwise')!
  const periods = cashModel.paired_formations
  const wins = cashModel.win_fraction === null ? null : Math.round(cashModel.win_fraction * periods)
  return <section className="forecast-reader" aria-labelledby={part === 'intro' ? 'forecast-reader-title' : undefined}>
    {part === 'intro' && <section className="panel"><h2 id="forecast-reader-title">{c.title}</h2><p className="lede">{guide.robustness ? c.latestLead : c.lead}</p>{guide.robustness && <p><a href={`https://github.com/runchengxie/quant-factor-observatory/blob/main/docs/research/financial-candidates-20261014.${locale}.md`}>{c.newStudy}</a></p>}{guide.robustness && <p><a href={`https://github.com/runchengxie/quant-factor-observatory/blob/main/docs/research/change-utility-20261015.${locale}.md`}>{c.changeStudy}</a></p>}<h3>{c.question}</h3><p>{c.setup}</p></section>}
    {part === 'comparisons' && <section className="panel"><p className="eyebrow">{c.retained}</p><h2>{c.scores}</h2><p>{c.scale}</p><div className="forecast-reader-comparisons">{comparisons.map(item => {
      const group = guide.groups.find(g => g.target === item.target && g.horizon === 1)!
      const methods = [{ label: c.latest, value: group.models.find(m => m.id === 'persistence')!.mean_rank_ic }, { label: c.learned, value: group.models.find(m => m.id === item.model)!.mean_rank_ic }]
      return <article key={item.target} data-reader-target={item.target}><h3>{item.title}</h3><p className="panel-note">{c.horizon}</p><p className="panel-note">{c.coverage} {group.report_start} / {group.report_end}</p><div role="img" aria-label={`${item.title}. ${methods.map(m => `${m.label} ${number(m.value)}`).join('. ')}`}>{methods.map((method, i) => <div className="forecast-reader-bar" key={method.label}><span>{method.label}</span><strong>{number(method.value)}</strong><div className="forecast-reader-track"><i style={{ width: `${Math.max(0, method.value ?? 0) * 100}%`, background: i === 0 ? 'var(--study-series-1, #315b74)' : 'var(--study-series-2, #b64d33)' }} /></div></div>)}</div><p>{item.note}</p></article>
    })}</div><p className="panel-note">{c.scope}</p></section>}
    {part === 'consistency' && <section className="panel"><h2>{c.consistency}</h2>{wins !== null && <div className="forecast-reader-periods" role="img" aria-label={`${c.won} ${wins}/${periods}. ${c.lost} ${periods - wins}/${periods}`}>{Array.from({ length: Math.min(periods, 404) }, (_, index) => <i key={index} className={index < wins ? 'won' : ''} />)}</div>}<p className="panel-note">{c.grouping}</p><p><strong>{wins === null ? c.unavailable : `${wins} / ${periods}`}</strong> {c.won}</p><p>{wins === null ? c.consistencyUnavailable : c.consistencyNote}</p></section>}
    {part === 'business' && <section className="panel"><h2>{c.business}</h2><p>{c.businessNote}</p><h3>{c.improvementChartTitle}</h3><p>{c.improvementChartNote}</p><ImprovementChart copy={c} locale={locale} /><p className="panel-note">{c.improvementChartLimit}</p><p><a href={`https://github.com/runchengxie/quant-factor-observatory/blob/main/docs/research/change-utility-20261015.${locale}.md`}>{c.changeStudy}</a></p></section>}
    {part === 'investment' && <section className="panel"><h2>{c.investment}</h2><p>{c.investmentNote}</p></section>}
  </section>
}
