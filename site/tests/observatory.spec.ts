import { expect, test } from '@playwright/test'

const chinese = /[\u4e00-\u9fff]/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('quant-factor-locale', 'en-US')
  })
})

test('English public pages do not render Chinese catalog content', async ({ page }) => {
  for (const route of ['/', '/studies', '/factors', '/fundamentals', '/jumps', '/hermite', '/alpha810']) {
    const routePage = await page.context().newPage()
    routePage.on('pageerror', (error) => console.error(`Browser error on ${route}: ${error.message}`))
    await routePage.goto(route)
    await expect(routePage.locator('main'), route).toBeVisible({ timeout: 15000 })
    expect(await routePage.locator('main').innerText(), route).not.toMatch(chinese)
    await routePage.close()
  }
})

test('English overview translates every factor group label', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'What do these market patterns tell us?' })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'Distribution shape states' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fundamental research' })).toBeVisible()
})

test('Alpha 810 schema 1.1 shows annual and uncertainty evidence', async ({ page }) => {
  await page.route('**/data/alpha810-snapshot.json', async (route) => {
    const response = await route.fetch()
    const snapshot = await response.json()
    snapshot.schema_version = '1.1'
    snapshot.factors[0].annual_slices = [{ label: '2025', valid_dates: 200, rank_ic_mean: 0.03, rank_ic_positive_rate: 0.6, group_returns: [{ group: 1, mean_return: 0, periods: 200 }, { group: 5, mean_return: 0.02, periods: 200 }] }]
    snapshot.factors[0].regime_slices = [{ label: 'bear', valid_dates: 80, rank_ic_mean: 0.01, rank_ic_positive_rate: 0.55, group_returns: [{ group: 1, mean_return: 0, periods: 80 }, { group: 5, mean_return: 0.01, periods: 80 }] }]
    snapshot.factors[0].uncertainty = { status: 'complete', method: 'newey_west_hac', holding_period_days: 1, estimate: 0.03, standard_error: 0.01, confidence_interval: [0.01, 0.05], p_value: 0.003, multiple_testing: { q_value_by: 0.04, q_value_bh: 0.02 } }
    snapshot.temporal_validation = { status: 'complete', annual_status: 'complete', market_regime: { status: 'complete' } }
    snapshot.uncertainty = { status: 'partial', method: 'newey_west_hac', holding_period_days: 1, tested_factor_count: 1, factor_count: 810 }
    snapshot.multiple_testing = { status: 'complete', method: 'benjamini_yekutieli', family_size: 810, tested_count: 810, factors: Object.fromEntries(snapshot.factors.map((factor, index) => [factor.name, { q_value_by: index === 0 ? 0.04 : null, q_value_bh: index === 0 ? 0.02 : null }])) }
    await route.fulfill({ response, json: snapshot })
  })
  await page.goto('alpha810/factors/alpha101_001')
  await expect(page.getByRole('heading', { name: 'How did the factor behave over time?' })).toBeVisible()
  await expect(page.locator('.annual-table tbody tr').nth(0)).toContainText('2025')
  await expect(page.locator('.annual-table tbody tr').nth(1)).toContainText('Regime: bear')
  await expect(page.getByText('BY adjusted q-value')).toBeVisible()
  await expect(page.getByText('0.0400')).toBeVisible()
  await expect(page.getByText('Raw p-value')).toBeVisible()
  await expect(page.getByText('0.0030')).toBeVisible()
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { name: '因子随时间的表现如何？' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'RankIC 均值' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await page.setViewportSize({ width: 360, height: 780 })
  await page.reload()
  await expect(page.locator('main')).toBeVisible()
  const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('*'))
    .filter((element) => element.scrollWidth > element.clientWidth + 1)
    .map((element) => ({ tag: element.tagName, className: (element as HTMLElement).className, client: element.clientWidth, scroll: element.scrollWidth, overflowX: getComputedStyle(element).overflowX }))
    .slice(0, 12))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), JSON.stringify(overflow)).toBe(true)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('alpha810')
  await expect(page.getByRole('heading', { name: 'How many results stand out after checking 810 factors?' })).toBeVisible()
  await expect(page.getByText('1 / 810', { exact: true })).toBeVisible()
  await expect(page.getByText('Available', { exact: true })).toBeVisible()
})

test('Published Alpha 810 snapshot shows full-period corrected evidence and caveats', async ({ page }) => {
  await page.goto('alpha810')
  await expect(page.getByRole('heading', { name: 'How many results stand out after checking 810 factors?' })).toBeVisible()
  await expect(page.getByText('781 / 810', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('806 / 810', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Available', { exact: true })).toBeVisible()
  await expect(page.getByText(/Historical input point-in-time availability/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Do results hold when nearby dates are treated as related?' })).toBeVisible()
  await expect(page.getByText('778 / 810', { exact: true })).toBeVisible()
  await expect(page.getByText('784 / 806', { exact: true })).toBeVisible()
  await page.goto('alpha810/factors/alpha101_001')
  await expect(page.getByRole('heading', { name: 'Lag sensitivity and block-bootstrap interval' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'HAC lag' })).toBeVisible()
  await expect(page.locator('.sensitivity-table tbody tr')).toHaveCount(5)
  await expect(page.getByText('20-session block bootstrap 95% CI')).toBeVisible()
})

test('language switch changes the rendered study catalog', async ({ page }) => {
  await page.goto('studies')
  await expect(page.getByRole('heading', { name: 'Research studies' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { name: '因子研究专题' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '研发投入相对估值：信号还是规模暴露？', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.getByRole('heading', { name: 'Research studies' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'R&D Investment Relative to Valuation: Signal or Size Exposure?', exact: true })).toBeVisible()
})

test('fundamental research series shows source-backed A-share and historical Hong Kong studies in both locales', async ({ page }) => {
  await page.goto('studies')
  await expect(page.getByRole('heading', { name: 'Fundamental research across factors and markets' })).toBeVisible()
  await expect(page.getByText(/23 fundamental and human-capital candidates/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Browse factor definitions/ })).toHaveAttribute('href', /fundamentals$/)
  await expect(page.getByRole('heading', { name: 'Fundamental-state forecasting: from financial predictions to cross-sectional selection' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Absolute revenue and net-income forecasts: a selection pilot' })).toBeVisible()
  await expect(page.locator('.study-card').getByText(/Using the latest reported value beat all six prediction-error comparisons/)).toBeVisible()
  await expect(page.locator('.study-card').getByText(/XGBoost net-income RankIC gains are tiny/)).toHaveCount(0)
  await page.goto('studies/absolute-level-forecast')
  await expect(page.getByRole('heading', { name: 'What the evidence says so far' })).toBeVisible()
  await expect(page.getByRole('row', { name: /XGBoost forecast yield top-decile excess/ })).toContainText('-25.0%')
  await page.goto('studies')
  await expect(page.getByRole('heading', { name: 'Hong Kong PIT fundamentals: archived monthly and quarterly studies' })).toBeVisible()
  await expect(page.locator('.study-card').getByText('Historical archive').first()).toBeVisible()
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { name: '跨因子与市场的基本面研究' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '港股基本面 PIT 研究：月频与季频历史归档' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '营收与净利润绝对值预测：截面选股试验' })).toBeVisible()
  await expect(page.locator('.study-card').getByText('港股', { exact: true }).first()).toBeVisible()
})

test('older study catalogs without series or taxonomy metadata still render', async ({ page }) => {
  await page.route('**/data/research-studies.json', async (route) => {
    const response = await route.fetch()
    const catalog = await response.json()
    delete catalog.series
    for (const study of catalog.studies) {
      delete study.series
      delete study.market
      delete study.method
      delete study.frequency
      delete study.evidence_stage
      delete study.publication_id
      delete study.source_ref
    }
    await route.fulfill({ response, json: catalog })
  })
  await page.goto('studies')
  await expect(page.getByRole('heading', { name: 'Research studies' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'PB and ROE: A Paired Test of Valuation and Profitability' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fundamental research across factors and markets' })).toHaveCount(0)
})

test('R&D study shows corrected PIT evidence and an accessible public method note', async ({ page }) => {
  await page.goto('studies/rd-investment')
  await expect(page.getByRole('heading', { name: 'What was measured' })).toBeVisible()
  await expect(page.getByText('TTM R&D expense divided by equity market capitalization', { exact: false })).toBeVisible()
  await expect(page.getByText(/77 valid 20-day and 66 valid 220-day/).first()).toBeVisible()
  await expect(page.getByRole('row').filter({hasText:'4.85%'}).first()).toContainText('4.85%')
  await expect(page.getByRole('heading', { name: 'Annual replay by year' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Separate historical extension' })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Yearly factor evidence' })).toContainText('2019')
  await expect(page.getByRole('table', { name: 'Yearly factor evidence' })).toContainText('Insufficient cross-section')
  await expect(page.getByText(/retrospective extension.*not part of the corrected current PIT run/i)).toBeVisible()
  await page.getByRole('link', { name: 'Public methodology note' }).click()
  await expect(page.getByRole('heading', { name: 'R&D investment relative to valuation' })).toBeVisible()
  await expect(page.getByText(/77 valid monthly cross-sections/)).toBeVisible()
  await expect(page.getByText(/No frozen holdout metrics have been produced/)).toBeVisible()
})

test('R&D yearly evidence is loaded only on its detail route', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/data/')) requests.push(new URL(request.url()).pathname.split('/').pop() ?? '')
  })
  await page.goto('studies/rd-investment')
  await expect(page.getByRole('heading', { name: 'R&D Investment Relative to Valuation: Signal or Size Exposure?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Annual replay by year' })).toBeVisible()
  expect(requests.sort()).toEqual(['research-studies.json', 'rd-investment-annual.json', 'rd-investment.json', 'rd-investment.json'].sort())
})

test('R&D annual evidence controls and boundary notes are localized in Chinese', async ({ page }) => {
  await page.goto('studies/rd-investment')
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { name: '逐年因子表现' })).toBeVisible()
  await expect(page.getByLabel('因子变体')).toBeVisible()
  await expect(page.getByLabel('预测窗口')).toBeVisible()
  await expect(page.getByRole('heading', { name: '独立的历史扩展' })).toBeVisible()
  await expect(page.getByRole('table', { name: '逐年因子证据' })).toContainText('回溯重建')
  await expect(page.getByText(/不属于当前修正后的 PIT 回放结果/)).toBeVisible()
})

test('R&D annual chart preserves unavailable years and the study survives an optional evidence load failure', async ({ page }) => {
  await page.goto('studies/rd-investment')
  await page.getByLabel('Forward label').selectOption('fwd220')
  await expect(page.getByRole('table', { name: 'Yearly factor evidence' }).getByRole('row', { name: /2026/ })).toContainText('Labels not mature')
  await page.route('**/data/rd-investment-annual.json', (route) => route.fulfill({ status: 503, body: 'unavailable' }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'What was measured' })).toBeVisible()
  await expect(page.getByText('Yearly evidence is temporarily unavailable.')).toBeVisible()
})

test('R&D annual evidence remains readable on a phone-sized viewport', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('studies/rd-investment')
  await expect(page.getByRole('heading', { name: 'Annual replay by year' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Annual Rank IC by formation year' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  expect(runtimeErrors).toEqual([])
})

test('R&D method note links to the fixed-cost diagnostic and states its limits', async ({ page }) => {
  await page.goto('studies/rd-investment')
  await page.getByRole('link', { name: 'Public methodology note' }).click()
  await expect(page.getByText(/25 bp one-way modeled cost/)).toBeVisible()
  await expect(page.getByText(/not the registered decile validation or a production portfolio/)).toBeVisible()
})

test('theme switch persists across reloads', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Dark mode/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: /Light mode/ })).toBeVisible()
})

test('chart routes render without React runtime errors', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  const cases = [
    { route: 'jumps', heading: 'How much movement came from sudden jumps?', chart: '.chart-panel svg.chart-svg, .chart-panel .chart-empty' },
    { route: 'hermite', heading: 'How lopsided are price movements?', chart: '.chart-panel svg.chart-svg' },
  ]
  for (const { route, heading, chart } of cases) {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.locator(chart).first()).toBeVisible()
    expect(runtimeErrors, route).toEqual([])
  }
})

test('Hermite explorer separates indicator scales and explains the demo window', async ({ page }) => {
  await page.goto('hermite')
  await expect(page.getByLabel('Hermite indicator')).toBeVisible()
  await expect(page.getByLabel('Ticker')).toBeVisible()
  await expect(page.getByText('42 daily observations')).toBeVisible()
  await page.getByLabel('Hermite indicator').selectOption('h_daily_close60_ts_h3_60')
  await expect(page.getByRole('heading', { name: /Are price changes lopsided/ })).toBeVisible()
  await expect(page.getByText(/its sign is not the same as a standardized skewness measure/i)).toBeVisible()
})

test('jump page lets readers compare additive components as shares', async ({ page }) => {
  await page.goto('jumps')
  await expect(page.getByLabel('Example observation')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Share of realized variance' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Composition of jump variance' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Share of RJV' })).toBeVisible()
  await expect(page.getByText(/Realized variance \(RV\) is a measure of total squared price movement/)).toBeVisible()
  await expect(page.getByText('RJV = RLJV + RSJV', { exact: false })).toBeVisible()
  await expect(page.getByText('Decomposition check passed')).toBeVisible()
})

test('jump decomposition flow stacks legibly on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('jumps')
  await expect(page.locator('.jump-flow')).toHaveCSS('display', 'grid')
  const columns = await page.locator('.jump-flow').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
  expect(columns).toBe(1)
})

test('fundamentals explorer selects published series and shows cross-sectional quantiles', async ({ page }) => {
  await page.goto('fundamentals')
  await expect(page.getByLabel('Series metric')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How do operating-profit values differ across stocks?' })).toBeVisible()
  await expect(page.getByText('p01', { exact: true })).toBeVisible()
  await expect(page.getByText(/public time-series examples are available for only three representative tickers/)).toBeVisible()
  await page.getByLabel('Series metric').selectOption('roe')
  await expect(page.getByRole('heading', { name: 'Return on equity (ROE)' })).toBeVisible()
})

test('fundamentals catalog groups are keyboard-accessible disclosures on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('fundamentals')
  const group = page.locator('.catalog-grid details').first()
  await expect(group).toBeVisible()
  await expect(group).not.toHaveAttribute('open', '')
  const summary = group.locator('summary')
  await expect(summary).toBeVisible()
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(group).toHaveAttribute('open', '')
  await expect(group.locator('.catalog-row').first()).toBeVisible()
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }))
  expect(widths.content).toBeLessThanOrEqual(widths.viewport)
})

test('fundamentals route defers native SVG chart code until a chart section approaches view', async ({ page }) => {
  const chartRequests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'script') chartRequests.push(new URL(request.url()).pathname)
  })
  await page.goto('fundamentals')
  await expect(page.getByRole('heading', { name: 'What companies reported, and when it became public' })).toBeVisible()
  const beforeChart = new Set(chartRequests)
  await page.locator('.quantile-panel').scrollIntoViewIfNeeded()
  await expect(page.locator('.quantile-panel svg.chart-svg')).toBeVisible()
  await expect.poll(() => chartRequests.some((request) => !beforeChart.has(request))).toBe(true)
})

test('exploration pages localize new controls and evidence notes into Chinese', async ({ page }) => {
  await page.goto('hermite')
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { name: '价格涨跌分布是否偏向一边？' })).toBeVisible()
  await expect(page.getByLabel('Hermite 指标')).toBeVisible()

  await page.goto('jumps')
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByRole('heading', { name: '总波动中有多少来自突然跳动？' })).toBeVisible()
  await expect(page.getByText('分解恒等式核对通过')).toBeVisible()

  await page.goto('fundamentals')
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByLabel('序列指标')).toBeVisible()
  await expect(page.getByRole('heading', { name: '不同股票的营业利润数据有什么差异？' })).toBeVisible()

  await page.goto('studies/rd-investment')
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(page.getByText(/77 个有效 20 日月度截面和 66 个有效 220 日月度截面/)).toBeVisible()
  await expect(page.locator('.study-columns')).toContainText('12.70%')
  await expect(page.getByText(/2026-10 至 2027-09 的前瞻最终 OOS 协议已封存，但性能读取仍被门槛阻止/)).toBeVisible()
  await expect(page.getByText(/历史指数与行业生效时点也没有完全按点时核实/).first()).toBeVisible()
})

test('deferred native charts do not blank the page on a mobile viewport', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'What do these market patterns tell us?' })).toBeVisible()
  await page.getByRole('heading', { name: 'Factor map' }).scrollIntoViewIfNeeded()
  await expect(page.locator('svg.chart-svg').first()).toBeVisible()
  expect(runtimeErrors).toEqual([])
  await expect(page.locator('main')).toBeVisible()
})

test('routes request only the public data snapshots they need', async ({ page }) => {
  const dataResponses: Array<{ name: string; body?: Promise<Buffer> }> = []
  let captureBodies = true
  let echartsRequested = false
  page.on('response', (response) => {
    const url = new URL(response.url())
    const match = url.pathname.match(/\/data\/([^/]+\.json)$/)
    if (match) dataResponses.push({ name: match[1], body: captureBodies ? response.body() : undefined })
  })
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('echarts-')) echartsRequested = true
  })

  await page.goto('/')
  await expect.poll(() => dataResponses.length).toBe(4)
  await expect(page.getByRole('heading', { name: 'What the published evidence says' })).toBeVisible()
  const homeNames = dataResponses.map((response) => response.name)
  expect(homeNames).toEqual(expect.arrayContaining([
    'factor-snapshot.json',
    'fundamental-factor-catalog.json',
    'fundamental-snapshot.json',
    'research-studies.json',
  ]))
  expect(homeNames).not.toContain('alpha810-snapshot.json')
  expect(homeNames).not.toContain('rd-investment-annual.json')
  await expect(page.locator('.home-finding-card').first()).toContainText('What remains uncertain')
  const homeBytes = (await Promise.all(dataResponses.map((response) => response.body).filter((body): body is Promise<Buffer> => body !== undefined))).reduce((total, body) => total + body.byteLength, 0)
  console.info(`Observed overview JSON response bodies: ${homeBytes} bytes`)

  captureBodies = false
  dataResponses.length = 0
  await page.goto('alpha810')
  await expect(page.getByRole('heading', { name: /Alpha 810: what do the historical checks show\?/ })).toBeVisible()
  const alphaNames = dataResponses.map((response) => response.name)
  expect(alphaNames).toEqual(['alpha810-snapshot.json'])
  expect(echartsRequested).toBe(false)
  await page.getByRole('heading', { name: 'Coverage by factor' }).scrollIntoViewIfNeeded()
  await expect(page.locator('.research-chart svg.chart-svg').first()).toBeVisible()
  expect(echartsRequested).toBe(false)

  dataResponses.length = 0
  await page.goto('studies')
  await expect(page.getByRole('heading', { name: 'Research studies' })).toBeVisible()
  expect(dataResponses.map((response) => response.name)).toEqual(['research-studies.json'])

  dataResponses.length = 0
  await page.goto('studies/rd-investment')
  await expect(page.getByRole('heading', { name: 'R&D Investment Relative to Valuation: Signal or Size Exposure?' })).toBeVisible()
  await expect.poll(() => dataResponses.map((response) => response.name).sort()).toEqual(['research-studies.json', 'rd-investment-annual.json'].sort())
})

 test('research conclusions precede evidence and methods', async ({ page }) => {
  await page.goto('/studies/rd-investment')
  await expect(page.locator('.study-columns')).toBeVisible()
  expect(await page.locator('main').evaluate(el => {
    const sections = [...el.querySelectorAll('section')]
    return sections.indexOf(el.querySelector('.study-columns section')!) < sections.findIndex(s => s.querySelector('table'))
  })).toBe(true)
  for (const route of ['/hermite', '/jumps', '/fundamentals']) {
    await page.goto(route)
    await expect(page.locator('.research-verdict')).toBeVisible()
    expect(await page.locator('main').evaluate(el => {
      const verdict = el.querySelector('.research-verdict')!
      const chart = el.querySelector('.chart-panel, .availability-panel')!
      return Boolean(verdict.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
  }
})

test('all fundamental studies show source-backed exploration and optional charts', async ({ page }) => {
  const ids = ['pb-roe', 'rd-investment', 'fundamental-state-forecasting', 'fundamental-family-shadow', 'cashflow-indices', 'hk-fundamental-archive', 'employee-compensation', 'absolute-level-forecast']
  for (const id of ids) {
    await page.goto(`/studies/${id}`)
    await expect(page.getByRole('heading', { name: 'How the evidence developed' })).toBeVisible()
    await expect(page.locator('.study-exploration-steps > li')).toHaveCount(id === 'rd-investment' ? 8 : id === 'employee-compensation' ? 4 : 3)
    if (id === 'employee-compensation') {
      await expect(page.locator('.study-evidence-summary')).toContainText('Source matches recorded baseline')
    }
    if (id === 'rd-investment') {
      await page.getByLabel('Comparison to view').selectOption('replay-closure')
      await expect(page.locator('.study-chart-context')).toContainText('89 formations')
      await page.locator('.study-exploration').getByText('Show exact aggregate values', { exact: true }).click()
      await expect(page.locator('.study-values')).toContainText('59')
    }
    if (['employee-compensation', 'fundamental-family-shadow'].includes(id)) {
      await expect(page.locator('.study-exploration .study-exploration-svg')).toHaveCount(0)
      await expect(page.getByText('No reviewed performance values', { exact: false })).toBeVisible()
    } else {
      await expect(page.locator('.study-exploration .study-exploration-svg')).toBeVisible()
    }
  }
})

test('study chart controls and exact values are localized with negative observations preserved', async ({ page }) => {
  await page.goto('/studies/absolute-level-forecast')
  await page.getByLabel('Comparison to view').selectOption('selection')
  await page.locator('.study-exploration').getByText('Show exact aggregate values', { exact: true }).click()
  await expect(page.locator('.study-values')).toContainText('-7.4%')
  await page.getByRole('button', { name: '中文' }).click()
  await expect(page.getByRole('heading', { name: '探索过程与中间结论' })).toBeVisible()
  await expect(page.getByLabel('选择对照')).toHaveValue('selection')
  await expect(page.locator('.study-values')).toContainText('-7.4%')
  await expect(page.locator('.study-chart-context')).toContainText('无交易成本')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.study-exploration .study-exploration-svg')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
})

test('exploration assets load only on the matching study route and failure supports retry', async ({ page }) => {
  const assets: string[] = []
  page.on('request', (request) => { if (request.url().includes('/study-exploration/')) assets.push(request.url()) })
  await page.goto('/studies')
  await expect(page.getByRole('heading', { name: 'Research studies', exact: true })).toBeVisible()
  expect(assets).toHaveLength(0)
  let fail = true
  await page.route('**/study-exploration/pb-roe.json', (route) => fail ? route.abort() : route.continue())
  await page.goto('/studies/pb-roe')
  await expect(page.getByText('Additional exploration evidence is unavailable.', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What the evidence says so far' })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'How the evidence developed' })).toBeVisible()
  expect(assets.every((url) => url.endsWith('/pb-roe.json'))).toBeTruthy()
})

test('invalid exploration identity fails safely without changing published conclusions', async ({ page }) => {
  await page.route('**/study-exploration/employee-compensation.json', (route) => route.fulfill({ json: { schema_version: 'observatory.study_exploration.v1', study_id: 'wrong-study' } }))
  await page.goto('/studies/employee-compensation')
  await expect(page.getByText('Additional exploration evidence is unavailable.', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What the evidence says so far' })).toBeVisible()
  await expect(page.locator('.study-exploration .study-exploration-svg')).toHaveCount(0)
})

test('R&D follow-up shows failure rates and conditional coverage in both locales', async ({ page }) => {
  await page.goto('/studies/rd-investment')
  await page.getByLabel('Comparison to view').selectOption('endpoint-failures')
  await expect(page.locator('.study-chart-context')).toContainText('not actual fills')
  await page.locator('.study-exploration').getByText('Show exact aggregate values', { exact: true }).click()
  await expect(page.locator('.study-values')).toContainText('2019')
  await page.getByLabel('Comparison to view').selectOption('input-coverage')
  await expect(page.locator('.study-chart-context')).toContainText('already filtered panel')
  await page.getByRole('button', { name: 'Switch to 中文', exact: true }).click()
  await expect(page.locator('.study-chart-context')).toContainText('已筛选面板')
  await expect(page.locator('.study-exploration-steps')).toContainText('10,825')
  await page.getByLabel('选择对照').selectOption('matched-components')
  await expect(page.locator('.study-chart-context')).toContainText('独立的历史扩展')
})

test('study chart annotations retain readable contrast in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('quant-factor-theme', 'dark'))
  await page.goto('/studies/rd-investment')
  await page.getByLabel('Comparison to view').selectOption('input-coverage')
  const contrasts = await page.evaluate(() => {
    const luminance = (color: string) => {
      const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => v / 255)
      return rgb.map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
    }
    return ['.study-chart-label', '.study-chart-legend', '.study-chart-context'].map((selector) => {
      const element = document.querySelector(selector)!
      const style = getComputedStyle(element)
      const foreground = luminance(selector === '.study-chart-label' ? style.fill : style.color)
      const background = luminance(getComputedStyle(selector === '.study-chart-context' ? element : element.closest('.panel')!).backgroundColor)
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)
    })
  })
  for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5)
})

test('research hub filters evidence and preserves conclusion changes', async ({ page }) => {
 await page.goto('/studies/evidence')
 const hub = page.locator('.research-evidence-hub')
 await expect(hub.getByRole('heading', { name: 'Research evidence matrix' })).toBeVisible()
 await expect(hub.locator('tbody tr')).toHaveCount(8)
 await hub.getByLabel('Market', { exact: true }).selectOption('hong_kong')
 await expect(hub.locator('tbody tr')).toHaveCount(1)
 await hub.getByLabel('Market', { exact: true }).selectOption('')
 await hub.getByLabel('Search studies').fill('PB')
 await expect(hub.locator('tbody tr')).toHaveCount(1)
 await page.goto('/studies/fundamental-state-forecasting')
 await expect(page.locator('.study-conclusion-changes')).toContainText('Earlier interpretation')
 await expect(page.getByRole('heading', { name: 'Related research' })).toBeVisible()
})

test('registered comparisons isolate horizons and show baseline differences', async ({ page }) => {
 await page.goto('/studies/compare')
 const chooser = page.getByLabel('Choose a comparison', { exact: true })
 await expect(chooser).toBeVisible()
 await expect(page.locator('tbody tr')).toHaveCount(5)
 await expect(page.locator('tbody tr').first()).toContainText('0%')
 await chooser.selectOption('rd-20')
 await expect(page.locator('.study-chart-legend')).toContainText('20')
 await expect(page.locator('.study-chart-legend')).not.toContainText('220')
 await chooser.selectOption('absolute-income-error')
 await expect(page.getByLabel('Sample / horizon')).toBeVisible()
 await expect(page.locator('tbody tr')).toHaveCount(3)
 await page.getByLabel('Sample / horizon').selectOption('2')
 await expect(page.locator('tbody tr').first()).toContainText('0.451')
 await page.setViewportSize({ width: 390, height: 844 })
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
})

test('comparison asset failure permits retry without fabricating values', async ({ page }) => {
 let fail = true
 await page.route('**/data/study-exploration/pb-roe.json', async route => { if (fail) await route.fulfill({ status: 503, body: '{}' }); else await route.continue() })
 await page.goto('/studies/compare')
 await expect(page.getByText('Comparison evidence could not be loaded.', { exact: true })).toBeVisible()
 await expect(page.locator('tbody tr')).toHaveCount(0)
 fail = false
 await page.getByRole('button', { name: 'Retry', exact: true }).click()
 await expect(page.locator('tbody tr')).toHaveCount(5)
})

test('research hub and comparison controls localize on mobile', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 })
 await page.goto('/studies/evidence')
 await page.getByRole('button', { name: 'Switch to 中文' }).click()
 await expect(page.getByRole('heading', { name: '研究证据总览' })).toBeVisible()
 await page.getByLabel('证据阶段').selectOption('hypothesis')
 await expect(page.locator('.research-evidence-hub tbody tr')).toHaveCount(1)
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
 await page.goto('/studies/compare')
 await page.getByRole('button', { name: 'Switch to 中文' }).click()
 await expect(page.getByLabel('选择对照', { exact: true })).toBeVisible()
 await expect(page.locator('main')).not.toContainText('Comparison boundary')
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
})

test('study navigation shows trust, honest provenance and isolated paired diagnostics', async ({ page }) => {
 await page.goto('/studies/absolute-level-forecast')
 await expect(page.getByRole('heading',{name:'Data trust card'})).toBeVisible()
 await expect(page.locator('.study-trust-card tbody tr')).toHaveCount(6)
 await expect(page.locator('.study-reproduction')).toContainText('Not recorded; do not infer')
 await expect(page.locator('.study-paired-diagnostics tbody tr')).toHaveCount(6)
 await page.getByLabel('Separate horizon / target').selectOption('net_profit')
 await expect(page.locator('.study-paired-diagnostics tbody tr')).toHaveCount(6)
 await expect(page.getByRole('heading',{name:'Forecast-decile calibration'})).toBeVisible()
 await page.getByLabel('Forecast target').selectOption('net_profit')
 await page.getByLabel('Formation year').selectOption('2025')
 await expect(page.locator('.forecast-calibration')).toContainText('Missing current revenue')
 await expect(page.getByRole('heading',{name:'Research decision queue'})).toBeVisible()
})

test('alternative research views distinguish negative tests from missing experiments', async ({ page }) => {
 await page.goto('/studies/evidence')
 await page.getByLabel('Browse research').selectOption('experiment')
 await expect(page.locator('.research-evidence-hub tbody tr')).toHaveCount(8)
 await expect(page.locator('.research-evidence-hub')).toContainText('20261002-final-v4')
 await page.getByLabel('Browse research').selectOption('decision')
 await page.getByLabel('Show negative or inconclusive tests').check()
 await expect(page.locator('.research-evidence-hub tbody tr')).toHaveCount(5)
 await expect(page.locator('.research-evidence-hub tbody')).not.toContainText('labor-cost-definition')
})

test('navigation failures preserve findings and retry on mobile in Chinese', async ({ page }) => {
 let invalid=true
 await page.route('**/data/study-navigation/rd-investment.json',async route=>{const response=await route.fetch();const data=await response.json();if(invalid)data.study_id='wrong';await route.fulfill({response,json:data})})
 await page.setViewportSize({width:390,height:844});await page.goto('/studies/rd-investment')
 await expect(page.getByText('Trust and reproduction evidence could not be loaded.')).toBeVisible()
 await expect(page.getByRole('heading',{name:'What the evidence says so far'})).toBeVisible()
 invalid=false;await page.getByRole('button',{name:'Retry',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Data trust card'})).toBeVisible()
 await page.getByRole('button',{name:'Switch to 中文'}).click()
 await expect(page.getByRole('heading',{name:'数据可信度卡片'})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy()
})

test('study index stays concise while each topic retains its evidence', async ({ page }) => {
  await page.route('**/data/research-studies.json', async route => {
    const response = await route.fetch()
    const catalog = await response.json()
    const study = catalog.studies.find((entry: { id: string }) => entry.id === 'employee-compensation')
    study.source_review_status.status = 'needs_review'
    await route.fulfill({ response, json: catalog })
  })
  await page.goto('/studies')
  await expect(page.locator('.study-card')).toHaveCount(8)
  await expect(page.locator('.research-evidence-hub')).toHaveCount(0)
  await expect(page.locator('.study-card[href$="employee-compensation"]')).toContainText('Source changed; review required')
  await page.getByLabel('Search studies').fill('beat all six')
  await expect(page.locator('.study-card')).toHaveCount(1)
  await page.getByLabel('Search studies').fill('')
  await page.getByLabel('Market', { exact: true }).selectOption('hong_kong')
  await expect(page.locator('.study-card')).toHaveCount(1)
  await page.getByLabel('Market', { exact: true }).selectOption('')
  await page.getByLabel('Search studies').fill('R&D')
  await expect(page.locator('.study-card')).toHaveCount(1)
  await page.getByRole('link', { name: 'Compare past experiments', exact: true }).click()
  await expect(page).toHaveURL(/studies\/evidence$/)
  await expect(page.locator('.research-evidence-hub tbody tr')).toHaveCount(8)
  await page.goto('/studies/rd-investment')
  await expect(page.locator('.study-evidence-summary')).toContainText('Baseline')
  await expect(page.locator('.study-source-record')).not.toHaveAttribute('open')
  await page.locator('.study-source-record summary').click()
  await expect(page.locator('.study-source-record')).toContainText('Asia/Shanghai')
  await expect(page.locator('.study-conclusion-changes')).toContainText('Earlier interpretation')
})


test('topic navigation and source details remain readable in Chinese on mobile', async ({ page }) => {
  await page.route('**/data/research-studies.json', async route => {
    const response = await route.fetch()
    const catalog = await response.json()
    const study = catalog.studies.find((entry: { id: string }) => entry.id === 'employee-compensation')
    study.source_review_status.status = 'needs_review'
    await route.fulfill({ response, json: catalog })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/studies')
  await page.getByRole('button', { name: 'Switch to 中文', exact: true }).click()
  await expect(page.locator('.study-card')).toHaveCount(8)
  await expect(page.locator('.research-evidence-hub')).toHaveCount(0)
  await page.getByLabel('证据阶段', { exact: true }).selectOption('hypothesis')
  await expect(page.locator('.study-card')).toHaveCount(1)
  await expect(page.getByLabel('市场', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.goto('/studies/employee-compensation')
  await page.getByRole('button', { name: 'Switch to 中文', exact: true }).click()
  await expect(page.locator('.study-evidence-summary')).toContainText('来源已变化，待复核')
  await page.locator('.study-source-record summary').click()
  await expect(page.locator('.study-source-record')).toContainText('北京时间')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})
