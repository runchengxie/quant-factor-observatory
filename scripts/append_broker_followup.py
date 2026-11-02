"""Append reviewed paired-valuation evidence to the broker consensus study."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "site/public/data"
FOLLOWUP_REF = "doc:quant-research.research.broker-consensus-followup-20261102"
INITIAL_REF = "doc:quant-research.research.broker-consensus-20261102"


def bilingual(en: str, zh: str) -> dict[str, str]:
    return {"en-US": en, "zh-CN": zh}


def chart(
    identity,
    en,
    zh,
    metric_en,
    metric_zh,
    categories,
    series,
    context,
    interpretation,
    unit="number",
):
    return {
        "id": identity,
        "title": bilingual(en, zh),
        "metric": bilingual(metric_en, metric_zh),
        "context": bilingual(*context),
        "interpretation": bilingual(*interpretation),
        "unit": unit,
        "categories": categories,
        "series": series,
        "source_ids": ["followup"],
    }


def series(identity, en, zh, values, intervals=None):
    result = {"id": identity, "label": bilingual(en, zh), "values": values}
    if intervals is not None:
        result.update(
            months=[row["months"] for row in intervals],
            lower=[row["lower"] for row in intervals],
            upper=[row["upper"] for row in intervals],
        )
    return result


def build(source_path: Path, owner_revision: str) -> None:
    followup = json.loads(source_path.read_text())
    exploration_path = DATA / "study-exploration/broker-consensus.json"
    exploration = json.loads(exploration_path.read_text())
    exploration["source_revision"] = owner_revision
    exploration["reviewed_at"] = "2026-11-02"
    exploration["sources"] = [
        row for row in exploration["sources"] if row["id"] != "followup"
    ]
    followup_chart_ids = {
        "paired-valuation-rankic",
        "forecast-reported-rankic-delta",
        "forecast-reported-net-spread-delta",
        "missing-endpoint-reasons",
        "missing-endpoints-by-year",
        "paired-valuation-coverage",
    }
    exploration["charts"] = [
        row for row in exploration["charts"] if row["id"] not in followup_chart_ids
    ]
    followup_step_ids = {
        "paired-valuation",
        "price-gap-diagnosis",
        "prospective-protocol",
    }
    exploration["steps"] = [
        row for row in exploration["steps"] if row["id"] not in followup_step_ids
    ]
    exploration["sources"].append(
        {
            "id": "followup",
            "source_ref": FOLLOWUP_REF,
            "label": bilingual(
                "Matched valuation and missing-price follow-up",
                "同样本估值对照与缺失价格核查",
            ),
        }
    )

    summaries = followup["valuation_summaries"]
    metrics = {
        (row["timing"], row["adjustment"], row["factor"]): row for row in summaries
    }
    factors = ["reported_yield", "forecast_yield", "forecast_increment"]
    factor_labels = [
        bilingual("Reported earnings yield", "已披露盈利收益率"),
        bilingual("Forecast earnings yield", "预测盈利收益率"),
        bilingual("Forecast rank residual", "预测盈利排序残差"),
    ]
    levels = []
    for timing, adjustment, en, zh in (
        ("report", "neutral", "Report date, adjusted", "研报日期，已调整"),
        ("provider", "neutral", "Provider time, adjusted", "供应商更新时间，已调整"),
        ("report", "raw", "Report date, raw", "研报日期，未调整"),
        ("provider", "raw", "Provider time, raw", "供应商更新时间，未调整"),
    ):
        estimates = [
            metrics[timing, adjustment, factor]["rank_ic"] for factor in factors
        ]
        levels.append(
            series(
                f"{timing}-{adjustment}",
                en,
                zh,
                [x["mean"] for x in estimates],
                estimates,
            )
        )
    charts = [
        chart(
            "paired-valuation-rankic",
            "How do reported and forecast earnings yields rank stocks?",
            "已披露和预测盈利收益率怎样给股票排序？",
            "Mean monthly RankIC with calendar-aware 95% intervals",
            "月度平均排名相关系数与日历时间95％区间",
            factor_labels,
            levels,
            (
                "The forecast rank residual is the part of the forecast ranking left after removing its relationship with the reported earnings yield ranking. The adjusted version also removes industry and size effects. All three scores use the same positive-PE, positive-market-value and known-industry stock-month cohort within each timing rule.",
                "预测排序残差表示预测盈利排序中扣除已披露盈利排序后剩下的部分，调整版还扣除了行业和市值的影响。三类排序在每种时间口径下使用相同的正市盈率、正市值和已知行业股票月份样本。",
            ),
            (
                "The adjusted forecast-only estimate is close to the reported-yield estimate. Their direct paired differences are shown next.",
                "调整后的预测盈利收益率与已披露盈利收益率估计接近。下一张图直接比较同月差值。",
            ),
        )
    ]

    paired = followup["paired_deltas"]
    timing_label = {"report": "Report date", "provider": "Provider update time"}
    timing_label_zh = {"report": "研报日期", "provider": "供应商更新时间"}
    adjustment_label = {
        "raw": "raw ranking",
        "neutral": "industry and size adjusted",
    }
    adjustment_label_zh = {"raw": "未调整排序", "neutral": "扣除行业和市值影响"}
    paired_labels = [
        bilingual(
            f"{timing_label[row['timing']]}, {adjustment_label[row['adjustment']]}",
            timing_label_zh[row["timing"]]
            + "，"
            + adjustment_label_zh[row["adjustment"]],
        )
        for row in paired
    ]
    for field, identity, en, zh, metric_en, metric_zh, interp_en, interp_zh in (
        (
            "rank_ic_delta",
            "forecast-reported-rankic-delta",
            "Does forecast yield improve RankIC over reported yield?",
            "预测盈利收益率的排名相关性比已披露盈利高多少？",
            "Paired forecast-minus-reported mean monthly RankIC",
            "同月预测减已披露盈利的平均排名相关系数",
            "All four intervals include zero. The paired sample does not establish a forecast-only improvement.",
            "四组区间都包含零。配对样本无法确认预测盈利单独带来改善。",
        ),
        (
            "net_spread_delta",
            "forecast-reported-net-spread-delta",
            "How do paired net-spread differences look after 10 bps per side?",
            "单边扣除10基点后，配对净收益差怎样？",
            "Forecast-minus-reported monthly top-minus-bottom return",
            "预测减已披露盈利的月度高低组收益差",
            "Only months complete in both compared groups enter each estimate. The four samples contain different numbers of months.",
            "每组只纳入两种排序都有完整价格的月份。四组有效月份数不同。",
        ),
    ):
        estimates = [row[field] for row in paired]
        charts.append(
            chart(
                identity,
                en,
                zh,
                metric_en,
                metric_zh,
                paired_labels,
                [
                    series(
                        "paired-delta",
                        en,
                        zh,
                        [x["mean"] for x in estimates],
                        estimates,
                    )
                ],
                (
                    (
                        "For each common month, calculate RankIC for forecast and reported earnings-yield rankings, then subtract the reported RankIC from the forecast RankIC."
                        if field == "rank_ic_delta"
                        else "For each common month with complete endpoints, calculate both after-cost top-minus-bottom returns, then subtract the reported-yield spread from the forecast-yield spread."
                    ),
                    (
                        "每个共同月份先分别计算预测和已披露盈利排序的RankIC，再用预测值减去已披露值。"
                        if field == "rank_ic_delta"
                        else "每个价格完整的共同月份先分别计算两种排序扣费后的高低组收益差，再用预测盈利收益差减去已披露盈利收益差。"
                    ),
                ),
                (interp_en, interp_zh),
                "percent" if field == "net_spread_delta" else "number",
            )
        )

    endpoint = followup["endpoint_audit"]["counts"]
    reasons = [
        "suspension_evidence",
        "before_listing",
        "delisting_evidence",
        "unresolved_price_gap",
    ]
    reason_text = {
        "suspension_evidence": ("Suspension record", "有停牌记录"),
        "before_listing": ("Before listing", "上市之前"),
        "delisting_evidence": ("Delisting record", "有退市记录"),
        "unresolved_price_gap": ("Unresolved", "原因未确认"),
    }
    endpoints = ["entry_date", "exit_date"]
    endpoint_series = []
    for endpoint_name in endpoints:
        values = [
            sum(
                row["rows"]
                for row in endpoint
                if row["endpoint"] == endpoint_name and row["reason"] == reason
            )
            for reason in reasons
        ]
        label = (
            ("Entry date", "入场日")
            if endpoint_name == "entry_date"
            else ("Exit date", "出场日")
        )
        endpoint_series.append(series(endpoint_name, *label, values))
    charts.append(
        chart(
            "missing-endpoint-reasons",
            "Why are endpoint prices missing?",
            "入场日和出场日的价格为何缺失？",
            "Missing endpoint observations by diagnostic evidence",
            "按诊断线索统计的缺失价格端点数",
            [bilingual(*reason_text[reason]) for reason in reasons],
            endpoint_series,
            (
                "There are 11,498 missing endpoints across 8,399 stock-month rows. One stock-month can have two missing endpoints.",
                "8399条股票月份记录中有11498个缺失价格端点。同一条记录可能同时缺入场和出场价格。",
            ),
            (
                "Suspension records overlap most missing endpoints. Delisting data is diagnostic evidence; no terminal value was filled.",
                "大多数缺失端点对应到停牌记录。退市信息只用于诊断，没有补入终止价格。",
            ),
        )
    )

    annual = followup["annual_endpoint_counts"]
    years = sorted({int(row["year"]) for row in annual})
    annual_reasons = reasons
    charts.append(
        chart(
            "missing-endpoints-by-year",
            "How do missing endpoints change by formation year?",
            "不同汇总年份的缺失价格端点怎样变化？",
            "Count of missing endpoints, split by evidence",
            "按诊断线索拆分的缺失价格端点数",
            [bilingual(str(year), str(year)) for year in years],
            [
                series(
                    reason,
                    *reason_text[reason],
                    [
                        sum(
                            row["size"]
                            for row in annual
                            if int(row["year"]) == year and row["reason"] == reason
                        )
                        for year in years
                    ],
                )
                for reason in annual_reasons
            ],
            (
                "Years refer to portfolio formation dates. The suspension source ends September 17, 2026.",
                "年份按组合汇总日计算。停牌数据覆盖到2026年9月17日。",
            ),
            (
                "395 unresolved endpoints fall within suspension-source coverage and 2 fall after it. The 20-case API probe returned no quotes and is not representative.",
                "395个未确认端点位于停牌数据覆盖期内，2个在覆盖期后。另抽查20个案例均未返回报价，这组抽查不代表全部缺失案例。",
            ),
        )
    )

    coverage_rows = [
        row for row in followup["valuation_coverage"] if row["timing"] == "report"
    ]
    if len(coverage_rows) != 188:
        raise ValueError(
            "report-clock coverage must contain exactly 188 formation months"
        )
    totals = {
        "source_stocks": sum(row["source_stocks"] for row in coverage_rows),
        "paired_stocks": sum(row["paired_stocks"] for row in coverage_rows),
        "excluded_reported_pe": sum(
            row["excluded_reported_pe"] for row in coverage_rows
        ),
        "excluded_other_inputs": sum(
            row["excluded_other_inputs"] for row in coverage_rows
        ),
    }
    charts.append(
        chart(
            "paired-valuation-coverage",
            "How many stock-months enter the matched valuation sample?",
            "估值对照样本保留了多少股票月份？",
            "Stock-month rows over the 188-month report-clock history",
            "研报日期口径188个月内的股票月份记录数",
            [
                bilingual("Source panel", "原始样本"),
                bilingual("Paired valuation cohort", "配对估值样本"),
                bilingual("Excluded PE", "市盈率不可用"),
                bilingual("Other inputs missing", "其他输入缺失"),
            ],
            [
                series(
                    "coverage",
                    "Stock-month rows",
                    "股票月份记录",
                    list(totals.values()),
                )
            ],
            (
                "Rows can repeat a company across months. Blank or non-positive reported PE and other missing inputs are excluded before looking at future returns.",
                "研报日期口径覆盖188个月，共有271841条股票月份记录，估值配对样本保留219014条。同一家公司会在不同月份重复出现。市盈率为空或不为正、其他必要字段缺失的记录都在查看未来收益前剔除。",
            ),
            (
                "The paired valuation analysis retains 219,014 of 271,841 source stock-month rows. Excluded PE rows include loss-making companies and other vendor blanks.",
                "估值配对分析保留219014条，共271841条原始股票月份记录。市盈率剔除项既包括亏损公司，也包括供应商未提供数值的情况。",
            ),
        )
    )

    exploration["charts"].extend(charts)
    exploration["summary"] = bilingual(
        "The new matched-sample comparison does not establish that forecast earnings yield improves on reported earnings yield. A forecast rank residual remains positively associated with later returns in the retrospective sample. Price gaps are mostly linked to recorded suspensions, while settlement values and executable returns remain unresolved.",
        "同样本比较没有确认预测盈利收益率优于已披露盈利收益率。预测排序残差在这段历史样本里仍与随后收益正相关。大多数缺失价格对应到停牌记录，终止价值和实际可交易收益仍未确认。",
    )
    exploration["next_question"] = bilingual(
        "Do genuinely observed monthly snapshots add value when compared with reported valuation on identical stocks and dates?",
        "在同一批股票和日期上，真实按月保存的预测快照能否比已披露估值多提供信息？",
    )
    exploration["steps"].extend(
        [
            {
                "id": "paired-valuation",
                "period": bilingual(
                    "Retrospective follow-up, November 2, 2026",
                    "回溯补充分析，2026年11月2日",
                ),
                "status": "diagnostic",
                "title": bilingual(
                    "Compare forecasts with reported valuation",
                    "把预测盈利和已披露盈利放在同样本比较",
                ),
                "question": bilingual(
                    "Does forecast earnings yield improve stock ranking beyond reported earnings yield?",
                    "预测盈利收益率比已披露盈利收益率多提供多少排序信息？",
                ),
                "finding": bilingual(
                    "The paired forecast-minus-reported RankIC intervals include zero. The adjusted forecast residual has a positive historical association, which is descriptive.",
                    "预测减已披露盈利的配对区间都包含零。调整后的预测排序残差与随后收益呈正相关，这只是历史样本描述。",
                ),
                "decision": bilingual(
                    "Keep the forecast residual as a research candidate and collect genuinely dated snapshots before testing future returns.",
                    "保留预测排序残差作为研究候选，积累带真实日期的快照后再检验未来收益。",
                ),
                "source_ids": ["followup"],
            },
            {
                "id": "price-gap-diagnosis",
                "period": bilingual(
                    "Endpoint audit, November 2, 2026", "价格端点核查，2026年11月2日"
                ),
                "status": "diagnostic",
                "title": bilingual("Classify missing prices", "给缺失价格分类"),
                "question": bilingual(
                    "Do missing rows represent suspensions, listing dates or unresolved gaps?",
                    "缺失记录对应停牌、上市时间还是未确认缺口？",
                ),
                "finding": bilingual(
                    "10,764 of 11,498 endpoints overlap suspension records. The audit did not fill terminal settlement values.",
                    "11498个缺失端点中有10764个对应停牌记录。核查没有补入终止结算价值。",
                ),
                "decision": bilingual(
                    "Keep incomplete months out of net-spread estimates and retain unresolved cases as missing.",
                    "净收益差只使用价格完整的月份，未确认案例继续标为缺失。",
                ),
                "source_ids": ["followup"],
            },
            {
                "id": "prospective-protocol",
                "period": bilingual(
                    "Registered for prospective collection, starting November 2026",
                    "登记前瞻采集规则，2026年11月开始",
                ),
                "status": "protocol",
                "title": bilingual(
                    "Start immutable daily snapshots", "开始保存不可变的每日快照"
                ),
                "question": bilingual(
                    "Can stored forecasts be evaluated using only information completed before each decision date?",
                    "能否只用决策日前已完成保存的预测检验？",
                ),
                "finding": bilingual(
                    "The daily job and cutoff protocol are registered. No prospective forecasts or future returns are available yet.",
                    "每日采集和时间截止规则已经登记，目前还没有前瞻预测或未来收益结果。",
                ),
                "decision": bilingual(
                    "Use a snapshot only when its recorded completion time precedes the decision cutoff. Do not backfill missed observation days.",
                    "只使用记录的完成时间早于决策截止时点的快照。漏掉的观测日不补造。",
                ),
                "source_ids": ["followup"],
            },
        ]
    )

    exploration_path.write_text(
        json.dumps(exploration, ensure_ascii=False, indent=2) + "\n"
    )

    catalog_path = DATA / "research-studies.json"
    catalog = json.loads(catalog_path.read_text())
    study = next(row for row in catalog["studies"] if row["id"] == "broker-consensus")
    study["exploration_counts"] = {
        "steps": len(exploration["steps"]),
        "charts": len(exploration["charts"]),
    }
    study["source_review_status"] = {
        "status": "needs_review",
        "checked_at": "2026-11-02",
    }
    study["translations"]["en-US"].update(
        summary=exploration["summary"]["en-US"],
        findings=[row["finding"]["en-US"] for row in exploration["steps"]],
        limits=list(
            dict.fromkeys(
                study["translations"]["en-US"]["limits"]
                + [
                    "The paired forecast-minus-reported intervals include zero. Forecast residual results are descriptive, with no untouched holdout."
                ]
            )
        ),
    )
    study["translations"]["zh-CN"].update(
        summary=exploration["summary"]["zh-CN"],
        findings=[row["finding"]["zh-CN"] for row in exploration["steps"]],
        limits=list(
            dict.fromkeys(
                study["translations"]["zh-CN"]["limits"]
                + [
                    "预测减已披露盈利的配对区间包含零。预测排序残差只作历史描述，也没有独立留出样本。"
                ]
            )
        ),
    )
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

    manifest_path = DATA / "research-publication-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    projection = next(
        row for row in manifest["projections"] if row["public_id"] == "broker-consensus"
    )
    projection["source_refs"] = [INITIAL_REF, FOLLOWUP_REF]
    projection["source_note_revision"] = owner_revision
    projection["exploration_reviewed_at"] = "2026-11-02"
    projection["followup_asset"] = "data/broker-consensus-followup.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    navigation_path = DATA / "study-navigation/broker-consensus.json"
    navigation = json.loads(navigation_path.read_text())
    navigation["source_revision"] = owner_revision
    navigation["reviewed_at"] = "2026-11-02"
    navigation["trust"] = [
        row for row in navigation["trust"] if row["dimension"] != "forecast_increment"
    ]
    financial_versions = next(
        row for row in navigation["trust"] if row["dimension"] == "financial_versions"
    )
    financial_versions["detail"] = bilingual(
        "Original provider vintages remain unknown. Paired forecast-minus-reported results include zero, while the forecast rank residual remains descriptive.",
        "原始供应商版本仍未知。预测减已披露盈利的配对差值区间包含零，预测排序残差仍只作历史描述。",
    )
    financial_versions["source_refs"] = [INITIAL_REF, FOLLOWUP_REF]
    navigation["source_refs"] = [FOLLOWUP_REF]
    navigation["decision"] = "research_only"
    navigation["resume_when"] = exploration["next_question"]
    navigation_path.write_text(
        json.dumps(navigation, ensure_ascii=False, indent=2) + "\n"
    )

    public_followup_path = DATA / "broker-consensus-followup.json"
    public_followup_path.write_text(
        json.dumps(followup, ensure_ascii=False, indent=2) + "\n"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--owner-revision", required=True)
    options = parser.parse_args()
    build(options.source, options.owner_revision)
