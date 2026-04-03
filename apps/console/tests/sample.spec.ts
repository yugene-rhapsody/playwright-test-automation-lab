import { test, expect } from '@playwright/test'


test('sample: playwright.dev 접속 확인', async ({ page }) => {
    await page.goto('https://playwright.dev/')
    await expect(page).toHaveTitle(/Playwright/)
})

test('sample: 페이지 내 Get Started 링크 존재', async ({ page }) => {
    await page.goto('https://playwright.dev/')
    const getStarted = page.getByRole('link', { name: 'Get started' })
    await expect(getStarted).toBeVisible()
})
