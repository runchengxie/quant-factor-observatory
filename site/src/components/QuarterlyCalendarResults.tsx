import { useLocale } from '../i18n'

const results = [
  { id: 'roa', values: [[.805327, .846048, -.040721], [.642232, .766698, -.124466], [.615658, .712718, -.097059], [.689804, .715444, -.025640]] },
  { id: 'margin', values: [[.944548, .954452, -.009903], [.917441, .926953, -.009512], [.893958, .903522, -.009563], [.877576, .890488, -.012912]] },
  { id: 'growth', values: [[.256982, .739415, -.482433], [.128928, .523947, -.395019], [.078838, .314707, -.235869], [.012966, .121487, -.108521]] },
  { id: 'cash', values: [[-.017369, .120084, -.137453], [-.031315, .184602, -.215917], [-.013812, .133443, -.147255], [.009013, .402017, -.393004]] },
] as const

const copy = {
  'en-US': {
    title: 'With every quarter included, the model still trails a simple forecast',
    intro: 'This newer run matches reports to the actual quarter end and includes all four source quarters. Each cell compares the learned model with simply carrying today’s value forward.',
    target: 'Financial measure', horizon: 'Quarters ahead', xgb: 'Model', current: 'Carry current value', difference: 'Difference', scoreLegend: 'Numbers in each cell are model score / carry-current-value score.',
    note: 'The bar starts at zero. Left means the model’s company ranking was worse; right means it was better. These are financial ranking scores, not stock returns.',
    coverage: 'The one-quarter test now has 57–58 report periods, including every fiscal quarter. The old run had 41 and no third-quarter reports. Corrected matching recovered 15,655 missing labels across all target/horizon pairs on records shared with the old run.',
    scope: 'The earlier charts below use other saved model runs and, in some cases, different target definitions. Read them as separate experiments. This table is the complete-quarter XGBoost comparison.',
    targets: { roa: 'Asset profitability', margin: 'Gross margin', growth: 'Revenue growth', cash: 'Operating cash flow / revenue' },
  },
  'zh-CN': {
    title: '四个财季都纳入后，模型仍排不过简单方法',
    intro: '这次重跑按真正的财季末日找未来财报，四个财季都纳入检验。每个格子比较机器学习模型和“把当前数值沿用到未来”这两种方法。',
    target: '财务指标', horizon: '预测多少期后', xgb: '模型分数', current: '沿用当前数值', difference: '两者差值', scoreLegend: '每个格子里先写模型分数，再写沿用当前值的分数。',
    note: '横条从中线的 0 开始。向左表示模型给公司的排序更差，向右表示模型更好。分数衡量财务指标排序，不是股票收益。',
    coverage: '新的一期检验有 57 到 58 个财报期，四个财季都有。旧结果只有 41 期，第三财季一条也没有。在新旧都有的记录中，所有指标和预测期限合计找回 15,655 个旧流程漏掉的未来财报数值。',
    scope: '下方早期图表来自其他模型运行，有些财务指标的定义也不同。它们应当看作另外几组检验。这里是季度补齐后的 XGBoost 对照结果。',
    targets: { roa: '资产盈利能力', margin: '毛利率', growth: '营收增长', cash: '经营现金流/营收' },
  },
} as const

export default function QuarterlyCalendarResults() {
  const { locale } = useLocale()
  const c = copy[locale]
  const number = (value: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)
  return <section className="panel quarterly-calendar-results">
    <h2>{c.title}</h2><p>{c.intro}</p><p className="panel-note">{c.scoreLegend}</p>
    <div className="table-scroll"><table className="factor-table quarterly-calendar-table">
      <caption>{c.title}</caption>
      <thead><tr><th scope="col">{c.target}</th>{[1, 2, 3, 4].map(h => <th scope="col" key={h}>{h} {c.horizon}</th>)}</tr></thead>
      <tbody>{results.map(row => <tr key={row.id}><th scope="row">{c.targets[row.id]}</th>{row.values.map(([model, baseline, delta], i) => {
        const width = `${Math.min(48, Math.abs(delta) / .5 * 48)}%`
        return <td key={i}>
          <span className="quarterly-calendar-scores">{number(model)} / {number(baseline)}</span>
          <span className="quarterly-calendar-track" role="img" aria-label={`${c.xgb} ${number(model)}, ${c.current} ${number(baseline)}, ${c.difference} ${number(delta)}`}>
            <i className="quarterly-calendar-zero" />
            <i className={`quarterly-calendar-delta ${delta < 0 ? 'negative' : 'positive'}`} style={delta < 0 ? { left: `calc(50% - ${width})`, width } : { left: '50%', width }} />
          </span>
          <strong className={delta < 0 ? 'quarterly-calendar-negative' : 'quarterly-calendar-positive'}>{c.difference} {number(delta)}</strong>
        </td>
      })}</tr>)}</tbody>
    </table></div>
    <p className="panel-note">{c.note}</p><p>{c.coverage}</p><p className="panel-note">{c.scope}</p>
    <p><a href={`https://github.com/runchengxie/quant-factor-observatory/blob/main/docs/research/quarterly-calendar-reconstruction-20261016.${locale}.md`}>{locale === 'zh-CN' ? '查看完整研究记录、方法和限制' : 'Read the full study, methods and limitations'}</a></p>
  </section>
}
