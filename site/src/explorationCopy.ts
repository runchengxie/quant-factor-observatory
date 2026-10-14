import type { Locale } from './i18n'

type HermiteCopy = {
  back: string; eyebrow: string; title: string; lede: string; conclusion: string; conclusionLabel: string; metric: string; ticker: string
  coverage: string; observations: string; series: string; noSeries: string; demo: string
  metrics: Record<string, { label: string; title: string; description: string }>
  boundary: string
}
type JumpCopy = {
  back: string; eyebrow: string; title: string; lede: string; conclusion: string; conclusionLabel: string; observation: string; rvShare: string
  jumpComposition: string; component: string; value: string; share: string; jumpShare: string; snapshotDate: string; illustrativeUniverse: string
  checkPassed: string; checkFailed: string; checkUnavailable: string; noData: string; demo: string; identity: string; observedValues: string
  boundary: string
}
type FundamentalsCopy = {
  back: string; eyebrow: string; title: string; lede: string; conclusion: string; conclusionLabel: string; metric: string; ticker: string
  latestDistribution: string; distributionNote: string; timeSeries: string; range: string
  observations: string; exampleCoverage: string; demo: string; noSeries: string
  availabilityBasis: string; researchNotes: string[]
  publicSnapshot: string
  availabilityEyebrow: string; coreEyebrow: string; coreTitle: string; catalogEyebrow: string
  guardrailsEyebrow: string; guardrailsTitle: string
  pitRange: string; processedUniverse: string; timeSeriesExamples: string; availabilityLabel: string; latestCoverageTitle: string
  processedTickers: string; pitCoverage: string; validOperatingProfit: string; validShare: string
  latestAvailable: string; median: string; standardizedProxy: string; valid: string; missing: string; entries: string
  metricLabels: Record<string, string>; factorDescriptions: Record<string, string>
  loadingChart: string
}
export type ExplorationCopy = { hermite: HermiteCopy; jumps: JumpCopy; fundamentals: FundamentalsCopy }

export const explorationCopy: Record<Locale, ExplorationCopy> = {
  'en-US': {
    hermite: {
      conclusionLabel: 'Current conclusion', conclusion: 'These distribution-shape indicators are descriptive examples. Predictive power and portfolio performance have not been validated.',
      back: '← Factor overview', eyebrow: 'HERMITE REGIME / 03',
      title: 'How lopsided are price movements?',
      lede: 'See whether daily price changes are balanced around zero and how often unusually large moves occur. These shape measures are exploratory descriptions, not forecasts.',
      metric: 'Hermite indicator', ticker: 'Ticker', coverage: 'Observed window', observations: 'sample dates',
      series: 'Selected series', noSeries: 'No series is available for this selection.', demo: 'Illustrative demo snapshot',
      metrics: {
        vol_rv_ts_closeness_60: { label: 'Closeness to a reference shape', title: 'How close is the shape to its reference?', description: 'This tracks changes in the shape of recent trading activity. In this demo, values closer to zero mean closer to the reference shape. The exact calculation method and scale are not published.' },
        h_daily_close60_ts_h3_60: { label: 'Asymmetry diagnostic (h3)', title: 'Are price changes lopsided? (h3)', description: 'This measure helps describe whether price changes lean more to one side. Its exact scale is not published, so its sign is not the same as a standardized skewness measure.' },
        h_daily_close60_ts_h4_60: { label: 'Large-move diagnostic (h4)', title: 'How heavy are the extremes? (h4)', description: 'This measure relates to how often unusually large moves appear. Its scale depends on the unpublished implementation and is not a formal kurtosis test.' },
      },
      boundary: 'The public snapshot is a three-ticker, 42-calendar-date illustration. Short windows and extreme observations can make higher-order statistics unstable. No return prediction or trading result is established here.',
    },
    jumps: {
      conclusionLabel: 'Current conclusion', conclusion: 'The example illustrates how continuous and jump variation partition realized variance. It does not establish jump frequency or return predictability.',
      back: '← Factor overview', eyebrow: 'JUMP DECOMPOSITION / 02',
      title: 'How much movement came from sudden jumps?',
      lede: 'Realized variance (RV) is a measure of total squared price movement. This example splits it into gradual movement and sudden jumps, then divides jumps into larger and smaller moves. The parts add up to RV.',
      observation: 'Example observation', rvShare: 'Share of realized variance', jumpComposition: 'Composition of jump variance',
      component: 'Component', value: 'Variance value', share: 'Share of RV', jumpShare: 'Share of RJV',
      snapshotDate: 'Snapshot date', illustrativeUniverse: 'Illustrative universe',
      checkPassed: 'Decomposition check passed', checkFailed: 'Decomposition has negative values or does not reconcile within tolerance', checkUnavailable: 'Decomposition identity cannot be checked because values are missing',
      noData: 'No decomposition data', demo: 'Illustrative demo snapshot',
      identity: 'RV is total realized variance; IVhat estimates the gradual part and RJV the jump part. RJV = RLJV + RSJV, where RLJV and RSJV are larger and smaller jumps. The jump shares are shown separately, so do not add them to RV a second time.',
      observedValues: 'Observed values',
      boundary: 'The displayed observations are a three-ticker example for one date. They explain the decomposition only; they do not establish how often jumps occur or predict future returns.',
    },
    fundamentals: {
      conclusionLabel: 'Current conclusion', conclusion: 'This page shows which financial observations were available and how complete the sample is. It does not show that these measures predict stock returns.',
      back: '← Factor overview', eyebrow: 'FUNDAMENTAL STATES / 04',
      title: 'What companies reported, and when it became public',
      lede: 'Explore measures such as profit and sales using information available on each historical date (point-in-time data). Charts show how much information is present; these measures have not yet been shown to predict returns.',
      metric: 'Series metric', ticker: 'Example ticker', latestDistribution: 'Latest operating-profit cross-section',
      distributionNote: 'Each value is a cutoff in the same-date sample: P01 is near the lowest 1%, P50 is the middle stock, and P99 is near the highest 1%. Values are standardized score units, not money.',
      timeSeries: 'Representative point-in-time series', range: 'Observed dates', observations: 'valid observations',
      exampleCoverage: 'The processed universe contains 6,736 tickers, while public time-series examples are available for only three representative tickers. The coverage and examples have different grains.',
      demo: 'Illustrative snapshot', publicSnapshot: 'Published PIT snapshot', noSeries: 'No series is available for this selection.',
      availabilityEyebrow: 'DATA AVAILABILITY', coreEyebrow: 'CORE RESEARCH SET', coreTitle: 'Start with these six', catalogEyebrow: 'FACTOR CATALOG', guardrailsEyebrow: 'RESEARCH GUARDRAILS', guardrailsTitle: 'Method limits',
      pitRange: 'PIT observation range', processedUniverse: 'Processed universe', timeSeriesExamples: 'Public time-series examples', availabilityLabel: 'Availability basis', latestCoverageTitle: 'Latest operating-profit cross-section coverage',
      processedTickers: 'Processed tickers', pitCoverage: 'PIT universe coverage', validOperatingProfit: 'Valid operating-profit values', validShare: 'Valid share', latestAvailable: 'Latest available cross-section', median: 'Latest median', standardizedProxy: 'Standardized operating-profit proxy', valid: 'Valid', missing: 'Missing', entries: 'research entries',
      availabilityBasis: 'point-in-time observation date', researchNotes: [
        'Published observations are point-in-time snapshots; exact availability mappings are kept private.',
        'Complete observations are required before a rolling research value is published; missing history remains null.',
        'Public artifacts expose research definitions and aggregate diagnostics, not exact implementation recipes.',
        'Human-capital entries are hypotheses until historical labor-cost coverage and predictive evaluation are published.',
        'The standardized operating-profit value remains null until four complete quarters and six historical TTM observations are available.',
        'TTM derivation treats reported values as cumulative fiscal-year values; validate this data contract before any backtest.',
      ],
      loadingChart: 'Loading chart…',
      metricLabels: {
        standardized_operating_profit: 'Standardized operating profit', roe: 'Return on equity (ROE)', roa: 'Return on assets (ROA)',
        net_profit_yoy: 'Net profit year-over-year', revenue_yoy: 'Revenue year-over-year',
      },
      factorDescriptions: {
        standardized_operating_profit: 'Operating-profit state relative to the company’s own history; the published cross-section is a research proxy.',
        roe: 'Reported return on equity series in the representative PIT snapshot.',
        roa: 'Reported return on assets series in the representative PIT snapshot.',
        net_profit_yoy: 'Reported net-profit year-over-year series in the representative PIT snapshot.',
        revenue_yoy: 'Reported revenue year-over-year series in the representative PIT snapshot.',
      },
    },
  },
  'zh-CN': {
    hermite: {
      conclusionLabel: '当前结论', conclusion: '这些分布形态指标是描述性示例，预测能力与组合表现尚未验证。',
      back: '← 因子总览', eyebrow: 'HERMITE 体制 / 03',
      title: '价格涨跌分布是否偏向一边？',
      lede: '查看每日价格变化是否大致对称，以及特别大的涨跌出现得是否更多。这些形状指标用于描述，不是经过验证的预测信号。',
      metric: 'Hermite 指标', ticker: '股票', coverage: '观测区间', observations: '个样本日期',
      series: '当前序列', noSeries: '当前选择没有可用序列。', demo: '说明性演示快照',
      metrics: {
        vol_rv_ts_closeness_60: { label: '与参考分布的接近程度', title: '当前形状与参考形状有多接近？', description: '这项指标跟踪近期交易活跃度分布形状的变化。本演示中，数值越接近 0 表示越接近参考形状；精确公式和尺度未公开。' },
        h_daily_close60_ts_h3_60: { label: '涨跌偏向诊断（h3）', title: '价格变化是否偏向一边？（h3）', description: '用于描述价格变化是否更多偏向上涨或下跌。具体尺度未公开，因此不能把正负号等同于标准化偏度。' },
        h_daily_close60_ts_h4_60: { label: '极端涨跌诊断（h4）', title: '特别大的涨跌是否更常见？（h4）', description: '与特别大幅度的价格变化出现情况有关。具体尺度取决于未公开的实现，不是正式的峰度检验。' },
      },
      boundary: '公开快照仅为 3 只股票、42 个自然日的示例。较短窗口和极端观测可能使高阶统计量不稳定；这里没有验证收益预测或交易效果。',
    },
    jumps: {
      conclusionLabel: '当前结论', conclusion: '示例说明连续变差与跳跃变差如何分解已实现方差，尚不能据此判断跳跃频率或收益预测能力。',
      back: '← 因子总览', eyebrow: '跳跃分解 / 02',
      title: '总波动中有多少来自突然跳动？',
      lede: '实现方差（RV）用于汇总价格变化的平方。本例把它分成平常的连续变化和突然跳动，再把跳动分成较大与较小两部分；各部分相加等于 RV。',
      observation: '示例观测', rvShare: '实现方差中的占比', jumpComposition: '跳跃方差构成',
      component: '分量', value: '方差值', share: '占 RV', jumpShare: '占 RJV',
      snapshotDate: '快照日期', illustrativeUniverse: '示例股票数',
      checkPassed: '分解恒等式核对通过', checkFailed: '分量存在负值，或分解恒等式在容差范围内无法核对', checkUnavailable: '数值缺失，无法核对分解恒等式',
      noData: '暂无分解数据', demo: '说明性演示快照',
      identity: 'RV 是总实现方差；IVhat 估算平常连续变化的部分，RJV 是跳跃部分。RJV = RLJV + RSJV，分别表示较大和较小的跳跃。图中单独展示跳跃占比，不要再把它们加到 RV 一次。',
      observedValues: '观测值',
      boundary: '当前显示的是同一日期下 3 只股票的示例，只用于说明分解方式；不能据此判断跳跃发生频率或预测未来收益。',
    },
    fundamentals: {
      conclusionLabel: '当前结论', conclusion: '这里展示财务数据在当时是否可用、样本覆盖是否完整；这些指标目前还没有证据证明能预测股票收益。',
      back: '← 因子总览', eyebrow: '基本面状态 / 04',
      title: '公司公布了什么，数据何时可用？',
      lede: '查看利润、收入等财务指标，并按历史日期只使用当时已经公开的信息（点时数据）。图表展示数据覆盖范围；目录中的指标还没有证明能预测股票收益。',
      metric: '序列指标', ticker: '示例股票', latestDistribution: '最新营业利润横截面',
      distributionNote: '每个数值都是同一日期样本中的一个位置：P01 接近最低的 1%，P50 是中间位置，P99 接近最高的 1%。这里显示的是标准化分数，不是金额。',
      timeSeries: '代表性 PIT 时间序列', range: '观测日期', observations: '个有效观测',
      exampleCoverage: '处理股票池包含 6,736 只股票，公开时间序列仅提供 3 只代表性股票。全量覆盖统计与示例序列的统计粒度不同。',
      demo: '说明性快照', publicSnapshot: '公开 PIT 快照', noSeries: '当前选择没有可用序列。',
      availabilityEyebrow: '数据覆盖', coreEyebrow: '核心研究集合', coreTitle: '先看这六个', catalogEyebrow: '因子目录', guardrailsEyebrow: '研究边界', guardrailsTitle: '方法限制',
      pitRange: 'PIT 观察区间', processedUniverse: '处理股票池', timeSeriesExamples: '公开时间序列示例', availabilityLabel: '可用日期口径', latestCoverageTitle: '最新营业利润截面覆盖',
      processedTickers: '处理股票数', pitCoverage: 'PIT 股票池覆盖', validOperatingProfit: '营业利润有效值', validShare: '有效值比例', latestAvailable: '最新可用截面', median: '最新中位数', standardizedProxy: '标准化营业利润试算', valid: '有效', missing: '缺失', entries: '个研究入口',
      availabilityBasis: '点时观察日期', researchNotes: [
        '公开观测为点时快照；精确的数据可用日映射未公开。',
        '只有完整观测满足要求后才发布滚动研究值；历史不足时保留缺失值。',
        '公开资料提供研究定义和聚合诊断，不披露精确实现配方。',
        '在人力成本历史覆盖和预测性评估公开前，人力资本条目仍是研究假设。',
        '标准化营业利润值需具备四个完整季度和六个历史 TTM 观测后才会生成，否则为空。',
        'TTM 推导将报表字段视为财年累计值；用于回测前应先验证这一数据契约。',
      ],
      loadingChart: '正在加载图表…',
      metricLabels: {
        standardized_operating_profit: '标准化营业利润', roe: '净资产收益率（ROE）', roa: '总资产收益率（ROA）',
        net_profit_yoy: '净利润同比', revenue_yoy: '营业收入同比',
      },
      factorDescriptions: {
        standardized_operating_profit: '营业利润相对企业自身历史状态的变化；公开截面为研究试算指标。',
        roe: '代表性 PIT 快照中的净资产收益率序列。', roa: '代表性 PIT 快照中的总资产收益率序列。',
        net_profit_yoy: '代表性 PIT 快照中的净利润同比序列。', revenue_yoy: '代表性 PIT 快照中的营业收入同比序列。',
      },
    },
  },
}
