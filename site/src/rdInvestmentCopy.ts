import type { Locale } from './i18n'

type RdInvestmentCopy = {
  eyebrow: string
  title: string
  lead: string
  variantsTitle: string
  variantNameLabel: string
  variantExplanationLabel: string
  variants: Array<[string, string]>
  rankIcTitle: string
  rankIcNote: string
  timingTitle: string
  timingNotes: string[]
  top200Title: string
  top200Note: string
  methodsTitle: string
  methodsNote: string
  boundaryTitle: string
  sourceLead: string
  sourceLink: string
  boundary: string
}

export const rdInvestmentCopy: Record<Locale, RdInvestmentCopy> = {
  'en-US': {
    eyebrow: 'PLAIN-LANGUAGE GUIDE',
    title: 'What was measured',
    lead: 'The study asks whether companies that spend more on research and development (R&D), relative to their size, tend to have better future stock returns. The main measure is R&D / market cap (TTM R&D expense divided by equity market capitalization): recent twelve-month R&D spending divided by stock-market value. A high ratio can mean more R&D, a smaller company, or a lower share price. The current evidence does not yet separate these explanations or show that the pattern can be traded.',
    variantsTitle: 'What each comparison means',
    variantNameLabel: 'Name shown in the chart',
    variantExplanationLabel: 'In plain language',
    variants: [
      ['R&D / market cap', 'The source calls this “TTM R&D expense divided by equity market capitalization.” In plain language, it is recent twelve-month R&D spending divided by the company’s stock-market value. A higher ratio can mean more R&D, a smaller market value, or both.'],
      ['R&D / EV proxy', 'Recent R&D expense divided by an estimate of enterprise value (EV). The estimate uses only covered debt and cash fields, so it is not a complete EV calculation.'],
      ['Five-year decayed R&D stock / market cap', 'Adds up reconstructed R&D spending over five years, giving older spending less weight, then divides by market value. The assumed value falls by 20% per year.'],
      ['Full style residual', 'Starts with the monthly rank of R&D / market cap, then removes the part associated with company size, valuation, leverage, 12–1 momentum (the price-return measure from 12 months ago through one month ago, leaving out the latest month), and industry. “Residual” means what remains after those adjustments; it does not prove the remainder comes from R&D alone.'],
      ['R&D / revenue; R&D / assets', 'Recent R&D expense divided by recent revenue or total assets. These compare R&D spending with the company’s operating scale.'],
      ['R&D growth', 'Change in recent R&D expense compared with the same rolling period one year earlier.'],
    ],
    rankIcTitle: 'What does Rank IC mean here?',
    rankIcNote: 'At each month-end, the study ranks eligible companies by an R&D measure and compares that order with their later stock-return order. Rank IC is the rank correlation between those two lists. The reported value is the average across monthly comparisons, shown as a percentage. For example, 12.81% means a correlation of 0.1281; it is not a 12.81% stock return. The study contains 77 usable month-end comparisons for the 20-day outcome and 66 for the 220-day outcome, with median sample sizes of about 4,454 and 4,230 stocks. The 220-day outcome windows overlap, so those monthly results are not independent.',
    timingTitle: 'When information and returns enter the comparison',
    timingNotes: [
      'TTM means trailing twelve months. For cumulative financial statements, the study estimates a rolling twelve-month amount as: current year-to-date + prior full-year − prior-year same-period year-to-date. An annual filing supplies its full-year amount directly.',
      'PIT means point-in-time. A filing is treated as available from the next calendar day after its announcement and is carried forward for up to 540 days. The signal is formed at month-end; the 20- and 220-trading-day price-return windows start from the next trading-day close.',
      'The historical filing-revision record is incomplete. Aligning signals to announcement dates helps avoid using a report before it was announced, but does not recover every version investors saw at the time. The price-return labels omit trading costs and do not prove the assumed prices could be filled.',
    ],
    top200Title: 'A separate trading simulation',
    top200Note: 'A separate fixed Top-200 test reports 12.70% annualized return, Sharpe 0.57, and maximum drawdown −25.75% over 89 holding periods, using a modeled one-way cost of 25 basis points (0.25%; 25 bp one-way modeled cost in the source). Annualized return expresses a multi-period result on a yearly scale. Maximum drawdown is the largest fall from a previous portfolio high. The source labels 0.57 as Sharpe but does not publish enough calculation detail here to reproduce it. This test is separate from the 20/220-day Rank IC screen and the ten-group validation; the source calls this “not the registered decile validation or a production portfolio.” It is a historical simulation, not an actual account or production portfolio.',
    methodsTitle: 'What do the remaining research terms mean?',
    methodsNote: 'A decile is one of ten groups made by sorting stocks from lower to higher signal values. “CPCV” (combinatorial purged cross-validation) is a way to check a method across multiple historical train/test splits while keeping overlapping periods from leaking across a split. “Newey–West / HAC” adjusts uncertainty estimates when nearby observations may be related. “BH” is a correction for checking many results at once. These methods were not all rerun in the corrected screen, so their mention in the research log is not evidence that the current result passed them. “OOS” means out of sample: data held aside from model development; the future holdout remains sealed.',
    boundaryTitle: 'What is still uncertain?',
    sourceLead: 'For the full protocol, exclusions and source records, open the',
    sourceLink: 'public methodology note',
    boundary: 'Keep the corrected 2020–2026 signal screen separate from the older 2019-extended reconstruction. Historical execution checks found 10,825 distinct flagged position-endpoint events across 3,894 securities; none of 70 factor-by-decile sequences passed every check. These are data and price checks, not confirmed failed orders. The October 2026–September 2027 prospective holdout remains sealed (the frozen-holdout), and no holdout performance has been read.',
  },
  'zh-CN': {
    eyebrow: '先用大白话读懂这项研究',
    title: '这项研究到底想知道什么？',
    lead: '研究要回答的是：相对于公司规模，研发投入更多的公司，之后的股票收益是否也更好？早期结果看起来不错，但“研发费用 / 市值”较高，可能是研发费用多，也可能是公司市值小、股价跌了，或两者同时发生。现有证据还不能把这些原因分开，也没有证明这种关系能实际交易。',
    variantsTitle: '表格里的几种研发指标分别是什么？',
    variantNameLabel: '图表原名',
    variantExplanationLabel: '简单解释',
    variants: [
      ['研发 / 市值', '最近 12 个月研发费用除以公司股票总市值。比值高，可能是研发花得多，也可能是市值较小，或者两者都有。'],
      ['研发 / EV 代理', '最近 12 个月研发费用除以企业价值（EV）的估算值。估算只使用当前能覆盖的部分债务和现金字段，因此不是完整的企业价值计算。'],
      ['五年衰减研发资本 / 市值', '把近五年的研发费用按季度还原后累加，较早的费用逐年降低权重，再除以市值。假设这项价值每年衰减 20%。'],
      ['完整风格残差', '先按每月的“研发 / 市值”给公司排序，再扣除其中与公司大小、估值、杠杆、12–1 动量（按过去 12 个月股价涨幅衡量，但跳过最近 1 个月）和行业有关的部分。“残差”就是这些调整后剩下的部分，不代表剩下的关系一定只来自研发。'],
      ['研发 / 收入；研发 / 资产', '最近 12 个月研发费用分别除以最近 12 个月收入或总资产，用来按公司的经营规模衡量研发投入。'],
      ['研发增长', '把最近 12 个月研发费用与一年前相同滚动期间比较，计算其变化。'],
    ],
    rankIcTitle: '这里的 Rank IC 是什么？',
    rankIcNote: '每个月末，研究先按某个研发指标给符合条件的公司排序，再看这些公司的后续股票收益排序是否相似。两份名单排序的相关程度叫 Rank IC（月度秩相关）。图表报告的是各月相关值的平均数，并以百分比显示。比如 12.81% 实际对应相关系数 0.1281，不是股票涨了 12.81%。20 日和 220 日结果使用不同样本：分别有 77 个和 66 个月度比较，每期股票数中位数约为 4,454 和 4,230 只。220 日结果的观察窗口彼此重叠，因此各月结果不是互相独立的样本。',
    timingTitle: '财报何时可用，收益又从哪天开始算？',
    timingNotes: [
      'TTM 是“最近连续 12 个月”。财报若按年内累计披露，研究用“本年年初至今累计 + 上一完整年度 − 上年同期累计”估算最近 12 个月；年报直接采用全年数值。',
      'PIT 是“点时数据”，意思是只在信息当时已公开后才使用。这里把财报公告次日作为可用日，最多沿用 540 天；每月末形成信号，随后从下一个交易日收盘开始计算 20 日或 220 日价格收益。',
      '历史财报的修订版本并不完整。按公告日期对齐，可以避免提前使用尚未公告的报告，但不能还原投资者当时看到的每一个版本。价格收益标签没有扣交易成本，也不能证明假设的价格真能成交。',
    ],
    top200Title: '另有一项独立的交易模拟',
    top200Note: '单独的固定 Top-200 平台探针（也就是一项历史交易模拟）报告了 89 个持有区间：年化收益 12.70%、Sharpe 0.57、最大回撤 −25.75%，并假设单边模型成本为 25 个基点（0.25%）。年化收益是把多个区间的结果换算到一年尺度；最大回撤是组合净值从此前高点到之后低点的最大跌幅。来源把 0.57 称为 Sharpe，但当前公开说明没有给出足够细节供读者复算。这项模拟与 20/220 日 Rank IC 筛查和十分组验证分开，是历史模拟，不是实际账户或正式运行的组合。',
    methodsTitle: '还有几个研究术语是什么意思？',
    methodsNote: '“十分组”是把股票按信号从低到高排序后分成十组，每组大约占十分之一。“CPCV”（组合式净化交叉验证）是把历史资料拆成多种训练和检验组合、并避免重叠时段跨组泄漏的一种检查方法。“Newey–West / HAC”用于在相邻观测可能互相关联时调整不确定性估计。“BH”是在同时检查多个结果时使用的一种统计校正。这些方法并未全部用于修正后的当前筛查，因此研究日志提到它们，不等于当前结果已经通过这些检查。“OOS”是样本外检验，指开发时留出的数据；未来留出目前仍封存。',
    boundaryTitle: '还有哪些问题没有解决？',
    sourceLead: '完整研究协议、排除项和来源记录见',
    sourceLink: '公开方法说明',
    boundary: '请把修正后的 2020–2026 信号筛查，与更早、延伸至 2019 年的历史重建分开看。历史执行核查发现 3,894 只证券涉及 10,825 个去重后的持仓端点标记事件；70 条“因子 × 十分组”序列没有一条通过全部检查。这些是数据和价格核查结果，不等于已确认的订单失败。2026-10 至 2027-09 的前瞻最终 OOS 协议已封存，但绩效读取仍被门槛阻止；未来留出仍封存，尚未读取其表现。',
  },
}
