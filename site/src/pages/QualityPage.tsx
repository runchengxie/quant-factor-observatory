import { useState } from 'react'
import ContextStrip from '../components/ContextStrip'
import { loadRiskHistory } from '../data'
import { useLocale } from '../i18n'
import { riskHistoryCopy } from '../riskHistoryCopy'
import type { RiskHistory } from '../riskHistory'

const sourceNoteRevision = '7b7d2de3f6e714fef7003a269e429c3c97a73e05'
const number = (value: number, locale: string) => value.toLocaleString(locale)

export default function QualityPage({ riskHistory }: { riskHistory: RiskHistory | null }) {
  const { locale } = useLocale()
  const text = riskHistoryCopy[locale]
  const [history, setHistory] = useState(riskHistory)
  const coverage = history?.coverage
  const quality = history?.quality
  const sourceUrl = history
    ? 'https://github.com/' + history.source.producer_repository + '/blob/' + sourceNoteRevision + '/docs/research/historical-risk-retained-panel-20261014.en-US.md'
    : ''

  if (!history || !coverage || !quality) return <main className="page quality-page">
    <section className="detail-head"><p className="eyebrow">{text.quality}</p><h1>{text.source}</h1></section>
    <section className="panel"><p role="status">{text.noAsset}</p><button type="button" onClick={() => { void loadRiskHistory().then(setHistory) }}>{text.retry}</button></section>
  </main>

  return <main className="page quality-page">
    <a className="back" href={import.meta.env.BASE_URL}>{text.backOverview}</a>
    <section className="detail-head"><p className="eyebrow">{text.quality}</p><h1>{text.source}</h1><p className="lede">{text.notCurrent}</p><span className="badge">{text.archived}</span></section>
    <ContextStrip items={[
      { label: text.coverage, value: coverage.date_start + ' – ' + coverage.date_end },
      { label: text.observedDates, value: number(coverage.observed_dates, locale) },
      { label: text.eligible, value: number(quality.eligible_stock_days, locale) },
      { label: text.excluded, value: number(quality.excluded_stock_days, locale) },
    ]} />
    <section className="panel quality-metrics">
      <h2>{text.quality}</h2>
      <div className="mini-metrics">
        {[
          [text.full, quality.complete_risk_observations],
          [text.missingValues, quality.missing_value_count],
          [text.zeroRv, quality.zero_rv_count],
          [text.negative, quality.negative_risk_value_count],
          [text.rawIvhat, quality.raw_ivhat_above_rv_count],
          [text.rawReconcile, quality.raw_ivhat_rjv_reconciliation_failures],
          [text.additive, quality.rjv_rljv_rsjv_reconciliation_failures],
        ].map(([label, value]) => <div key={String(label)} className="metric-card"><span>{label}</span><strong>{number(Number(value), locale)}</strong></div>)}
      </div>
      <div className="table-scroll"><table className="factor-table" aria-label={text.quality}>
        <thead><tr><th>{text.panel}</th><th>{text.valid}</th><th>{text.missingValues}</th><th>{text.nonfinite}</th><th>{text.negative}</th></tr></thead>
        <tbody>{Object.entries(quality.panels).map(([name, panel]) => <tr key={name}>
          <th scope="row">{name}</th><td>{number(panel.valid_values, locale)}</td><td>{number(panel.missing_values, locale)}</td><td>{number(panel.nonfinite_values, locale)}</td><td>{number(panel.negative_risk_values ?? 0, locale)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section className="panel">
      <h2>{text.source}</h2>
      <dl className="research-dl">
        <div><dt>{text.sourceNote}</dt><dd><a href={sourceUrl} target="_blank" rel="noreferrer">{history.source.source_note_id}</a></dd></div>
        <div><dt>{text.reviewDate}</dt><dd>{history.source.review_date}</dd></div>
        <div><dt>{text.sourceRevision}</dt><dd><code>{history.source.producer_revision}</code></dd></div>
        <div><dt>{text.evidenceStage}</dt><dd>{history.source.evidence_stage}</dd></div>
        <div><dt>{text.pitQualification}</dt><dd>{coverage.point_in_time_qualified ? text.yes : text.no}</dd></div>
      </dl>
      <details><summary>{text.sourceHash}</summary><ul className="source-hash-list">{Object.entries(history.source.source_hashes).map(([name, hash]) => <li key={name}><code>{name}</code><code>{hash}</code></li>)}</ul></details>
      <p className="panel-note">{text.notCurrent} {history.limitations[locale].join(' ')}</p>
    </section>
    <section className="panel"><h2>{text.related}</h2><p><a href={import.meta.env.BASE_URL + 'jumps?mode=historical'}>{locale === 'en-US' ? 'Explore jump aggregates →' : '浏览跳跃聚合 →'}</a></p><p><a href={import.meta.env.BASE_URL + 'hermite?mode=historical&granularity=annual'}>{locale === 'en-US' ? 'Explore RV-shape history →' : '浏览实现方差形态历史 →'}</a></p><p><a href={import.meta.env.BASE_URL + 'studies'}>{text.studies} →</a></p></section>
  </main>
}
