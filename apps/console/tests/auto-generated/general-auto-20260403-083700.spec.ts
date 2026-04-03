import { test, expect } from '@playwright/test'

test.describe('Notification Component', () => {
    test('success notification displays correctly', async ({ page }) => {
        await page.goto('/test-notification?type=success&message=Operation completed successfully')
        
        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()
        await expect(notification).toHaveAttribute('data-type', 'success')
        
        const message = page.getByTestId('notification-message')
        await expect(message).toHaveText('Operation completed successfully')
        
        const closeButton = page.getByTestId('notification-close')
        await expect(closeButton).toBeVisible()
        await expect(closeButton).toHaveText('닫기')
    })

    test('error notification displays correctly', async ({ page }) => {
        await page.goto('/test-notification?type=error&message=Something went wrong')
        
        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()
        await expect(notification).toHaveAttribute('data-type', 'error')
        
        const message = page.getByTestId('notification-message')
        await expect(message).toHaveText('Something went wrong')
        
        const closeButton = page.getByTestId('notification-close')
        await expect(closeButton).toBeVisible()
        await expect(closeButton).toHaveText('닫기')
    })

    test('info notification displays correctly', async ({ page }) => {
        await page.goto('/test-notification?type=info&message=Here is some information')
        
        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()
        await expect(notification).toHaveAttribute('data-type', 'info')
        
        const message = page.getByTestId('notification-message')
        await expect(message).toHaveText('Here is some information')
        
        const closeButton = page.getByTestId('notification-close')
        await expect(closeButton).toBeVisible()
        await expect(closeButton).toHaveText('닫기')
    })

    test('close button functionality', async ({ page }) => {
        await page.goto('/test-notification?type=info&message=Test message&closeable=true')
        
        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()
        
        const closeButton = page.getByTestId('notification-close')
        await closeButton.click()
        
        await expect(notification).not.toBeVisible()
    })

    test('notification with long message displays correctly', async ({ page }) => {
        const longMessage = 'This is a very long notification message that should be displayed properly regardless of its length and should not break the notification layout'
        await page.goto(`/test-notification?type=info&message=${encodeURIComponent(longMessage)}`)
        
        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()
        
        const message = page.getByTestId('notification-message')
        await expect(message).toHaveText(longMessage)
        
        const closeButton = page.getByTestId('notification-close')
        await expect(closeButton).toBeVisible()
    })
})
