import { expect, test } from '@playwright/test'
import { alignSeries, summarize, jumpStatus, ratio } from '../src/shapeExploration'
import { readFileSync } from 'node:fs'
const snapshot = JSON.parse(readFileSync(new URL('../public/data/factor-snapshot.json', import.meta.url), 'utf8'))

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
