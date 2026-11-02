"""Publish reviewed aggregates through an explicit allowlist and enrich the reader page."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'site/public/data'
REF = 'doc:quant-research.research.broker-consensus-benchmark-20261102'
REVISION = '8559b14fd5bbbfa1ec6a14440efc2231f29dbc34'


def text(en, zh):
    return {'en-US': en, 'zh-CN': zh}


def project(source):
    fields = {
        'comparisons': ('horizon_days', 'outcome', 'stock_years', 'baseline_missing',
                        'broker_median_relative_error', 'baseline_median_relative_error',
                        'median_paired_error_improvement', 'broker_win_share', 'tie_share',
                        'mean_year_median_improvement', 'year_block_interval', 'years'),
        'coverage': ('horizon_days', 'outcome', 'coverage', 'stock_years', 'median_relative_error'),
        'controlled_coverage': ('horizon_days', 'outcome', 'status', 'rows',
                                'missing_industry', 'companies'),
    }
    result = {'schema_version': 'observatory.consensus_benchmark.v1', 'source_ref': REF,
              'source_revision': REVISION, 'reviewed_at': '2026-11-02',
              'evidence_stage': 'retrospective_diagnostic'}
    for group, names in fields.items():
        result[group] = [{k: row[k] for k in names if k in row} for row in source[group]]
    for output, raw in zip(result['controlled_coverage'], source['controlled_coverage']):
        output['terms'] = [{k: term[k] for k in ('term', 'coefficient', 'interval')}
                           for term in raw.get('terms', [])]
    return result


def enrich():
    source = json.loads((DATA / 'broker-consensus-benchmark.json').read_text())
    path = DATA / 'study-exploration/broker-consensus.json'
    page = json.loads(path.read_text())
    new_charts = []
    horizons = [30, 90, 180]
    categories = [text(f'{h} days before year-end', f'年末前约{h}天') for h in horizons]

    def chart(identity, title, metric, context, interpretation, series, unit='percent'):
        new_charts.append(dict(id=identity, title=text(*title), metric=text(*metric),
                               context=text(*context), interpretation=text(*interpretation),
                               categories=categories, series=series, unit=unit,
                               source_ids=['benchmark']))

    def series(identity, label, values, lower=None, upper=None):
        result = dict(id=identity, label=text(*label), values=values)
        if lower is not None:
            result.update(lower=lower, upper=upper)
        return result

    outcomes = [('profit', ('Profitable companies', '最终盈利的公司')),
                ('loss', ('Loss-making companies', '最终亏损的公司'))]
    for outcome, label in outcomes:
        rows = [next(r for r in source['comparisons'] if r['outcome'] == outcome
                     and r['horizon_days'] == h) for h in horizons]
        n = ' / '.join(str(r['stock_years']) for r in rows)
        missing = ' / '.join(str(r['baseline_missing']) for r in rows)
        chart('benchmark-' + outcome,
              (f'{label[0]}: do forecasts beat last year’s profit?', f'{label[1]}，券商预测比沿用去年利润更准吗？'),
              ('Median absolute error / absolute realized profit; lower is closer',
               '误差中位数，数值越低，预测越接近实际利润'),
              (f'2015–2025. Identical stocks in each paired comparison. Paired stock-years at 30 / 90 / 180 days: {n}; missing baselines: {missing}. Absolute realized profit above CNY10m. Prior-year values must be disclosed by the cutoff. Historical versions remain unverified.',
               f'2015年至2025年。每个期限内，两种方法比较同一批股票年度。30天、90天、180天的配对样本数分别为{n}，缺少基准的样本数分别为{missing}。只计算实际盈利或亏损绝对值超过1000万元的公司。上一年财报须在截止日前公布，历史数值版本仍未核实。'),
              ('The pooled medians and the median company-level paired improvement are different statistics. Read the paired-improvement chart before comparing horizons.',
               '两列分别计算各自的误差中位数。判断券商是否更准，还要看逐家公司配对后的结果。下方的配对改善图保留了这个比较。'),
              [series('broker', ('Broker forecast', '券商预测'), [r['broker_median_relative_error'] for r in rows]),
               series('prior-profit', ('Previous annual profit', '沿用上一年利润'), [r['baseline_median_relative_error'] for r in rows])])

        coverage_rows = [next(r for r in source['coverage'] if r['outcome'] == outcome and
                             r['horizon_days'] == h and r['coverage'] == bucket)
                         for bucket in ['one', 'two', 'three_plus'] for h in horizons]
        counts = ' / '.join(str(r['stock_years']) for r in coverage_rows)
        chart('coverage-' + outcome,
              (f'{label[0]}: does wider coverage mean smaller errors?', f'{label[1]}，多家券商覆盖的误差更小吗？'),
              ('Raw median relative errors by institutions with a recent eligible forecast',
               '按近期有效预测的券商家数分组，比较误差中位数'),
              (f'All broker/outcome matches, including missing baselines. Groups differ in company characteristics. Counts by one / two / three-plus institutions, each ordered 30 / 90 / 180 days: {counts}.',
               f'使用全部合格预测和财报配对，包括缺少去年利润基准的公司。各组公司的特点不同。按一家、两家、至少三家券商分组，每组按30天、90天、180天排列的样本数为{counts}。'),
              ('Raw group differences do not isolate the effect of analyst counts. Compare the profit and industry controls as well.',
               '这张图只展示分组差异。利润水平和行业等特点也会影响误差，请接着看控制这些特点后的图。'),
              [series(bucket, names, [r['median_relative_error'] for r in coverage_rows[i*3:i*3+3]])
               for i, (bucket, names) in enumerate([('one', ('One institution', '一家券商')),
                                                    ('two', ('Two institutions', '两家券商')),
                                                    ('three_plus', ('Three or more', '至少三家券商'))])])
        controls = [next(r for r in source['controlled_coverage'] if r['outcome'] == outcome
                         and r['horizon_days'] == h) for h in horizons]
        control_series = []
        for term, names in [('two_institutions', ('Two versus one', '两家相对一家')),
                            ('three_plus_institutions', ('Three-plus versus one', '至少三家相对一家'))]:
            terms = [next(t for t in r['terms'] if t['term'] == term) for r in controls]
            control_series.append(series(term, names, [t['coefficient'] for t in terms],
                                         [t['interval'][0] for t in terms],
                                         [t['interval'][1] for t in terms]))
        chart('coverage-controlled-' + outcome,
              (f'{label[0]}: compare coverage after controls', f'{label[1]}，考虑利润和行业后结果怎样？'),
              ('Change in log(1 + relative error) versus one institution; zero means no estimated difference',
               '相对一家券商的误差差异，使用对数转换后的误差，零表示估计没有差异'),
              ('Separate regressions at each cutoff control log absolute realized profit, year and industry. Company-clustered 95% intervals. This is one descriptive model, using later-realized profit and reconstructed industries; coefficients are not raw error percentage points. Rows: ' + ' / '.join(str(r['rows']) for r in controls) + '; missing industry: ' + ' / '.join(str(r['missing_industry']) for r in controls) + '.',
               '每个期限单独比较，并控制实际利润绝对值、年份和行业。细线表示按公司聚类计算的95％区间。这是一个描述性模型，使用了后来实现的利润和重建行业。系数单位与原始误差百分比不同。样本数为' + ' / '.join(str(r['rows']) for r in controls) + '，缺少行业的数量为' + ' / '.join(str(r['missing_industry']) for r in controls) + '。'),
              ('Negative coefficients would accompany smaller transformed errors. This specification does not support a general accuracy benefit from wider coverage; it does not establish causation.',
               '负值才表示更多覆盖伴随更小的转换后误差。当前模型没有支持多家覆盖普遍更准，也不能据此推断覆盖家数导致了误差变化。'),
              control_series, unit='number')

    improvement = []
    for outcome, label in outcomes:
        rows = [next(r for r in source['comparisons'] if r['outcome'] == outcome
                     and r['horizon_days'] == h) for h in horizons]
        improvement.append(series(outcome, label, [r['mean_year_median_improvement'] for r in rows],
                                  [r['year_block_interval'][0] for r in rows],
                                  [r['year_block_interval'][1] for r in rows]))
    chart('benchmark-paired-improvement',
          ('Does the paired broker advantage persist?', '逐家公司比较后，券商预测改善了多少？'),
          ('Mean annual median paired error improvement; positive favors the broker',
           '先逐家公司计算误差改善，再取各年中位数的平均，正值表示券商更准'),
          ('Baseline error minus broker error, measured on paired stock-years. Eleven target years, 2000 year-block resamples, descriptive 95% intervals. The intervals describe the mean annual median, not pooled medians. Few year blocks, repeated companies and serial dependence limit precision; no multiple-comparison correction.',
           '每家公司用去年利润基准的误差减去券商误差，再按年汇总。共11个目标年度，按年份重抽样2000次，细线表示描述性95％区间。区间对应各年中位数的平均，与前图的整体中位数不同。年份较少，同一公司会重复出现，跨年也可能相关，区间精度有限，尚未校正多项比较。'),
          ('Profitable-company advantages are clearer at 30 and 90 days. The 180-day interval includes zero. Loss-making-company forecasts fare worse at 90 and 180 days.',
           '盈利公司在30天和90天的改善较清楚，180天的区间跨过零，优势还不确定。亏损公司在90天和180天表现更差。'), improvement)

    verdict = text('Current evidence is insufficient to use broker consensus as a reliable standalone stock-selection factor.',
                   '目前证据还不足以把券商一致预期当作可靠、可直接使用的选股因子。')
    sections = []
    def section(identity, title, paragraphs, chart_ids):
        sections.append(dict(id=identity, title=text(*title), paragraphs=[text(*p) for p in paragraphs], chart_ids=chart_ids))
    section('selection', ('Can we use it to select stocks now?', '现在能靠它选股吗？'), [
        ('Some forecast-based rankings accompany later returns in historical samples. Profit-revision relationships weaken after industry and size controls. Forecast earnings yield has a clearer association, but its advantage over reported earnings yield remains uncertain.',
         '部分预测指标在历史样本中与后续收益有关。预测上调幅度在考虑行业和市值后关系较弱。用预测利润衡量股票贵不贵，关联更清楚一些，但它比已经公布的盈利多提供多少选股帮助，还没有明确证据。'),
        ('All reviewed intervals for the original cost-adjusted spread diagnostics include zero. Original provider vintages, missing terminal prices and actual trading conditions remain unresolved. Predicting profits more accurately does not establish higher investment returns. Current findings support further research, and have not established a dependable trading rule.',
         '高低分组收益差，就是高分组收益减去低分组收益。原研究扣费后的差值区间都包含零，历史数据版本、部分期末价格和真实交易条件还没有核实。预测利润更准，也不能保证买股票多赚钱。现有结果支持继续研究，距离稳定可用的选股规则还有证据缺口。')],
        ['forecast-reported-rankic-delta', 'forecast-reported-net-spread-delta', 'cost-sensitivity'])
    sections[0]['paragraphs'].insert(1, text(
        'Rank correlation compares two orderings: one by the forecast score and one by subsequent stock returns. A positive value means higher scores tend to accompany higher later returns. Different ways of constructing a consensus score have different evidence.',
        '图里的排名相关系数，衡量两种排序有多接近。一种按指标分数高低排，另一种按随后收益高低排。正值表示高分股票后来往往表现更好。一致预期可以做成不同的选股分数，各种分数的证据强弱也不同。'))
    section('profit', ('Forecasts help more near year-end', '临近年底，盈利公司的预测更有帮助'), [
        ('The simple baseline carries last year’s annual profit forward as this year’s forecast. Among companies that ultimately earned more than CNY10m, broker and baseline median errors are 13.5% and 27.4% at the roughly one-month cutoff. At three months they are 19.3% and 27.8%.',
         '我们用一个简单方法作比较，把公司去年赚的钱直接当作今年的预测。对最终盈利超过1000万元的公司，年底前约一个月，券商预测和简单方法的误差中位数分别为13.5％和27.4％。提前约三个月时，两者分别为19.3％和27.8％。'),
        ('A 13.5% error corresponds to CNY13.5m for a CNY100m realized profit. This illustrates the scale of the ratio, not a prediction for an individual company. Half-year paired comparisons do not establish a clear broker advantage. Forecasts nearer year-end can draw on more quarterly reports.',
         '用实际赚了1亿元来理解，13.5％的误差相当于差了约1350万元。这只是帮助理解比例，每家公司的误差会不同。提前约半年时，逐家公司配对后的比较还看不出明确优势。临近年底，分析师已经能看到更多季度财报。')],
        ['benchmark-profit', 'benchmark-paired-improvement'])
    section('loss', ('Loss-making companies need a separate view', '亏损公司的预测更难用'), [
        ('For companies that ultimately lost more than CNY10m, forecasts at the three- and six-month cutoffs perform worse than carrying forward last year’s profit. At one month the improvement remains uncertain.',
         '对最终亏损超过1000万元的公司，提前约三个月或半年时，券商预测比沿用去年利润更差。到年底前约一个月，改善仍不确定。'),
        ('Profit and loss groups use later-realized outcomes. They help describe where errors occur and cannot serve as a ready-made screen at the forecast cutoff.',
         '这里按后来实际盈利还是亏损分组，帮助我们看清误差发生在哪里。预测截止日还不知道最终结果，不能直接照这个分组筛股票。')], ['benchmark-loss', 'benchmark-paired-improvement'])
    section('coverage', ('More coverage is not an accuracy guarantee', '多家券商覆盖，也需要看公司特点'), [
        ('Raw profitable-company groups with three or more institutions have smaller median errors than the one-institution group. Once realized profit level, year and industry enter the chosen model, that apparent advantage does not persist.',
         '原始分组里，至少三家券商覆盖的盈利公司，误差中位数比只有一家覆盖的公司低。把利润水平、年份和行业放进当前模型后，这个优势没有保留下来。'),
        ('Institution counts remain useful context. The present sample does not justify a rule that three or more forecasts are sufficiently reliable. The controls use realized profits, and the association is descriptive rather than causal.',
         '覆盖家数可以帮助理解样本特点。现有结果不足以支持至少三家覆盖就更可靠这样的筛选门槛。模型使用后来实现的利润，只能描述关联，无法说明覆盖家数导致了什么变化。')],
        ['coverage-profit', 'coverage-controlled-profit', 'coverage-loss', 'coverage-controlled-loss'])
    section('availability', ('What still needs verification?', '这些结果还需要怎样验证？'), [
        ('Historical forecasts were retrieved later. Their original unchanged availability is unverified. The profit-accuracy work covers 2015–2025; stock-return evidence has its own periods and cohorts. Compare each chart within its stated sample.',
         '历史预测是后来补拉的，我们还不能确认每个数值在当年是否已经原样可见。预测准确度研究覆盖2015年至2025年，选股研究有各自的区间和样本，请按每张图说明的范围理解。'),
        ('Immutable daily observations started on November 2, 2026. Future evaluation will use preserved observations and later outcomes. No prospective formation score or forward-return evaluation has yet been recorded in this evidence release.',
         '2026年11月2日已经开始保存每天实际拿到的快照。后续会用当时留存的预测，检验它之后真正发生的结果。本版证据还没有前瞻形成分数或后续收益评估。')], ['provider-delay', 'missing-endpoint-reasons'])
    page['reader'] = dict(title=text('What do these results tell us?', '这些结果怎么理解？'),
                          verdict=text('Near year-end, forecasts help estimate profitable companies’ annual earnings. Reliable stock selection still needs more evidence.', '临近年底，券商预测能帮助估计盈利公司这一年赚了多少。用它稳定选出收益更高的股票，还需要更多证据。'), navigation=text('Choose a question', '按问题阅读'),
                          open_chart=text('View chart', '查看对应图表'),
                          legend_note=text('Use the legend buttons to show or hide a series. Axes rescale to visible series. Exact tables retain every series.',
                                           '点击图例可以显示或隐藏一组数据，坐标轴会随显示的数据调整，精确数值表始终保留全部数据。'),
                          sections=sections)
    page['summary'] = verdict
    ids = {c['id'] for c in new_charts}
    # Keep all original evidence and prepend the new explanatory comparisons.
    page['charts'] = new_charts + [c for c in page['charts'] if c['id'] not in ids]
    page['sources'] = [s for s in page['sources'] if s['id'] != 'benchmark'] + [
        dict(id='benchmark', source_ref=REF,
             label=text('Prior-profit benchmark and coverage controls, 2015–2025', '2015年至2025年去年利润基准与覆盖家数研究'))]
    page['reader_source_revision'] = source['source_revision']
    page['source_revision'] = REVISION
    page['reviewed_at'] = '2026-11-03'
    path.write_text(json.dumps(page, ensure_ascii=False, indent=2) + '\n')
    catalog_path = DATA / 'research-studies.json'
    catalog = json.loads(catalog_path.read_text())
    for study in catalog['studies']:
        if study['id'] == 'broker-consensus':
            study['exploration_counts'] = {'steps': len(page['steps']), 'charts': len(page['charts'])}
            for locale in ('en-US', 'zh-CN'):
                study['translations'][locale]['summary'] = verdict[locale]
    catalog['updated_at'] = '2026-11-03'
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    navigation_path = DATA / 'study-navigation/broker-consensus.json'
    navigation = json.loads(navigation_path.read_text())
    navigation['reviewed_at'] = '2026-11-03'
    navigation['source_revision'] = REVISION
    navigation['source_refs'] = list(dict.fromkeys(navigation.get('source_refs', []) + [REF]))
    navigation_path.write_text(json.dumps(navigation, ensure_ascii=False, indent=2) + '\n')
    manifest_path = DATA / 'research-publication-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    projection = next(row for row in manifest['projections'] if row['public_id'] == 'broker-consensus')
    projection['source_refs'] = list(dict.fromkeys(projection.get('source_refs', []) + [REF]))
    projection['reader_source_revision'] = REVISION
    projection['exploration_reviewed_at'] = '2026-11-03'
    projection['benchmark_asset'] = 'data/broker-consensus-benchmark.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')




if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result', type=Path)
    args = parser.parse_args()
    if args.result:
        (DATA / 'broker-consensus-benchmark.json').write_text(
            json.dumps(project(json.loads(args.result.read_text())), ensure_ascii=False, indent=2) + '\n')
    enrich()
