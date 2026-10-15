import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.context().route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.context().route('https://fonts.gstatic.com/**', route => route.fulfill({ body: '' }))
})

for (const locale of ['en-US', 'zh-CN']) {
  test(`selection pilot explains overlap and pending future outcomes in ${locale}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('quant-factor-locale', value), locale)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/studies/fundamental-state-forecasting')
    const panel = page.locator('#forecast-selection-pilot')
    await expect(panel).toBeVisible({ timeout: 3000 })
    await expect(panel.getByRole('img')).toHaveCount(2)
    await expect(panel.locator('.selection-slot')).toHaveCount(40)
    await expect(panel.locator('.selection-slot.changed')).toHaveCount(2)
    await expect(panel).toContainText('19 / 20')
    await expect(panel).toContainText('5,193')
    await expect(panel).toContainText('5,201')
    await expect(panel).toContainText(locale === 'zh-CN' ? '待入场' : 'Pending entry')
    await expect(panel).toContainText(locale === 'zh-CN' ? '第三季已经结束' : 'after that quarter has ended')
    await expect(panel).toContainText(locale === 'zh-CN' ? '尚未计算策略收益' : 'No strategy returns calculated')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
