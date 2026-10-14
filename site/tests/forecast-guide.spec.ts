import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.context().route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.addInitScript(() => { if (!localStorage.getItem('quant-factor-locale')) localStorage.setItem('quant-factor-locale', 'en-US') })
})

test('forecast guide explains matched gains, keeps forecasts separate from returns and switches locale', async ({ page }) => {
  await page.goto('/studies/fundamental-state-forecasting')
  const guide = page.locator('.forecast-guide')
  await expect(guide.getByRole('heading', { name: 'Can today’s financial reports help us predict the next ones?' })).toBeVisible()
  await expect(guide.getByRole('link', { name: 'Read the new seasonal comparison and financial-data candidates' })).toHaveAttribute('href', /financial-candidates-20261014.en-US.md$/)
  await expect(guide.getByRole('table', { name: 'Gain over the latest reported value' })).toBeVisible()
  await expect(guide).toContainText('Saved ROA and margin tests cover Q2/Q3/Q4')
  await expect(guide).toContainText('Growth and cash tests cover Q1/Q2/Q4')
  await expect(guide.locator('[data-reader-target="roa"]')).toContainText('0.840')
  await expect(guide.locator('[data-reader-target="roa"]')).toContainText('0.819')
  await expect(guide.locator('.forecast-question-title')).toHaveText(['1. Does the model beat carrying the current report forward?', '2. Is that advantage consistent?', '3. Can it flag a financial decline ahead of time?', '4. Can these forecasts improve stock returns?'])
  await expect(guide.getByRole('img', { name: 'Period-end wealth from initial capital 1' })).toBeVisible()
  await expect(guide.locator('.forecast-heatmap tbody tr')).toHaveCount(12)
  await expect(guide.getByRole('table', { name: 'Gain over the latest reported value' })).toBeVisible()
  await expect(guide.locator('[data-cell="roa-1-pairwise"]')).toHaveText('-0.021')
  await guide.locator('.forecast-intro > summary').click()
  await expect(guide).toContainText('Retained-output recomputation')
  await expect(guide).toContainText('Return comparison is not qualified')
  await guide.getByLabel('Financial target').selectOption('cash_conversion')
  await expect(guide.getByRole('img', { name: 'Annual gain over the simple forecast' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(guide.getByRole('link', { name: '查看这轮比较，以及净利润、现金流和股息的研究进展' })).toHaveAttribute('href', /financial-candidates-20261014.zh-CN.md$/)
  await expect(guide.getByRole('heading', { name: '1. 模型比沿用这期财报强多少' })).toBeVisible()
  await expect(guide.locator('[data-cell="roa-1-pairwise"]')).toHaveText('-0.021')
  await expect(guide).toContainText('经营现金流占营收的比例')
  await page.reload()
  await expect(guide.getByRole('heading', { name: '用今天的财报，能猜到公司下一份财报怎么样吗' })).toBeVisible()
})

test('mobile forecast guide contains scrollable comparisons without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/studies/fundamental-state-forecasting')
  await expect(page.locator('.forecast-guide')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.locator('#forecast-consistency')).toContainText('22 / 41')
  await expect(page.getByRole('table', { name: 'Gain over the latest reported value', exact: true })).toBeVisible()
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

for (const defect of ['duplicate widths', 'invalid annual range', 'duplicate change models', 'oversized formation count', 'inconsistent annual count']) {
  test(`invalid ${defect} shows a retry instead of crashing`, async ({ page }) => {
    await page.route('**/data/study-exploration/fundamental-state-forecasting.json', async route => {
      const data = await (await route.fetch()).json()
      if (defect === 'duplicate widths') data.guide.returns = data.guide.returns.map(() => data.guide.returns[0])
      if (defect === 'invalid annual range') {
        data.guide.groups[0].models[3].annual[0].year = 0
        data.guide.groups[0].models[3].annual.at(-1).year = 1e12
      }
      if (defect === 'oversized formation count') data.guide.groups[0].models[0].paired_formations = 1e11
      if (defect === 'inconsistent annual count') data.guide.groups[0].models[0].annual[0].formations += 1
      if (defect === 'duplicate change models') data.guide.change_groups[0].models = data.guide.change_groups[0].models.map(() => data.guide.change_groups[0].models[0])
      await route.fulfill({ json: data })
    })
    await page.goto('/studies/fundamental-state-forecasting')
    await expect(page.getByRole('button', { name: 'Retry' }).last()).toBeVisible()
    await expect(page.locator('h1')).toContainText('Fundamental-state forecasting')
  })
}


test('unavailable win fraction remains unavailable and all details remain readable on mobile', async ({ page }) => {
  await page.route('**/data/study-exploration/fundamental-state-forecasting.json', async route => {
    const data = await (await route.fetch()).json()
    data.guide.groups.find((g: { target: string; horizon: number }) => g.target === 'cash_conversion' && g.horizon === 1).models.find((m: { id: string }) => m.id === 'pairwise').win_fraction = null
    await route.fulfill({ json: data })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/studies/fundamental-state-forecasting')
  await expect(page.locator('.forecast-reader-periods')).toHaveCount(0)
  await expect(page.locator('#forecast-consistency')).toContainText('The share of winning periods is unavailable')
  await page.getByText('Research history and sources', { exact: true }).click()
  await page.getByText('Study records, evidence limits and related research', { exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Data trust card' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})


test('new decline view shows false alarms, misses and prevalence and retains every treatment', async ({ page }) => {
  await page.goto('/studies/fundamental-state-forecasting')
  const panel = page.locator('.forecast-guide')
  await expect(panel.getByRole('heading', { name: 'When the model flags a decline, what actually happens?' })).toBeVisible()
  await expect(panel.locator('.forecast-confusion article')).toHaveCount(4)
  await expect(panel).toContainText('Share of rows with this actual decline')
  await panel.getByLabel('Choose a financial measure').selectOption('reported_roa')
  await expect(panel).toContainText('prior-year comparable fiscal quarter')
  await panel.getByLabel('How far ahead').selectOption('4')
  await panel.getByLabel('Count a decline of at least').selectOption('2')
  await panel.getByText('All methods, extreme-value sensitivities and decline counts', { exact: true }).click()
  await expect(panel.locator('.forecast-full-details > details')).toHaveCount(18)
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(panel.getByRole('heading', { name: '模型提醒要下降，后来真的下降了吗' })).toBeVisible()
  await expect(panel).toContainText('买入日缺少行情')
})

for (const defect of ['inconsistent decline counts', 'duplicate robustness groups', 'negative forecast error']) {
  test(`invalid ${defect} preserves the study and offers retry`, async ({ page }) => {
    await page.route('**/data/study-exploration/fundamental-state-forecasting.json', async route => {
      const data = await (await route.fetch()).json()
      if (defect === 'inconsistent decline counts') data.guide.robustness.groups[0].models[0].thresholds[0].false_positive += 1
      if (defect === 'duplicate robustness groups') data.guide.robustness.groups[0] = data.guide.robustness.groups[1]
      if (defect === 'negative forecast error') data.guide.robustness.groups[0].models[0].raw_mae = -1
      await route.fulfill({ json: data })
    })
    await page.goto('/studies/fundamental-state-forecasting')
    await expect(page.getByRole('button', { name: 'Retry' }).last()).toBeVisible()
    await expect(page.locator('h1')).toContainText('Fundamental-state forecasting')
  })
}

for (const locale of ['en-US', 'zh-CN']) {
  test(`one reading flow retains rich charts and controls in ${locale}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('quant-factor-locale', value), locale)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/studies/fundamental-state-forecasting')
    const guide = page.locator('.forecast-guide')
    await expect(guide.locator('.forecast-question')).toHaveCount(4)
    await expect(guide.locator('.forecast-plot')).toHaveCount(5)
    for (const plot of await guide.locator('.forecast-plot').all()) await expect(plot).toBeVisible()
    await expect(guide.locator('.study-exploration-svg')).toBeVisible()
    await expect(guide.locator('.forecast-heatmap tbody tr')).toHaveCount(12)
    await expect(guide.locator('.forecast-cash-quarters article')).toHaveCount(4)
    await expect(guide.locator('.forecast-confusion article')).toHaveCount(4)
    await guide.locator('#forecast-stability select').nth(0).selectOption('cash_conversion')
    await guide.locator('#forecast-stability select').nth(1).selectOption('4')
    await expect(guide.locator('#forecast-order select').last()).toHaveValue('roa')
    await expect(guide.locator('#forecast-stability')).toContainText('2012-09-30')
    const portfolio = guide.locator('#forecast-return select')
    await expect(portfolio.locator('option')).toHaveCount(5)
    await portfolio.selectOption('10')
    await expect(portfolio).toHaveValue('10')
    await expect(guide.locator('#forecast-return .forecast-plot')).toHaveCount(2)
    await guide.locator('.forecast-full-details > summary').click()
    await expect(guide.locator('.forecast-full-details > details')).toHaveCount(18)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
