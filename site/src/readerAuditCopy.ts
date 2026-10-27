import type { Locale } from './i18n'
export const readerAuditCopy = {
 'en-US': { records: 'Full evidence, checks and reproduction records', comparison: 'Historical comparison and limits', definitions: 'PB compares market price with book value. ROE measures profit relative to shareholder equity. These five rankings use the same eligible pool, including a requirement for usable ROE data.', previous: 'Previous', next: 'Next', all: 'Show all matching factors', paged: 'Show 50 per page', download: 'Download full snapshot (JSON)', sorting: 'Historical statistic order: mean RankIC, highest first. This is not a forecast or investment ranking.', range: 'Showing', of: 'of' },
 'zh-CN': { records: '完整证据、核验与复现记录', comparison: '历史对照与适用限制', definitions: 'PB（市净率）比较股价与每股净资产，ROE（净资产收益率）衡量利润相对股东权益的比例。这五种排序使用同一个合格股票池，都要求 ROE 数据可用。', previous: '上一页', next: '下一页', all: '显示全部匹配因子', paged: '每页显示 50 个', download: '下载完整快照（JSON）', sorting: '按历史 RankIC 均值从高到低排列，仅为历史统计排序，不能据此预测未来表现或推荐投资。', range: '当前显示', of: '总数' },
} satisfies Record<Locale, Record<string, string>>
export const sampleReading: Record<string, Record<Locale, string>> = {
 'rd-investment': { 'en-US': 'Monthly stock samples with returns measured over the next 20 or 220 trading days; 77 and 66 usable monthly comparisons, respectively. Long outcome windows overlap.', 'zh-CN': '按月形成股票样本，分别观察之后 20 个和 220 个交易日的收益，各有 77 批和 66 批可用样本。长期收益观察窗口彼此重叠。' },
 'absolute-level-forecast': { 'en-US': '32,339 common observations; three annual test rounds covering 2023, 2024 and 2025. Training details remain in the study.', 'zh-CN': '32,339 条共同观测记录，按年份分三轮测试，测试年份为 2023、2024 和 2025 年。训练方法见专题详情。' },
}
