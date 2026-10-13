import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.context().route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.addInitScript(() => { if (!localStorage.getItem('quant-factor-locale')) localStorage.setItem('quant-factor-locale', 'en-US') })
})

test('forecast guide explains matched gains, keeps forecasts separate from returns and switches locale', async ({ page }) => {
  await page.goto('/studies/fundamental-state-forecasting')
  const guide = page.locator('.forecast-guide')
  await expect(guide.getByRole('heading', { name: 'What the forecasts add' })).toBeVisible()
  await expect(guide.getByRole('table', { name: 'Gain over the latest reported value' })).toBeVisible()
  await expect(guide.locator('[data-cell="roa-1-pairwise"]')).toHaveText('-0.021')
  await expect(guide).toContainText('Retained-output recomputation')
  await expect(guide).toContainText('Return comparison is not qualified')
  await guide.getByLabel('Financial target').selectOption('cash_conversion')
  await expect(guide.getByRole('img', { name: 'Annual gain over the simple forecast' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(guide.getByRole('heading', { name: '这些预测多告诉了我们什么' })).toBeVisible()
  await expect(guide.locator('[data-cell="roa-1-pairwise"]')).toHaveText('-0.021')
  await expect(guide).toContainText('经营现金流占营收的比例')
  await page.reload()
  await expect(guide.getByRole('heading', { name: '这些预测多告诉了我们什么' })).toBeVisible()
})

test('mobile forecast guide contains scrollable comparisons without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/studies/fundamental-state-forecasting')
  await expect(page.locator('.forecast-guide')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.locator('.forecast-guide .table-scroll').first()).toBeVisible()
})

test('malformed guide preserves the study and offers a retry', async ({ page }) => {
  await page.route('**/data/study-exploration/fundamental-state-forecasting.json', async route => {
    const response = await route.fetch()
    const data = await response.json()
    data.guide = { schema_version: 'invalid' }
    await route.fulfill({ json: data })
  })
  await page.goto('/studies/fundamental-state-forecasting')
  await expect(page.locator('h1')).toContainText('Fundamental-state forecasting')
  await expect(page.getByRole('button', { name: 'Retry' }).last()).toBeVisible()
})

for (const defect of ['duplicate widths', 'invalid annual range', 'duplicate change models']) {
  test(`invalid ${defect} shows a retry instead of crashing`, async ({ page }) => {
    await page.route('**/data/study-exploration/fundamental-state-forecasting.json', async route => {
      const data = await (await route.fetch()).json()
      if (defect === 'duplicate widths') data.guide.returns = data.guide.returns.map(() => data.guide.returns[0])
      if (defect === 'invalid annual range') {
        data.guide.groups[0].models[3].annual[0].year = 0
        data.guide.groups[0].models[3].annual.at(-1).year = 1e12
      }
      if (defect === 'duplicate change models') data.guide.change_groups[0].models = data.guide.change_groups[0].models.map(() => data.guide.change_groups[0].models[0])
      await route.fulfill({ json: data })
    })
    await page.goto('/studies/fundamental-state-forecasting')
    await expect(page.getByRole('button', { name: 'Retry' }).last()).toBeVisible()
    await expect(page.locator('h1')).toContainText('Fundamental-state forecasting')
  })
}
