import { expect, test } from '@playwright/test'
import { alignSeries, summarize, jumpStatus, ratio } from '../src/shapeExploration'
import { parseRiskHistory } from '../src/riskHistory'
import { readFileSync } from 'node:fs'
const snapshot = JSON.parse(readFileSync(new URL('../public/data/factor-snapshot.json', import.meta.url), 'utf8'))
const riskHistory = JSON.parse(readFileSync(new URL('../public/data/risk-history.json', import.meta.url), 'utf8'))

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.addInitScript(() => localStorage.setItem('quant-factor-locale', 'en-US'))
})

test('Hermite range filters align different ticker calendars and preserve missing values', async ({ page }) => {
  const data = structuredClone(snapshot)
  data.series = [
    { ticker: 'A', metric: 'h_daily_close60_ts_h3_60', dates: ['2026-06-01', '2026-06-02', '2026-06-03'], values: [2, null, 8] },
    { ticker: 'B', metric: 'h_daily_close60_ts_h3_60', dates: ['2026-06-02', '2026-06-03'], values: [4, 6] },
  ] as typeof data.series
  await page.route('**/data/factor-snapshot.json', route => route.fulfill({ json: data }))
  await page.goto('hermite')
  await expect(page.getByLabel('Hermite indicator')).toHaveValue('h_daily_close60_ts_h3_60')
  await page.getByLabel('Start date', { exact: true }).fill('2026-06-02')
  await page.getByLabel('Compare tickers').check()
  const summary = page.getByRole('table', { name: 'Series summary' })
  await expect(summary.getByRole('row').nth(1)).toContainText('8.0000')
  await expect(summary.getByRole('row').nth(1).getByRole('cell').nth(0)).toHaveText('1 / 2')
  await page.getByText('Daily values', { exact: true }).click()
  const observations = page.getByRole('table', { name: 'Daily values' })
  await expect(observations.getByRole('row').nth(1)).toContainText('2026-06-02')
  await expect(observations.getByRole('row').nth(1)).toContainText('—')
  await expect(observations.getByRole('row').nth(1)).toContainText('4.0000')
  await page.getByLabel('End date', { exact: true }).fill('2026-06-01')
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Reset dates' }).click()
  await expect(summary.getByRole('row').nth(1).getByRole('cell').nth(0)).toHaveText('2 / 3')
  await expect(summary.getByRole('row').nth(1)).toContainText('5.0000')
})

test('jump comparison sorts by share and refuses negative or unavailable decomposition', async ({ page }) => {
  const data = structuredClone(snapshot)
  data.jump_decomposition = [
    { ticker: 'A', date: '2026-06-01', rv: 10, ivhat: 6, rjv: 4, rljv: 3, rsjv: 1 },
    { ticker: 'B', date: '2026-06-01', rv: 10, ivhat: 2, rjv: 8, rljv: 5, rsjv: 3 },
    { ticker: 'C', date: '2026-06-01', rv: 0, ivhat: 1, rjv: -1, rljv: -1, rsjv: 0 },
    { ticker: 'D', date: '2026-06-01', rv: null, ivhat: null, rjv: null, rljv: null, rsjv: null },
  ] as typeof data.jump_decomposition
  await page.route('**/data/factor-snapshot.json', route => route.fulfill({ json: data }))
  await page.goto('jumps')
  await page.getByLabel('Sort observations').selectOption('share')
  const table = page.getByRole('table', { name: 'Compare observations' })
  await expect(table.getByRole('row').nth(1)).toContainText('B')
  await expect(table.getByRole('row').nth(1)).toContainText('80.00%')
  await expect(table.getByRole('row').nth(3)).toContainText('Invalid')
  await expect(table.getByRole('row').nth(4)).toContainText('Unavailable')
  await expect(page.getByRole('img', { name: 'Compare observations' }).locator('rect')).toHaveCount(6)
  await page.getByLabel('Comparison scale').selectOption('absolute')
  await expect(page.getByRole('img', { name: 'Compare observations' }).locator('rect').first()).toHaveAttribute('width', '124')
})

test('shape explorers localize controls and stay within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['hermite', 'jumps']) {
    await page.goto(route)
    await page.getByRole('button', { name: 'Switch to 中文' }).click()
    await expect(page.locator('main')).toContainText(route === 'hermite' ? '序列摘要' : '观测比较')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

// Boundary cases are checked independently of the displayed statistics.
test('shape calculations preserve zero and missing observations without inventing ratios', () => {
  expect(summarize([null, 0, 2, 10, null])).toEqual({ count: 3, missing: 2, median: 2, min: 0, max: 10 })
  expect(summarize([null, null])).toEqual({ count: 0, missing: 2, median: null, min: null, max: null })
  expect(summarize([2, 8])).toEqual({ count: 2, missing: 0, median: 5, min: 2, max: 8 })
  expect(alignSeries([{ ticker: 'A', metric: 'h3', dates: ['2026-06-03', '2026-06-01'], values: [3, 0] }], '2026-06-02', '2026-06-04').series[0].values).toEqual([3])
  expect(alignSeries([], '', '')).toEqual({ dates: [], series: [] })
  expect(ratio(0, 1)).toBe(0)
  expect(ratio(0, 0)).toBeNull()
  expect(ratio(-1, 1)).toBeNull()
  const row = { ticker: 'A', date: '2026-06-01', rv: 10, ivhat: 6, rjv: 4, rljv: 3, rsjv: 1 }
  expect(jumpStatus(row)).toBe('valid')
  expect(jumpStatus({ ...row, rv: 11 })).toBe('invalid')
  expect(jumpStatus({ ...row, rsjv: null })).toBe('unavailable')
})

test('all-missing Hermite observations retain coverage and localize the empty chart', async ({ page }) => {
  const data = structuredClone(snapshot)
  data.series = [{ ticker: 'A', metric: 'h_daily_close60_ts_h4_60', dates: ['2026-06-01', '2026-06-02'], values: [null, null] }]
  await page.route('**/data/factor-snapshot.json', route => route.fulfill({ json: data }))
  await page.goto('hermite')
  await expect(page.locator('.shape-trend .chart-empty')).toContainText('No series')
  const row = page.getByRole('table', { name: 'Series summary' }).getByRole('row').nth(1)
  await expect(row.getByRole('cell').nth(0)).toHaveText('0 / 2')
  await expect(row.getByRole('cell').nth(2)).toHaveText('—')
  await page.getByLabel('Start date', { exact: true }).fill('2027-01-01')
  await expect(page.locator('.exploration-panel > .chart-empty')).toBeVisible()
})

test('Hermite single-date ranges keep isolated observations visible on the chart', async ({ page }) => {
  const data = structuredClone(snapshot)
  data.series = [{ ticker: 'A', metric: 'h_daily_close60_ts_h3_60', dates: ['2026-06-01', '2026-06-02'], values: [null, 8] }]
  await page.route('**/data/factor-snapshot.json', route => route.fulfill({ json: data }))
  await page.goto('hermite')
  await page.getByLabel('Start date', { exact: true }).fill('2026-06-02')
  await page.getByLabel('End date', { exact: true }).fill('2026-06-02')
  await expect(page.locator('.shape-trend svg circle')).toHaveCount(1)
  await expect(page.locator('.shape-trend svg circle title')).toContainText('2026-06-02')
})

test('dark shape explorers retain readable chart labels, row labels and date inputs', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('quant-factor-theme', 'dark'))
  const contrast = async (selector: string, background: string) => page.locator(selector).first().evaluate((element, bgSelector) => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const luminance = (value: string) => rgb(value).map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4 }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
    const style = getComputedStyle(element)
    const fg = luminance(element.tagName.toLowerCase() === 'text' ? style.fill : style.color)
    const bg = luminance(getComputedStyle(document.querySelector(bgSelector)!).backgroundColor)
    return (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05)
  }, background)
  await page.goto('jumps')
  await expect(page.locator('.jump-comparison-svg')).toBeVisible()
  expect(await contrast('.jump-comparison-svg text', '.shape-comparison')).toBeGreaterThanOrEqual(4.5)
  expect(await contrast('.shape-table th[scope="row"]', '.shape-comparison')).toBeGreaterThanOrEqual(4.5)
  await page.goto('hermite')
  await expect(page.locator('input[type="date"]').first()).toBeVisible()
  expect(await contrast('input[type="date"]', 'input[type="date"]')).toBeGreaterThanOrEqual(4.5)
})

test('historical jump mode restores supported URL state and links to source quality', async ({ page }) => {
  await page.goto('jumps?mode=historical&granularity=annual&period=2025&component=pooled&private_path=%2Ftmp%2Fsecret')
  await expect(page.getByLabel('Data view')).toHaveValue('historical')
  await expect(page.getByLabel('Aggregation')).toHaveValue('annual')
  await expect(page.getByLabel('Period')).toHaveValue('2025')
  await expect(page.getByRole('table', { name: 'Reviewed historical aggregates' })).toContainText('2025')
  await expect(page.getByText('Continuous remainder (RV − RJV)')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Source and quality' })).toHaveAttribute('href', /quality/)
  expect(new URL(page.url()).searchParams.has('private_path')).toBe(false)
  await page.getByLabel('Data view').selectOption('demo')
  await expect(page.getByRole('table', { name: 'Compare observations' })).toBeVisible()
})

test('factor and study navigation connect to historical source diagnostics', async ({ page }) => {
  await page.goto('factors/volume_volatility')
  await expect(page.getByRole('link', { name: 'Jump variance history →' })).toHaveAttribute('href', /jumps\?mode=historical/)
  await expect(page.getByRole('link', { name: 'RV-shape history →' })).toHaveAttribute('href', /hermite\?mode=historical/)
  await page.goto('studies')
  await expect(page.getByRole('link', { name: 'Review historical risk source and data quality →' })).toHaveAttribute('href', /quality/)
})

test('browser parser rejects invalid public identity and preserves the reviewed contract', () => {
  expect(parseRiskHistory(riskHistory)?.coverage.sampled_securities).toBe(5394)
  expect(parseRiskHistory({ ...riskHistory, schema_version: '2.0' })).toBeNull()
  expect(parseRiskHistory({ ...riskHistory, private_path: '/secret' })).toBeNull()
  expect(parseRiskHistory({ ...riskHistory, coverage: { ...riskHistory.coverage, point_in_time_qualified: true } })).toBeNull()
})

test('historical Hermite mode shows RV-shape identity and paired sensitivity diagnostics', async ({ page }) => {
  await page.goto('hermite?mode=historical&granularity=annual&period=2025&metric=rv_shape_h4&unsupported=x')
  await expect(page.getByLabel('Data view')).toHaveValue('historical')
  await expect(page.locator('select[aria-label="RV-shape measure"]')).toHaveValue('rv_shape_h4')
  await expect(page.getByLabel('Period')).toHaveValue('2025')
  await expect(page.getByRole('heading', { name: 'RV-shape H4' })).toBeVisible()
  await expect(page.getByText('Window sensitivity')).toBeVisible()
  await expect(page.getByText('Same-date rank correlation')).toBeVisible()
  expect(new URL(page.url()).searchParams.has('unsupported')).toBe(false)
})

test('demo URL restores its metric, ticker and date while dropping unsupported state', async ({ page }) => {
  await page.goto('hermite?mode=demo&metric=h_daily_close60_ts_h4_60&ticker=000001&date=2026-07-03&private_id=secret')
  await expect(page.getByLabel('Hermite indicator')).toHaveValue('h_daily_close60_ts_h4_60')
  await expect(page.getByLabel('Ticker', { exact: true })).toHaveValue('000001')
  await expect(page.getByLabel('End date', { exact: true })).toHaveValue('2026-07-03')
  expect(new URL(page.url()).searchParams.has('private_id')).toBe(false)
})

test('quality page presents coverage provenance in both locales and on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('quality')
  await expect(page.getByRole('heading', { level: 1, name: 'Source and quality' })).toBeVisible()
  await expect(page.getByText('20210104 – 20260424')).toBeVisible()
  await expect(page.getByText('No', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /doc:quant-research\.research\.historical-risk/ })).toHaveAttribute('href', /blob\/7b7d2de3f6e714fef7003a269e429c3c97a73e05/)
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '来源与质量' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('missing optional historical asset keeps demo mode usable and supports retry', async ({ page }) => {
  let requests = 0
  await page.route('**/data/risk-history.json', async (route) => {
    requests += 1
    if (requests < 3) return route.fulfill({ status: 404 })
    return route.fulfill({ json: riskHistory })
  })
  await page.goto('jumps')
  await page.getByLabel('Data view').selectOption('historical')
  await expect(page.getByText('Historical aggregates are unavailable. Demo data remains available.')).toBeVisible()
  await page.getByRole('button', { name: 'Retry historical data' }).click()
  await expect(page.getByRole('table', { name: 'Reviewed historical aggregates' })).toBeVisible()
  await page.getByLabel('Data view').selectOption('demo')
  await expect(page.getByRole('table', { name: 'Compare observations' })).toBeVisible()
})

test('copy-link reports clipboard success and failure', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => undefined },
  }))
  await page.goto('hermite?mode=historical&metric=rv_shape_h3')
  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Link copied.' })).toBeVisible()
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('denied') } },
  }))
  await page.reload()
  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Clipboard unavailable' })).toBeVisible()
})
