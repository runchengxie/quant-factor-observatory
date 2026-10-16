import type { Locale } from './i18n'

export const legacyFactorEvidenceCopy: Record<Locale, { title: string; conclusion: string; boundary: string; link: string; stage: string }> = {
  'en-US': {
    title: 'Related ETF research methods',
    conclusion: 'Synthetic strategy integration succeeded. Predictive evidence for transferring this factor into an ETF strategy remains unavailable.',
    boundary: 'This link is a conceptual reference. These minute diagnostics and their datasets are not interchangeable with the strategy inputs. No new factor-return metric is asserted.',
    link: 'Read the ETF study and its evidence limits',
    stage: 'Methods only · transfer evidence pending',
  },
  'zh-CN': {
    title: '相关 ETF 研究方法',
    conclusion: '策略的合成数据集成验证已通过，但把该因子用于 ETF 策略的预测证据仍然缺失。',
    boundary: '此链接仅作方法参考。这些分钟级诊断及其数据集不能与策略输入直接替换，本次没有新增因子收益指标。',
    link: '阅读 ETF 专题与证据限制',
    stage: '仅方法参考 · 迁移有效性待验证',
  },
}
