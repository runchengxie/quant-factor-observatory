import type { Locale } from './i18n'

export const pbRoeInterpretationCopy = {
  'en-US': {
    title: 'What the comparison establishes',
    finding: 'From 2010-01-29 to 2026-08-31, the 50-stock PB ranking had an annualized return of 12.05%, compared with 9.06% with static ROE added, a gap of 2.99 percentage points. Maximum drawdowns were 46.74% and 45.40%. The modest reduction in drawdown came with a lower return in this shared eligible pool. Both rankings required usable ROE data.',
    use: 'For research today, retain the PB ranking as a baseline when testing whether quality information improves value selection. The result applies to the published pool and rules. Other universes need their own comparison, and the repeatedly examined historical sample does not provide an independent test of future performance.',
    review: 'Narrative and published figures checked on 2026-10-30. The numerical evidence remains the public comparison through 2026-08-31, with source review dated 2026-10-14. This check added no market observations and did not rerun the backtest. Filing availability and historical financial versions remain incompletely verified. Current tradability still requires a matched execution test.',
    source: 'Dated method and evidence notes',
  },
  'zh-CN': {
    title: '这组对照说明了什么',
    finding: '2010-01-29 至 2026-08-31，50 只股票按 PB 排序的年化收益为 12.05%，加入静态 ROE 后为 9.06%，相差 2.99 个百分点。最大回撤幅度分别为 46.74% 和 45.40%。在共同的合格候选池中，回撤略有收窄，收益也随之降低。两种排序都要求 ROE 数据可用。',
    use: '今天研究质量信息能否改善估值选股时，可以保留 PB 排序作为基准。结论适用于已公开的股票池和规则，其他股票池需要各自的对照。该段历史已经反复用于研究，未来表现仍需独立样本检验。',
    review: '2026-10-30 核阅了本页解读与公开数值。数值证据仍是截至 2026-08-31 的公开对照，来源核阅日期为 2026-10-14。本次没有加入新的市场观察，也没有重跑回测。公告可见时间与历史财务版本尚未完整核实，当前可交易性仍需统一成交口径下的检验。',
    source: '查看注明日期的方法与数据核对',
  },
} satisfies Record<Locale, Record<string, string>>
