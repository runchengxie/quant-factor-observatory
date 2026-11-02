"""Build a bilingual study from the reviewed aggregate allowlist export only."""

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "site/public/data"
STUDY = "broker-consensus"
REF = "doc:quant-research.research.broker-consensus-20261102"
FACTORS = ["profit_revision", "revision_breadth", "agreement", "earnings_yield"]
NAMES = [("Profit revision", "盈利预测上调幅度"), ("Net upgrade breadth", "机构净上调比例"),
         ("Low forecast disagreement", "机构预测接近程度"), ("Forward earnings yield", "预期盈利相对市值")]


def text(en, zh):
    return {"en-US": en, "zh-CN": zh}


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def build(owner_revision, runner_hash):
    aggregate_path = DATA / "broker-consensus-aggregate.json"
    data = json.loads(aggregate_path.read_text())
    summaries = {(s["timing"], s["adjustment"], s["factor"]): s for s in data["summaries"]}
    paired = {(s["timing"], s["adjustment"], s["factor"]): s for s in data["matched_timing_summaries"]}
    quality = data["forecast_quality"]
    years = [q["year"] for q in quality]
    sources = [{"id": "study", "source_ref": REF, "label": text("Study methods and retained results", "研究方法与核对结果")}]
    context = text(
        "Retrospective reconstruction. Report-clock and provider-clock full histories cover different months. Original forecast vintages remain unverified.",
        "本页按历史记录重建研究。研报日期口径和供应商时间口径覆盖的月份不同，历史版本仍未核实。",
    )

    def chart(identity, title, metric, categories, series, interpretation, unit="number", scope=None):
        return {"id": identity, "title": text(*title), "metric": text(*metric), "context": scope or context,
                "interpretation": text(*interpretation), "unit": unit,
                "categories": categories, "series": series, "source_ids": ["study"]}

    def series(identity, label, values):
        return {"id": identity, "label": text(*label), "values": values}

    year_labels = [text(str(y), str(y)) for y in years]
    factor_labels = [text(*name) for name in NAMES]
    arms = [("report", "raw", ("Report date, raw", "研报日期口径，原始排序")),
            ("report", "neutral", ("Report date, exposure adjusted", "研报日期口径，扣除行业和市值影响")),
            ("provider", "neutral", ("Provider time, exposure adjusted", "供应商时间口径，扣除行业和市值影响"))]
    charts = [
        chart("annual-records", ("How much history was retrieved?", "每年拉到了多少预测记录？"),
              ("Report and forecast-period records", "记录数，同一研报的不同预测年份分别计数"), year_labels,
              [series("records", ("Forecast records", "预测记录"), [q["rows"] for q in quality])],
              ("2026 ends on November 1; this partial year should not be compared as a full year.", "2026年数据截至11月1日，全年记录数还会变化。")),
        chart("annual-securities", ("How many stocks have forecasts?", "每年有多少只股票获得预测？"),
              ("Distinct covered securities", "当年至少有一条研报预测的股票数"), year_labels,
              [series("securities", ("Covered stocks", "覆盖股票数"), [q["symbols"] for q in quality])],
              ("Coverage is a selected analyst-followed population, not the entire market.", "券商覆盖集中在部分股票，研究结果适用于这些样本。")),
        chart("provider-delay", ("When was old information updated?", "旧研报的供应商更新时间晚了多久？"),
              ("Median days from report date to provider update", "供应商更新时间减去研报日期，中位数，单位为天"), year_labels,
              [series("delay", ("Median update delay", "更新时间相差天数中位数"), [q["provider_delay_median_days"] for q in quality])],
              ("January 2011 records were updated in May 2022. Their original first availability is unknown.", "2011年1月记录的供应商更新时间在2022年5月。我们还不知道原始版本何时首次可用。")),
    ]
    coverage_series = []
    for clock, label in [("report", ("Report-date reconstruction", "按研报日期重建")), ("provider", ("Provider-update guard", "增加供应商更新时间限制"))]:
        values = []
        for year in years:
            points = [p["securities"] for p in data["coverage"] if p["timing"] == clock and int(p["date"][:4]) == year]
            values.append(sum(points) / len(points) if points else None)
        coverage_series.append(series(clock, label, values))
    charts.append(chart("timing-coverage", ("How does the timing rule change coverage?", "改用供应商时间后，还能研究多少股票？"),
                        ("Mean eligible stocks per formation month", "每个汇总月份的平均合格股票数，预测数量门槛保持相同"), year_labels, coverage_series,
                        ("The provider-time sample begins in May 2022. Earlier zero coverage is not evidence of zero predictive ability.", "供应商时间口径从2022年5月起才有足够样本。更早的合格股票数为零，缺少可检验样本。")))
    charts.append(chart("rank-comparison", ("Which scores line up with later stock returns?", "哪些排序与随后收益较接近？"),
                        ("Monthly mean RankIC, a rank correlation", "月度平均排名相关系数，正值表示高分股票随后往往表现较好"), factor_labels,
                        [series(f"{clock}-{adjust}", label, [summaries[clock, adjust, factor]["rank_ic"]["mean"] for factor in FACTORS]) for clock, adjust, label in arms],
                        ("Raw profit revision weakens after exposure adjustment. Correlations are not return percentages or success probabilities.", "上调幅度在扣除行业和市值影响后关系较弱。相关系数表示排序接近程度，数值单位与收益率不同。")))
    charts.append(chart("matched-timing-ranks", ("Compare timing on identical stocks and months", "在同一批股票和月份上比较时间口径"),
                        ("Exposure-adjusted mean RankIC on matched samples", "相同股票、月份和有效因子样本，扣除行业和市值影响后的平均排名相关系数"), factor_labels,
                        [series(clock, label, [paired[clock, "neutral", factor]["rank_ic"]["mean"] for factor in FACTORS]) for clock, label in
                         [("report", ("Report date", "研报日期")), ("provider", ("Provider update", "供应商更新时间"))]],
                        ("Matched recent results are similar. Full-history differences also reflect period and coverage changes.", "近期配对结果接近。完整历史图中的差异也受到年份和覆盖变化影响。"),
                        scope=text("Identical stocks, months and valid factor values in both arms. Revision and breadth have 50 months; agreement and yield have 52. Original vintages remain unverified.", "此图比较相同股票、月份和有效因子样本。上调幅度和净上调比例各有50个月，另两项各有52个月。历史版本仍未核实。")))
    for factor, name in zip(FACTORS, NAMES):
        identity = "profit-revision-years" if factor == "profit_revision" else factor.replace("_", "-") + "-years"
        annual_series = []
        for clock, adjustment, label in arms:
            observed = {row["year"]: row["rank_ic"]["mean"] for row in summaries[clock, adjustment, factor]["years"]}
            annual_series.append(series(f"{clock}-{adjustment}", label, [observed.get(year) for year in years]))
        charts.append(chart(identity, (f"Annual stability of {name[0].lower()}", f"{name[1]}在不同年份怎样变化？"),
                            ("Mean monthly RankIC within each year", "当年各有效月份的排名相关系数平均值"), year_labels, annual_series,
                            ("Blank values have no valid sample. Year slices are retrospective and do not establish an untouched holdout.", "空白年份缺少有效样本。各年份都属于回溯检查，尚未形成前瞻验证。")))
    charts.append(chart("complete-spread-months", ("How many months have complete group returns?", "有多少个月能完整计算分组收益？"),
                        ("Months with every selected endpoint priced", "选中股票都有入场和期末价格的月份数"), factor_labels,
                        [series(f"{clock}-{adjustment}", label, [summaries[clock, adjustment, factor]["spread"]["months"] for factor in FACTORS]) for clock, adjustment, label in arms],
                        ("Many months are incomplete. These subsets cannot support a continuous portfolio return claim.", "缺失月份较多，现有分组收益只能作为局部诊断，连续策略收益仍待补齐。")))
    charts.append(chart("cost-sensitivity", ("What happens after assumed transaction costs?", "加上交易费用后，完整月份的结果怎样？"),
                        ("Mean monthly top-minus-bottom return, complete months only", "扣除行业和市值影响后，高分组减去低分组的月度平均收益，仅含价格完整月份"), factor_labels,
                        [series(str(bps), ("Before costs", "费用前") if bps == 0 else (f"{bps} bps per side", f"单边费用{bps / 100:.2f}％"),
                                [summaries["report", "neutral", factor]["spread" if bps == 0 else f"spread_after_{bps}bps"]["mean"] for factor in FACTORS]) for bps in (0, 5, 10, 25)],
                        ("Every 10-bps net-spread uncertainty interval includes zero. Borrow, execution constraints and terminal liquidation are excluded.", "单边费用0.10％时，四项净收益差的不确定区间都包含零。这里尚未计入借券、交易限制和最终清仓费用。"), unit="percent"))

    annual_ids = {("profit-revision-years" if f == "profit_revision" else f.replace("_", "-") + "-years"): f for f in FACTORS}
    for comparison in charts:
        for line in comparison["series"]:
            estimates = None
            if comparison["id"] == "rank-comparison":
                clock, adjustment = line["id"].rsplit("-", 1)
                estimates = [summaries[clock, adjustment, f]["rank_ic"] for f in FACTORS]
            elif comparison["id"] == "matched-timing-ranks":
                estimates = [paired[line["id"], "neutral", f]["rank_ic"] for f in FACTORS]
            elif comparison["id"] == "cost-sensitivity":
                metric = "spread" if line["id"] == "0" else f"spread_after_{line['id']}bps"
                estimates = [summaries["report", "neutral", f][metric] for f in FACTORS]
            elif comparison["id"] in annual_ids:
                clock, adjustment = line["id"].rsplit("-", 1)
                observed = {r["year"]: r["rank_ic"] for r in summaries[clock, adjustment, annual_ids[comparison["id"]]]["years"]}
                estimates = [observed.get(y, {"months": 0, "lower": None, "upper": None}) for y in years]
            if estimates is not None:
                line.update({field: [estimate[field] for estimate in estimates] for field in ("months", "lower", "upper")})
        if any("months" in line for line in comparison["series"]):
            comparison["context"] = {locale: comparison["context"][locale] + addition for locale, addition in
                                      [("en-US", " Lines show descriptive 95% intervals. The table retains each series' valid months and bounds; fewer than 12 months has no interval."),
                                       ("zh-CN", " 横线显示描述性95％区间，越长表示估计越不确定，跨过零时方向还不清楚。表格保留有效月份和区间，少于12个月时不估计区间。")]}

    def step(identity, title, question, finding, decision):
        return {"id": identity, "period": text("Reviewed November 2, 2026", "2026年11月2日核对"), "status": "diagnostic",
                "title": text(*title), "question": text(*question), "finding": text(*finding), "decision": text(*decision), "source_ids": ["study"]}

    exploration = {"schema_version": "observatory.study_exploration.v1", "study_id": STUDY, "source_ref": REF,
                   "source_revision": owner_revision, "reviewed_at": "2026-11-02", "evidence_stage": "retrospective_diagnostic",
                   "expanded_details": True, "summary": text("Profit revision has a weak exposure-adjusted ranking relationship. Forward earnings yield has the clearest association, with original availability and investability unresolved.", "盈利预测上调幅度在扣除行业和市值影响后关系较弱。预期盈利相对市值的关联较清楚，历史版本和交易可行性仍待核实。"),
                   "sources": sources, "charts": charts, "conclusion_changes": [],
                   "steps": [
                       step("history", ("Retrieve and verify the history", "拉取历史记录并核对完整性"), ("What does the source actually cover?", "这批数据覆盖了什么？"), ("191 monthly partitions contain 2,749,081 report/period records; all payload hashes were checked.", "191个月共2749081条研报预测记录，逐月载荷哈希已核对。"), ("Keep vendor records private and retain annual coverage.", "原始研报留在数据平台，页面展示逐年覆盖。")),
                       step("availability", ("Check historical availability", "核对历史数据何时可见"), ("Can old report dates establish original availability?", "旧研报的日期能支持多长的历史检验？"), ("2011 provider updates are in 2022; the provider-clock cohort begins in May 2022.", "2011年记录的供应商更新时间在2022年，供应商时间口径从2022年5月起有足够样本。"), ("Retain separate full-history and matched-clock comparisons.", "分别保留完整历史结果和同样本时间口径对照。")),
                       step("factors", ("Compare the four fixed scores", "比较四类固定排序"), ("Which association remains after exposure controls?", "扣除行业和市值影响后，哪些关系还存在？"), ("Adjusted report-clock profit-revision RankIC is 0.00149; forward yield is 0.03649.", "研报日期口径中，上调幅度的调整后排名相关系数为0.00149，预期盈利相对市值为0.03649。"), ("Keep all definitions as research candidates; no trading rule is promoted.", "四类定义继续保留为研究候选，交易规则仍需验证。")),
                       step("returns", ("Retain missing-return and cost limits", "保留价格缺失和费用限制"), ("Can the return diagnostic support an investable strategy?", "现有收益结果离实际交易还有多远？"), ("Adjusted spread samples have only 46–54 complete months. All 10-bps net-spread intervals include zero.", "调整后的分组收益各有46至54个完整月份。单边费用0.10％时，四项净收益差的不确定区间都包含零。"), ("Resolve terminal events and observe genuinely later snapshots before promotion.", "继续核对终止事件，并积累新观察日版本及随后结果。")),
                   ], "next_question": text("Does forecast information add to currently reported valuation on newly observed snapshots?", "在新观察日版本中，预测信息能否比当前已公布盈利多提供一些帮助？")}
    write(DATA / f"study-exploration/{STUDY}.json", exploration)

    limitations = text("Historical vintages, delisting settlement and actual fills are unverified. Intervals are descriptive and multiple comparisons are unadjusted.", "历史版本、退市结算和实际成交仍待核实。不确定区间用于描述样本波动，多项比较尚未作统一校正。")
    tasks = [{"id": "consensus-observation-vintages", "priority": "P1", "status": "ready",
              "action": text("Accumulate immutable observation-date snapshots and score later outcomes.", "积累不可变的观察日快照，再检验随后结果。"),
              "acceptance": text("Retain original retrieval versions and predeclared future outcomes.", "保留原始抓取版本，事先记录未来检验的结果口径。")},
             {"id": "consensus-terminal-prices", "priority": "P1", "status": "blocked",
              "action": text("Resolve missing terminal prices and qualify trading constraints.", "补齐期末价格和终止事件，核对交易限制。"),
              "acceptance": text("Every selected endpoint has a justified value and fill assumptions are separately qualified.", "每个选中股票的期末价值有据可查，成交假设另行核对。")}]
    trust_details = [
        ("announcement_clock", "partial", "Separate report and provider clocks, with matched recent samples.", "分别核对研报和供应商时间，并保留近期同样本对照。"),
        ("financial_versions", "unverified", "Original provider vintages remain unknown, especially before the 2022 update batch.", "原始历史版本仍缺少记录，2022年批量更新之前尤其明显。"),
        ("historical_universe", "partial", "Historical price observations are used; analyst coverage and industry vintages remain selected or reconstructed.", "使用历史行情中的股票，券商覆盖有选择性，行业归属按记录重建。"),
        ("delisting_and_terminal", "unverified", "Selected missing prices suppress the monthly spread; settlement values remain unresolved.", "选中股票缺价格时整月不报收益差，退市结算价值仍待补齐。"),
        ("execution_timing", "partial", "Next-session close to next formation next-session close; actual fills are unqualified.", "从汇总日的下一交易日收盘算到下次入场日收盘，实际成交仍待核对。"),
        ("transaction_costs", "partial", "Three per-side fee assumptions; borrowing, impact and terminal liquidation are excluded.", "比较三档单边费用，尚未计入借券、冲击和最终清仓费用。"),
    ]
    navigation = {"schema_version": "observatory.study_navigation.v1", "study_id": STUDY, "source_ref": REF,
                  "source_revision": owner_revision, "reviewed_at": "2026-11-02", "authority_ref": REF,
                  "trust": [{"dimension": d, "status": s, "detail": text(en, zh), "source_refs": [REF]} for d, s, en, zh in trust_details],
                  "reproduction": {"run_id": "consensus_forecasts_20261102_run02", "status": "artifact_verified",
                                   "code_revision": data["run_code_revision"], "runner_sha256": runner_hash,
                                   "data_version": text("Completed 191-month acquisition and hashed run-02 inputs/results.", "已完成191个月回补，并记录第二次运行的输入和结果哈希。"),
                                   "missing": limitations, "source_refs": [REF], "artifact_sha256": {"research_result": data["result_sha256"], "public_aggregate": hashlib.sha256(aggregate_path.read_bytes()).hexdigest()}},
                  "decision": "research_only", "resume_when": exploration["next_question"], "next_tasks": tasks,
                  "diagnostic_intervals": [], "diagnostic_note": None, "scale_slices": [], "calibration": []}
    write(DATA / f"study-navigation/{STUDY}.json", navigation)

    def copy(locale):
        zh = locale == "zh-CN"
        rows = []
        explanations = [("How much the same brokers changed their profit forecasts", "同一家机构提高或降低了多少盈利预测"),
                        ("Share upgrading minus share downgrading", "上调机构占比减去下调机构占比"),
                        ("How close brokers' profit estimates are", "机构给出的盈利预测是否接近"),
                        ("Forecast profit relative to total market value", "预测盈利相对公司总市值有多高")]
        for factor, name, explanation in zip(FACTORS, NAMES, explanations):
            metric = summaries["report", "neutral", factor]["rank_ic"]
            rows.append([name[1 if zh else 0], explanation[1 if zh else 0], f"{metric['mean']:.5f}", f"[{metric['lower']:.5f}, {metric['upper']:.5f}]", str(metric["months"])])
        return {"title": "券商盈利预测能帮助选股吗？" if zh else "Can broker earnings forecasts help rank stocks?",
                "family": "盈利预期与估值" if zh else "Earnings expectations and valuation",
                "status_label": "回溯检验已完成，历史版本仍待核实" if zh else "Historical diagnostic complete; original vintages unverified",
                "summary": exploration["summary"][locale], "period": "汇总日从2011年1月至2026年8月，预测原始记录截至2026年11月1日" if zh else "Formations January 2011–August 2026; source forecasts through November 1, 2026",
                "source_note": "我们在每月最后一个交易日汇总预测，从下一交易日收盘算到下次入场日收盘。下表按研报日期重建，并扣除行业和市值影响。排名相关系数表示排序接近程度，收益结果另列。区间没有校正多项比较。" if zh else "Forecasts are collected on each month's last trading day. Returns run from the next session close to the following entry close. Table uses report-date reconstruction and exposure adjustment. RankIC is a ranking association; return diagnostics are separate. Intervals are not adjusted for multiple comparisons.",
                "columns": ["排序依据", "它比较什么", "平均排名相关系数", "描述性95％区间", "有效月份"] if zh else ["Score", "What it compares", "Mean RankIC", "Descriptive 95% interval", "Valid months"], "rows": rows,
                "findings": [step["finding"][locale] for step in exploration["steps"]],
                "limits": [limitations[locale], "分组收益只覆盖价格完整月份，连续策略收益仍缺少证据。" if zh else "Group returns use complete endpoint months only; a continuous investable strategy is unqualified."]}
    catalog = json.loads((DATA / "research-studies.json").read_text())
    study = {"id": STUDY, "series": "fundamental", "market": "a_share", "method": ["direct_factor_test", "cross_sectional_ranking", "robustness"],
             "frequency": ["monthly", "event_driven"], "evidence_stage": "retrospective_diagnostic", "publication_id": STUDY, "source_ref": REF,
             "status": "preliminary", "translations": {locale: copy(locale) for locale in ("en-US", "zh-CN")},
             "exploration_asset": f"data/study-exploration/{STUDY}.json", "exploration_counts": {"steps": 4, "charts": len(charts)},
             "navigation_asset": f"data/study-navigation/{STUDY}.json",
             "navigation_summary": {"run_id": navigation["reproduction"]["run_id"], "reproduction_status": "artifact_verified", "decision": "research_only", "negative_result": True, "resume_when": exploration["next_question"], "tasks": tasks},
             "evidence_summary": {"decision": "research_only", "scope": text("Four broker forecast score families", "四类券商盈利预测排序"), "baseline": text("Exposure controls and matched timing samples", "行业市值控制和同样本时间口径对照"), "input_basis": limitations, "sample": text("188 formation months; source vintage incomplete", "188个汇总月份，历史原始版本记录不完整")},
             "related_studies": [], "source_review_status": {"status": "matched", "checked_at": "2026-11-02"}}
    catalog["studies"] = [s for s in catalog["studies"] if s["id"] != STUDY] + [study]
    catalog["series"][0]["study_ids"] = [s["id"] for s in catalog["studies"]]
    catalog["updated_at"] = "2026-11-02"
    write(DATA / "research-studies.json", catalog)
    manifest = json.loads((DATA / "research-publication-manifest.json").read_text())
    projection = {"public_id": STUDY, "source_ref": REF, "source_status": "pilot", "publication_status": "reviewed_aggregate",
                  "locales": ["en-US", "zh-CN"], "allowed_fields": ["title", "family", "status", "summary", "period", "findings", "limits", "aggregate_rows", "aggregate_charts", "source_references", "evidence_summary", "navigation_summary"],
                  "excluded_fields": ["private_data_paths", "credentials", "per_security_signals", "portfolio_weights", "execution_details", "private_code"],
                  "exploration_asset": study["exploration_asset"], "exploration_reviewed_at": "2026-11-02", "navigation_asset": study["navigation_asset"]}
    manifest["projections"] = [p for p in manifest["projections"] if p["public_id"] != STUDY] + [projection]
    manifest["generated_at"] = "2026-11-02"
    write(DATA / "research-publication-manifest.json", manifest)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--owner-revision", required=True)
    parser.add_argument("--runner-sha256", required=True)
    args = parser.parse_args()
    build(args.owner_revision, args.runner_sha256)
