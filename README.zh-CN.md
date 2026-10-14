# quant-factor-observatory

[English README](README.md)

[打开线上 Observatory](https://runchengxie.github.io/quant-factor-observatory/)

面向公开研究展示的因子 Observatory：浏览因子定义、数据质量、研究状态和已脱敏的聚合证据。

本仓库不是因子计算引擎，也不包含原始行情、财报数据、逐股票信号、组合权重或私有研究代码。研究计算在私有环境完成后，只向本站导出公开契约允许的静态快照。

## 站点入口

- `/`：研究总览与数据上下文
- `/alpha810`：Alpha 810 聚合因子证据目录与详情
- `/factors`：统一因子目录
- `/jumps`：跳跃风险分解展示
- `/hermite`：分布形状与状态展示
- `/fundamentals`：基本面与人力资本研究目录
- `/studies`：PB/ROE、研发投入与职工薪酬的研究专题和证据边界

## 公开数据边界

公开快照可以包含因子名称、研究族、公开研究定义、经济直觉、研究状态、数据质量、脱敏横截面摘要、时间序列示例、聚合归因、point-in-time 状态、覆盖范围和缺失情况。

公开快照不包含精确计算算子、参数窗口、组合规则、原始数据供应商映射、本地路径、逐股票信号、组合权重、交易执行细节、私有回测代码、原始数据或凭证。

## 本地运行

站点直接消费 `site/public/data/` 中已提交的公开快照：

```bash
npm ci --prefix site
npm run dev --prefix site
npm run build --prefix site
```

更新公开快照时，应在私有研究环境中生成脱敏结果。提交前运行：

```bash
python scripts/audit_public_release.py
python -m unittest discover -s tests -v
```

以上命令从仓库根目录执行。浏览器检查使用 Chromium：

```bash
(cd site && npx playwright install chromium)
npm run test:e2e --prefix site
```

浏览器功能测试使用备用字体和外部字体样式表的本地 fixture，验证数据、控件、本地化和布局，不依赖字体 CDN 是否可用，也不验证线上字体服务。语言操作、主题和快照来源标签使用 locale catalog。

Alpha 810 快照由 [`money-trees`](https://github.com/runchengxie/money-trees) 生成。当前 schema 1.2 快照覆盖 2016–2025。除聚合 IC、RankIC、覆盖率、分组收益、年度与沪深 300 市场状态摘要、不确定性估计和全因子多重检验诊断外，还包含 HAC 滞后敏感性和移动区块 bootstrap 区间。快照不包含逐证券值、组合权重或原始数据路径。历史输入的时点可得性和真实成交价尚未证实。公开契约见[英文契约](docs/alpha810-public-contract.md)和[中文参考](docs/alpha810-public-contract.zh-CN.md)，研究专题发布边界见[英文契约](docs/research-publication-contract.md)和[中文说明](docs/research-publication-contract.zh-CN.md)。

网站默认使用 `en-US`，支持 `zh-CN`，在本地存储可用时保留语言选择。未知的已保存 locale 回退到英文。快照校验错误按所选语言呈现，HTTP 状态和 schema 字段名保持原文。切换语言不改变快照数据或校验规则。

## 与完整公开研究的关系

本站维护因子目录组织、标准化因子专题、发布状态和符合发布契约的审核投影。独立的市场研究项目及其项目级方法由 [`quant-market-research`](https://github.com/runchengxie/quant-market-research) 维护。符合本站来源身份和审核要求的因子专题可以在此展示；应链接到权威方法与证据，不复制整份源材料。私有策略证据仍由所属仓库维护，只有明确审核并脱敏的投影可以发布到本站。

## 分布形态与跳跃探索

跳跃页按 IVhat + RLJV + RSJV 比较全部公开观测，支持方差绝对值与占 RV 比例切换、表格排序和单条分解查看。表格保留缺失及无效观测；图表排除负值、分解不一致及 RV 为零的观测。

Hermite 页可选择日期范围，比较同一指标的多只示例股票。序列按日期对齐并保留缺失值；有效数量、中位数、最小值和最大值均从当前展示序列计算，展开表格可查逐日数值。这些统计描述指标值，不代表原始收益分布，也不混用另行发布的截面分位数。演示的 42 个日期包含非交易日。

### 证据复核日期

专题索引和证据摘要显示公开证据记录的复核日期，并与数据快照日期、自动来源检查时间分开。`site/src/evidenceReviewRecords.json` 从现有导航记录和历史风险来源元数据提取这些信息；没有记录的日期保留为 null。更新来源后，运行 `python scripts/build_evidence_review_records.py` 同步元数据。公共契约测试会将日期和来源版本与引用的数据文件核对。
