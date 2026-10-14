import type { JumpRow, Series } from './types'

export const finite = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value)
export const ratio = (part: number | null, whole: number | null) => finite(part) && part >= 0 && finite(whole) && whole > 0 ? part / whole : null
export function jumpStatus(row: JumpRow): 'valid' | 'invalid' | 'unavailable' {
  const values = [row.rv, row.ivhat, row.rjv, row.rljv, row.rsjv]
  if (!values.every(finite)) return 'unavailable'
  if (values.some(value => value! < 0)) return 'invalid'
  const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(Math.abs(b) * 1e-6, 1e-12)
  return close(row.ivhat! + row.rjv!, row.rv!) && close(row.rljv! + row.rsjv!, row.rjv!) ? 'valid' : 'invalid'
}
export function alignSeries(series: Series[], start: string, end: string) {
  const dates = [...new Set(series.flatMap(item => item.dates))].filter(date => (!start || date >= start) && (!end || date <= end)).sort()
  return { dates, series: series.map(item => {
    const byDate = new Map(item.dates.map((date, index) => [date, item.values[index]]))
    return { ...item, dates, values: dates.map(date => { const value = byDate.get(date); return finite(value) ? value : null }) }
  }) }
}
export function summarize(values: Array<number | null>) {
  const valid = values.filter(finite).sort((a, b) => a - b)
  const middle = Math.floor(valid.length / 2)
  return { count: valid.length, missing: values.length - valid.length,
    median: valid.length ? valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2 : null,
    min: valid[0] ?? null, max: valid[valid.length - 1] ?? null }
}
