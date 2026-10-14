type Point = { x?: number; y?: number; label?: string; color?: string; name?: string; values?: Array<number | null> }
type Props = {
  kind: 'line' | 'bar' | 'horizontal-bar' | 'scatter'
  points?: Point[]
  labels?: string[]
  values?: Array<number | null>
  colors?: string[]
  height?: number
  description: string
  percent?: boolean
}

const axis = '#81796e'
const grid = '#e8e1d6'
const ink = '#514b43'
const width = 720
const bottom = 260

function tickLabel(value: number, percent: boolean) {
  return percent ? `${(value * 100).toFixed(0)}%` : Number(value.toPrecision(3)).toString()
}

export default function ChartSvg({ kind, points = [], labels = [], values = [], colors = [], height = 300, description, percent = false }: Props) {
  const left = kind === 'horizontal-bar' ? 175 : 62
  const right = kind === 'scatter' ? 28 : 18
  const top = 18
  const plotW = width - left - right
  const plotH = bottom - top
  if (kind === 'horizontal-bar') {
    const max = Math.max(1, ...points.map((point) => point.x ?? 0))
    const rowH = plotH / Math.max(points.length, 1)
    return <svg className="chart-svg" role="img" aria-label={description} viewBox={`0 0 ${width} ${bottom + 30}`} style={{ height }}>
      {points.map((point, index) => <g key={`${point.label}-${index}`}><text x={left - 10} y={top + index * rowH + rowH * .65} textAnchor="end" fill={ink} fontSize="12">{point.label}</text><rect x={left} y={top + index * rowH + rowH * .2} width={Math.max(0, (point.x ?? 0) / max * plotW)} height={rowH * .52} fill={point.color ?? '#d8a58b'}><title>{`${point.label}: ${point.x}`}</title></rect><text x={left + (point.x ?? 0) / max * plotW + 5} y={top + index * rowH + rowH * .62} fill={ink} fontSize="11">{point.x}</text></g>)}
      <line x1={left} x2={width - right} y1={bottom} y2={bottom} stroke={axis} />
    </svg>
  }

  const ys = kind === 'scatter'
    ? points.map((point) => point.y ?? 0)
    : kind === 'line'
      ? points.flatMap((series) => (series.values ?? []).filter((value): value is number => value !== null))
      : values.filter((value): value is number => value !== null)
  let minY = Math.min(0, ...ys)
  let maxY = Math.max(0, ...ys)
  if (kind === 'scatter') { minY = Math.min(...ys, -.02); maxY = Math.max(...ys, .02) }
  if (maxY === minY) maxY = minY + 1
  const y = (value: number) => bottom - (value - minY) / (maxY - minY) * plotH
  const x = (index: number) => left + (index + .5) / Math.max(labels.length, 1) * plotW
  return <svg className="chart-svg" role="img" aria-label={description} viewBox={`0 0 ${width} ${bottom + 30}`} style={{ height }}>
    {Array.from({ length: 5 }, (_, index) => { const v = maxY - (maxY - minY) * index / 4; return <g key={index}><line x1={left} x2={width - right} y1={y(v)} y2={y(v)} stroke={grid} /><text x={left - 8} y={y(v) + 4} textAnchor="end" fill={axis} fontSize="11">{tickLabel(v, percent)}</text></g> })}
    <line x1={left} x2={width - right} y1={bottom} y2={bottom} stroke={axis} />
    {kind === 'line' && labels.map((label, index) => index % Math.max(1, Math.ceil(labels.length / 6)) === 0 || index === labels.length - 1 ? <text key={`x-${index}`} x={x(index)} y={bottom + 19} textAnchor="middle" fill={axis} fontSize="11">{label}</text> : null)}
    {kind === 'bar' && values.map((value, index) => value === null ? null : <g key={labels[index]}><rect x={x(index) - Math.min(26, plotW / Math.max(labels.length, 1) * .32)} y={Math.min(y(value), y(0))} width={Math.min(52, plotW / Math.max(labels.length, 1) * .64)} height={Math.max(1, Math.abs(y(value) - y(0)))} fill={colors[index] ?? '#d8a58b'}><title>{`${labels[index]}: ${tickLabel(value, percent)}`}</title></rect><text x={x(index)} y={bottom + 19} textAnchor="middle" fill={axis} fontSize="11">{labels[index]}</text></g>)}
    {kind === 'line' && points.map((series) => {
      const runs: Point[][] = []
      let current: Point[] = []
      ;(series.values ?? []).forEach((value, index) => { if (value === null || !Number.isFinite(value)) { if (current.length) runs.push(current); current = [] } else current.push({ x: x(index), y: y(value), label: `${series.name ?? 'series'} · ${labels[index]}: ${tickLabel(value, false)}`, color: series.color }) })
      if (current.length) runs.push(current)
      return <g key={series.name ?? 'series'}>{runs.map((run, ri) => run.length === 1 ? <circle key={ri} cx={run[0].x} cy={run[0].y} r="3" fill={series.color}><title>{run[0].label}</title></circle> : <polyline key={ri} points={run.map((point) => `${point.x ?? 0},${point.y ?? 0}`).join(' ')} fill="none" stroke={series.color} strokeWidth="2" />)}<title>{series.name ?? 'series'}</title></g>
    })}
    {kind === 'scatter' && points.map((point, index) => <circle key={index} cx={left + ((point.x ?? 0) - Math.min(...points.map((p) => p.x ?? 0), 0)) / (Math.max(...points.map((p) => p.x ?? 0), 1) - Math.min(...points.map((p) => p.x ?? 0), 0) || 1) * plotW} cy={y(point.y ?? 0)} r="3" fill="#b64d33" opacity=".55"><title>{point.label}: {(point.x ?? 0).toFixed(3)}, {(point.y ?? 0).toFixed(3)}</title></circle>)}
  </svg>
}
