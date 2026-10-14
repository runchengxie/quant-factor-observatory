import { useLocale } from '../i18n'
import { forecastReaderCopy } from '../forecastReaderCopy'
import type { ForecastGuideData } from '../forecastGuide'

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
    {part === 'intro' && <section className="panel"><h2 id="forecast-reader-title">{c.title}</h2><p className="lede">{guide.robustness ? c.latestLead : c.lead}</p><h3>{c.question}</h3><p>{c.setup}</p></section>}
    {part === 'comparisons' && <section className="panel"><p className="eyebrow">{c.retained}</p><h2>{c.scores}</h2><p>{c.scale}</p><div className="forecast-reader-comparisons">{comparisons.map(item => {
      const group = guide.groups.find(g => g.target === item.target && g.horizon === 1)!
      const methods = [{ label: c.latest, value: group.models.find(m => m.id === 'persistence')!.mean_rank_ic }, { label: c.learned, value: group.models.find(m => m.id === item.model)!.mean_rank_ic }]
      return <article key={item.target} data-reader-target={item.target}><h3>{item.title}</h3><p className="panel-note">{c.horizon}</p><p className="panel-note">{c.coverage} {group.report_start} / {group.report_end}</p><div role="img" aria-label={`${item.title}. ${methods.map(m => `${m.label} ${number(m.value)}`).join('. ')}`}>{methods.map((method, i) => <div className="forecast-reader-bar" key={method.label}><span>{method.label}</span><strong>{number(method.value)}</strong><div className="forecast-reader-track"><i style={{ width: `${Math.max(0, method.value ?? 0) * 100}%`, background: i === 0 ? 'var(--study-series-1, #315b74)' : 'var(--study-series-2, #b64d33)' }} /></div></div>)}</div><p>{item.note}</p></article>
    })}</div><p className="panel-note">{c.scope}</p></section>}
    {part === 'consistency' && <section className="panel"><h2>{c.consistency}</h2>{wins !== null && <div className="forecast-reader-periods" role="img" aria-label={`${c.won} ${wins}/${periods}. ${c.lost} ${periods - wins}/${periods}`}>{Array.from({ length: Math.min(periods, 404) }, (_, index) => <i key={index} className={index < wins ? 'won' : ''} />)}</div>}<p className="panel-note">{c.grouping}</p><p><strong>{wins === null ? c.unavailable : `${wins} / ${periods}`}</strong> {c.won}</p><p>{wins === null ? c.consistencyUnavailable : c.consistencyNote}</p></section>}
    {part === 'business' && <section className="panel"><h2>{c.business}</h2><p>{c.businessNote}</p></section>}
    {part === 'investment' && <section className="panel"><h2>{c.investment}</h2><p>{c.investmentNote}</p></section>}
  </section>
}
