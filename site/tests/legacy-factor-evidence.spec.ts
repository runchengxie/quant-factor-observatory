import { test, expect } from '@playwright/test'

test('individual factor retains methods-only transfer boundary in both languages', async ({ page }) => {
  await page.goto('/factors/illiquidity')
  const evidence = page.getByTestId('legacy-factor-evidence')
  await expect(evidence).toContainText('Methods only')
  await expect(evidence).toContainText('not interchangeable')
  await expect(evidence.getByRole('link')).toHaveAttribute('href', /research\/etf-rotation\/$/)
  await page.getByRole('button', { name: /中文|Chinese/ }).click()
  await expect(evidence).toContainText('仅方法参考')
  await expect(evidence).toContainText('不能与策略输入直接替换')
})
