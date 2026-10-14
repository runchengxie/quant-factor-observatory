import { Alpha810CatalogEntry } from '../components/ResearchExplorationEntries'
import { useMemo, useState } from 'react'
import { filterResearchRecords, sortResearchRecords } from '../research'
import { localizeFactorRecord, localizedStatus } from '../researchLocale'
import type { ExplorerFilters, ExplorerSort, FactorRecord, ResearchContext } from '../types'
import { useLocale } from '../i18n'
import ContextStrip from '../components/ContextStrip'

function initialFilters(): ExplorerFilters {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')
  return {
    query: params.get('q') ?? '',
    family: params.get('family') ?? '',
    frequency: params.get('frequency') ?? '',
    status: status === 'descriptive' || status === 'experimental' || status === 'validated' ? status : '',
  }
}

function updateQuery(filters: ExplorerFilters, sort: ExplorerSort) {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.family) params.set('family', filters.family)
  if (filters.frequency) params.set('frequency', filters.frequency)
  if (filters.status) params.set('status', filters.status)
  if (sort !== 'name') params.set('sort', sort)
  const query = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
}

export default function FactorExplorerPage({ records, context }: { records: FactorRecord[]; context: ResearchContext }) {
  const { locale, copy } = useLocale()
  const english = locale === 'en-US'
  const localizedRecords = useMemo(() => records.map((record) => localizeFactorRecord(record, locale)), [records, locale])
  const [filters, setFilters] = useState<ExplorerFilters>(initialFilters)
  const [sort, setSort] = useState<ExplorerSort>((new URLSearchParams(window.location.search).get('sort') as ExplorerSort) || 'name')
  const families = useMemo(() => [...new Set(localizedRecords.map((record) => record.family))].sort(), [localizedRecords])
  const frequencies = useMemo(() => [...new Set(localizedRecords.map((record) => record.frequencyIn).filter(Boolean))] as string[], [localizedRecords])
  const visible = useMemo(() => sortResearchRecords(filterResearchRecords(localizedRecords, filters), sort), [filters, localizedRecords, sort])
  const tableHeaders = english ? ['Factor', 'Family', 'Frequency', 'Valid values', 'Status'] : ['因子', '因子族', '频率', '有效值', '状态']

  function changeFilters(next: Partial<ExplorerFilters>) {
    const value = { ...filters, ...next }
    setFilters(value)
    updateQuery(value, sort)
  }

  function changeSort(value: ExplorerSort) {
    setSort(value)
    updateQuery(filters, value)
  }

  function clearFilters() {
    const value: ExplorerFilters = { query: '', family: '', frequency: '', status: '' }
    setFilters(value)
    setSort('name')
    updateQuery(value, 'name')
  }

  return <main className="page explorer-page">
    <a className="back" href={import.meta.env.BASE_URL}>← {english ? 'Factor overview' : '因子总览'}</a>
    <section className="detail-head explorer-head"><p className="eyebrow">FACTOR EXPLORER</p><h1>{english ? 'Factor catalog' : '因子目录'}</h1><p className="lede">{copy.factor.catalogLede}</p><span className="badge">{copy.factor.catalogBadge} · {localizedRecords.length} {english ? 'ENTRIES' : '个条目'}</span></section>
    <ContextStrip items={[{ label: english ? 'Market data' : '市场数据', value: context.source }, { label: english ? 'Sample range' : '样本区间', value: context.snapshotRange }, { label: english ? 'Sample universe' : '样本股票池', value: context.universe }, { label: 'PIT', value: english ? context.pitStatus : '此市场示例未验证 PIT' }]} />
    <p className="context-note">{english ? 'This market sample is an illustration. The financial-data page uses a separate point-in-time (PIT) snapshot, showing what was available on each historical date. The two datasets cover different records, so their valid-value counts cannot be compared directly.' : '这里的市场样本用于演示。基本面页面使用另一份点时（PIT）快照，按历史日期展示当时可用的信息。两份数据覆盖的记录不同，因此有效值数量不能直接比较。'} <a href={`${import.meta.env.BASE_URL}fundamentals`}>{english ? 'View financial-data snapshot →' : '查看基本面数据 →'}</a></p>
    <Alpha810CatalogEntry />
    <section className="panel explorer-panel">
      <div className="explorer-toolbar">
        <label className="search-field"><span>{english ? 'Search' : '搜索'}</span><input value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} placeholder={english ? 'Factor name, definition, input…' : '因子名、定义、输入字段…'} /></label>
        <label><span>{english ? 'Family' : '因子族'}</span><select value={filters.family} onChange={(event) => changeFilters({ family: event.target.value })}><option value="">{english ? 'All' : '全部'}</option>{families.map((family) => <option key={family} value={family}>{family}</option>)}</select></label>
        <label><span>{english ? 'Frequency' : '频率'}</span><select value={filters.frequency} onChange={(event) => changeFilters({ frequency: event.target.value })}><option value="">{english ? 'All' : '全部'}</option>{frequencies.map((frequency) => <option key={frequency} value={frequency}>{frequency}</option>)}</select></label>
        <label><span>{english ? 'Status' : '状态'}</span><select value={filters.status} onChange={(event) => changeFilters({ status: event.target.value as ExplorerFilters['status'] })}><option value="">{english ? 'All' : '全部'}</option><option value="descriptive">{english ? 'Descriptive snapshot' : '描述性快照'}</option><option value="experimental">{english ? 'Experimental' : '实验性'}</option><option value="validated">{english ? 'Validated' : '已验证'}</option></select></label>
        <label><span>{english ? 'Sort' : '排序'}</span><select value={sort} onChange={(event) => changeSort(event.target.value as ExplorerSort)}><option value="name">{english ? 'Name' : '名称'}</option><option value="coverage">{english ? 'Valid values' : '有效值'}</option><option value="status">{english ? 'Status' : '状态'}</option></select></label>
        <button className="quiet-button" onClick={clearFilters}>{english ? 'Clear filters' : '清除筛选'}</button>
      </div>
      <div className="explorer-summary"><span>{english ? `Showing ${visible.length} / ${localizedRecords.length} factors` : `显示 ${visible.length} / ${localizedRecords.length} 个因子`}</span>{filters.query || filters.family || filters.frequency || filters.status ? <span className="muted">{english ? 'Filters applied' : '已应用筛选'}</span> : <span className="muted">{english ? 'Full research catalog' : '完整研究目录'}</span>}</div>
      {visible.length ? <div className="table-scroll"><table className="factor-table"><thead><tr>{tableHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{visible.map((record) => <tr key={record.id}><td><a href={`${import.meta.env.BASE_URL}factors/${encodeURIComponent(record.id)}`}><strong>{english ? record.displayName : record.displayNameCn ?? record.displayName}</strong><small>{record.id}</small></a></td><td>{record.family}<small>{record.subfamily ?? '—'}</small></td><td>{record.frequencyIn ?? '—'} → {record.frequencyOut ?? '—'}</td><td>{record.coverage?.count?.toLocaleString() ?? (english ? 'Unavailable' : '不可用')}</td><td><span className={`status-pill status-${record.status}`}>{localizedStatus(record.status, locale)}</span></td></tr>)}</tbody></table></div> : <div className="empty-filter"><h2>{english ? 'No matching factors' : '没有匹配的因子'}</h2><p>{english ? 'No results match the current filters. Reduce the query or clear the filters.' : '当前筛选没有结果，请减少关键词或清除筛选条件。'}</p><button className="quiet-button" onClick={clearFilters}>{english ? 'Clear filters' : '清除筛选'}</button></div>}
    </section>
  </main>
}
