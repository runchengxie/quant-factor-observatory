import { test, expect } from '@playwright/test'
test('cashflow has moved out of the observatory without a retained page or redirect', async ({ page }) => {
  await page.goto('/studies')
  await expect(page.locator('.study-card')).toHaveCount(7)
  await expect(page.locator('a[href$="/studies/cashflow-indices"]')).toHaveCount(0)
  await page.goto('/studies/cashflow-indices')
  await expect(page.locator('main h1')).toHaveText('Study not found')
  await expect(page).toHaveURL(/studies\/cashflow-indices$/)
})
