import type { Locale } from './i18n'

export const researchEntryCopy = {
  'en-US': {
    title: 'Explore research topics',
    note: 'Open an interactive analysis with its sample scope and evidence limits. Reviewed study records follow below.',
    back: 'Back to research studies',
    sourceQuality: 'Source and data quality',
    snapshot: 'Public source snapshot',
    availability: 'Coverage and availability',
    jumps: { title: 'Jump decomposition', stage: 'Descriptive archive and separate demo', description: 'Compare jump variation and the continuous remainder across the retained stock-day sample. Historical aggregates and illustrative observations have separate views; predictive value remains unqualified.' },
    hermite: { title: 'Hermite regime', stage: 'Descriptive archive and separate demo', description: 'Explore Hermite measures of realized-variance shape across retained observations, with window and tail sensitivity. These measures describe variance shape; their relationship to future returns remains unqualified.' },
    fundamentals: { title: 'Fundamental operating states', stage: 'Availability diagnostics', description: 'Explore selected company histories and full-market coverage in a separate PIT financial snapshot. Historical financial versions and candidate-level predictive evidence must be assessed in the linked studies.' },
    alpha810: { title: 'Alpha 810', stage: 'Separate published factor collection', description: 'Explore the published market-factor snapshot, aggregate validation and data checks. This collection keeps its own definitions, sample and evidence scope; the catalog table below retains its existing entries.', link: 'Explore Alpha 810 →' },
  },
  'zh-CN': {
    title: '探索专题',
    note: '进入交互分析前，先了解样本范围和证据限制。已复核的研究记录列在下方。',
    back: '返回研究专题',
    sourceQuality: '来源与数据质量',
    snapshot: '公开来源快照',
    availability: '覆盖范围与可得性',
    jumps: { title: '跳跃分解', stage: '历史描述性证据与独立演示', description: '比较已留存股票日样本中的跳跃变差和连续方差余项。历史聚合与演示观测采用各自的视图；预测价值仍待核验。' },
    hermite: { title: 'Hermite 体制', stage: '历史描述性证据与独立演示', description: '探索已留存观测中的已实现方差形态指标，并查看窗口与尾部敏感性。这些指标描述方差形态，与未来收益的关系仍待核验。' },
    fundamentals: { title: '基本面经营状态', stage: '可得性诊断', description: '查看独立 PIT 财务快照中的公司历史示例与全市场覆盖。历史财报版本和逐因子预测证据，需结合下方研究记录判断。' },
    alpha810: { title: 'Alpha 810', stage: '独立发布的因子集合', description: '浏览已发布的市场因子快照、汇总验证与数据检查。该集合保留自身的定义、样本与证据范围；下方目录表仍展示原有条目。', link: '浏览 Alpha 810 →' },
  },
} satisfies Record<Locale, unknown>
