import type { Locale } from './i18n'

export const shapeExplorationCopy = {
  'en-US': {
    start: 'Start date', end: 'End date', reset: 'Reset dates', compare: 'Compare tickers', invalidRange: 'Start date must be on or before end date.',
    summary: 'Series summary', daily: 'Daily values', date: 'Date', ticker: 'Ticker', valid: 'Valid / sample dates', missing: 'Missing', median: 'Median', min: 'Minimum', max: 'Maximum',
    sampleDates: 'sample dates', selectedWindow: 'Selected window', selectedTickers: 'Displayed tickers', generated: 'Snapshot generated', source: 'Snapshot source',
    dataNote: 'Summaries and daily values use the displayed series and selected dates. Missing values remain missing, and ticker calendars are aligned by date. Statistics describe these indicator values, not the underlying return distribution; minima and maxima are observed ranges, not confidence intervals.',
    demoCalendar: 'This demo uses consecutive calendar dates, including non-trading days. These are sample dates, not trading sessions.',
    nextTitle: 'What would strengthen the evidence?',
    hermiteNext: 'A reviewed historical sample would allow comparisons across market periods, sensitivity to observation windows, and tests against future returns. The current examples do not establish these relationships.',
    jumpNext: 'Jump frequency requires observations across many dates and an explicit event definition. Comparing variance shares on one date cannot establish frequency, direction of price moves, or future returns.',
    comparison: 'Compare observations', scale: 'Comparison scale', absolute: 'Absolute variance', percent: 'Share of RV', sort: 'Sort observations', byTicker: 'Ticker and date', byRv: 'RV, highest first', byShare: 'Jump share, highest first',
    check: 'Decomposition check', passed: 'Valid', failed: 'Invalid', unavailable: 'Unavailable', checks: 'All observations checked', checked: 'Valid / total',
    chartNote: 'Each stack contains IVhat + RLJV + RSJV. RJV is their jump subtotal and is not stacked again. Only reconciled, nonnegative observations with a positive RV are plotted; every observation remains in the table.',
    units: 'Variance units; not return percentages.', open: 'Inspect', comparisonNote: 'The demo jump shares are all close to 37%. These similar example proportions do not establish a common market pattern.',
  },
  'zh-CN': {
    start: '开始日期', end: '结束日期', reset: '重置日期', compare: '比较多只股票', invalidRange: '开始日期不能晚于结束日期。',
    summary: '序列摘要', daily: '逐日数值', date: '日期', ticker: '股票', valid: '有效值 / 样本日期', missing: '缺失', median: '中位数', min: '最小值', max: '最大值',
    sampleDates: '个样本日期', selectedWindow: '所选区间', selectedTickers: '当前展示股票数', generated: '快照生成时间', source: '快照来源',
    dataNote: '摘要和逐日数值使用当前显示的序列及日期范围。缺失值保持为空，不同股票按日期对齐。这里统计的是指标数值，并非原始收益分布；最小值和最大值表示实际观测范围，不是置信区间。',
    demoCalendar: '本演示使用连续自然日，包含非交易日。因此这里统计的是样本日期，而非交易日。',
    nextTitle: '还需要哪些证据？',
    hermiteNext: '经过审核的历史样本可用于比较不同市场时期、检查观测窗口的敏感性，并检验与未来收益的关系。当前示例尚未验证这些关系。',
    jumpNext: '判断跳跃频率需要多个日期的观测及明确的事件定义。单日方差占比无法说明跳跃频率、价格涨跌方向或未来收益。',
    comparison: '观测比较', scale: '比较尺度', absolute: '方差绝对值', percent: '占 RV 比例', sort: '观测排序', byTicker: '股票与日期', byRv: 'RV 从高到低', byShare: '跳跃占比从高到低',
    check: '分解校验', passed: '有效', failed: '无效', unavailable: '无法核对', checks: '全部观测校验', checked: '有效 / 总数',
    chartNote: '每条堆叠为 IVhat + RLJV + RSJV。RJV 是跳跃部分的小计，不再重复堆叠。图中仅绘制分解核对通过、分量非负且 RV 大于零的观测；表格保留全部观测。',
    units: '单位为方差值，并非收益百分比。', open: '查看', comparisonNote: '演示中的跳跃占比均接近 37%。这些相近的示例比例不能证明市场存在共同规律。',
  },
} satisfies Record<Locale, Record<string, string>>
