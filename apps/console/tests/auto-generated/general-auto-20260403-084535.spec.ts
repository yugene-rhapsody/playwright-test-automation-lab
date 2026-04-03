import { test, expect } from '@playwright/test'

test.describe('Pagination Component', () => {
    test('displays current page and total pages', async ({ page }) => {
        await page.goto('/pagination-test')
        
        const pageInfo = page.getByTestId('page-info')
        await expect(pageInfo).toBeVisible()
        
        const pageText = await pageInfo.textContent()
        expect(pageText).toMatch(/\d+ \/ \d+/)
    })

    test('disables previous button on first page', async ({ page }) => {
        await page.goto('/pagination-test')
        
        const prevButton = page.getByTestId('prev-page')
        await expect(prevButton).toBeVisible()
        await expect(prevButton).toHaveText('이전')
        await expect(prevButton).toBeDisabled()
    })

    test('disables next button on last page', async ({ page }) => {
        await page.goto('/pagination-test?page=last')
        
        const nextButton = page.getByTestId('next-page')
        await expect(nextButton).toBeVisible()
        await expect(nextButton).toHaveText('다음')
        await expect(nextButton).toBeDisabled()
    })

    test('enables both buttons on middle page', async ({ page }) => {
        await page.goto('/pagination-test?page=2&total=5')
        
        const prevButton = page.getByTestId('prev-page')
        const nextButton = page.getByTestId('next-page')
        
        await expect(prevButton).toBeEnabled()
        await expect(nextButton).toBeEnabled()
        
        const pageInfo = page.getByTestId('page-info')
        await expect(pageInfo).toHaveText('2 / 5')
    })

    test('navigates to previous page when clicking previous button', async ({ page }) => {
        await page.goto('/pagination-test?page=3&total=5')
        
        const prevButton = page.getByTestId('prev-page')
        const pageInfo = page.getByTestId('page-info')
        
        await expect(pageInfo).toHaveText('3 / 5')
        await prevButton.click()
        
        await expect(pageInfo).toHaveText('2 / 5')
    })

    test('navigates to next page when clicking next button', async ({ page }) => {
        await page.goto('/pagination-test?page=2&total=5')
        
        const nextButton = page.getByTestId('next-page')
        const pageInfo = page.getByTestId('page-info')
        
        await expect(pageInfo).toHaveText('2 / 5')
        await nextButton.click()
        
        await expect(pageInfo).toHaveText('3 / 5')
    })

    test('handles single page scenario', async ({ page }) => {
        await page.goto('/pagination-test?page=1&total=1')
        
        const prevButton = page.getByTestId('prev-page')
        const nextButton = page.getByTestId('next-page')
        const pageInfo = page.getByTestId('page-info')
        
        await expect(pageInfo).toHaveText('1 / 1')
        await expect(prevButton).toBeDisabled()
        await expect(nextButton).toBeDisabled()
    })

    test('pagination container has correct structure', async ({ page }) => {
        await page.goto('/pagination-test')
        
        const pagination = page.getByTestId('pagination')
        await expect(pagination).toBeVisible()
        
        const prevButton = pagination.getByTestId('prev-page')
        const pageInfo = pagination.getByTestId('page-info')
        const nextButton = pagination.getByTestId('next-page')
        
        await expect(prevButton).toBeVisible()
        await expect(pageInfo).toBeVisible()
        await expect(nextButton).toBeVisible()
    })
})
