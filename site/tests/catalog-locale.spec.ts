import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.context().route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
  await page.addInitScript(() => localStorage.setItem('quant-factor-locale', 'en-US'))
})

test('family selection retains factor identities and query across language switches', async ({ page }) => {
  await page.goto('/factors')
  await page.getByRole('combobox', { name: /^Family/ }).selectOption({ label: 'Microstructure' })
  const links = page.locator('.factor-table tbody tr td:first-child a')
  await expect(links.first()).toBeVisible()
  const identities = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')).sort())
  const query = new URL(page.url()).search
  await page.getByRole('button', { name: 'Switch to 中文' }).click()
  await expect(links).toHaveCount(identities.length)
  expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')).sort())).toEqual(identities)
  expect(new URL(page.url()).search).toBe(query)
  await page.getByRole('button', { name: '切换为 English' }).click()
  await expect(links).toHaveCount(identities.length)
  await page.reload()
  await expect(links).toHaveCount(identities.length)
})

for (const family of ['Microstructure', '微观结构']) {
  test(`legacy family URL ${family} works in both locales`, async ({ page }) => {
    await page.goto(`/factors?family=${encodeURIComponent(family)}&sort=coverage`)
    const links = page.locator('.factor-table tbody tr td:first-child a')
    await expect(links.first()).toBeVisible()
    const identities = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')).sort())
    await page.getByRole('button', { name: 'Switch to 中文' }).click()
    await expect(links).toHaveCount(identities.length)
    expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')).sort())).toEqual(identities)
    await page.getByRole('combobox', { name: /^排序/ }).selectOption('name')
    expect(new URL(page.url()).searchParams.get('family')).toBe('微观结构')
  })
}
