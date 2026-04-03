import { test, expect } from '@playwright/test'


test('이 테스트는 일부러 실패합니다', async ({ page }) => {
    await page.goto('https://playwright.dev/')
    await expect(page).toHaveTitle('이건 절대 안 맞는 제목')
})
