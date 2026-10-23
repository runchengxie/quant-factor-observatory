import { test, expect } from '@playwright/test'
test('research home works without demonstration snapshots and keeps evidence scope', async ({ page }) => {
  const requests: string[] = []
  page.on('request', r => { if (r.url().includes('/data/')) requests.push(r.url()) })
  await page.route('**/data/factor-snapshot.json', r => r.abort())
  await page.route('**/data/fundamental-snapshot.json', r => r.abort())
  await page.goto('/')
  await expect(page.locator('.home-finding-card')).toHaveCount(3)
  for (const card of await page.locator('.home-finding-card').all()) {
    await expect(card.locator('.home-study-sample')).not.toBeEmpty()
    await expect(card.locator('.home-finding-limit')).not.toBeEmpty()
  }
  expect(requests.every(url => url.endsWith('/research-studies.json'))).toBe(true)
  await expect(page.locator('.hero')).not.toContainText('DEMO')
  await expect(page.locator('.site-footer')).not.toContainText('Demo')
})
test('home preserves source review warnings alongside findings', async ({ page }) => {
  await page.route('**/data/research-studies.json', async route => {
    const response = await route.fetch()
    const catalog = await response.json()
    for (const study of catalog.studies) study.source_review_status = { ...study.source_review_status, status: 'needs_review' }
    await route.fulfill({ response, json: catalog })
  })
  await page.goto('/')
  await expect(page.locator('.home-finding-card .source-review-warning')).toHaveCount(3)
})

for (const locale of ['en-US', 'zh-CN']) {
  test('home layout and links remain usable in ' + locale, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('quant-factor-locale', value), locale)
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')
    await expect(page.locator('.home-finding-card')).toHaveCount(3)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.locator('.theme-toggle').click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.locator('.home-finding-card h3 a').first().click()
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page).toHaveURL(/studies\//)
  })
}
