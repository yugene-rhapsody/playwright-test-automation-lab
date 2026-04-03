# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auto-generated/general-auto-20260403-083700.spec.ts >> Notification Component >> success notification displays correctly
- Location: tests/auto-generated/general-auto-20260403-083700.spec.ts:4:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/test-notification?type=success&message=Operation completed successfully", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Notification Component', () => {
  4  |     test('success notification displays correctly', async ({ page }) => {
> 5  |         await page.goto('/test-notification?type=success&message=Operation completed successfully')
     |                    ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6  |         
  7  |         const notification = page.getByTestId('notification')
  8  |         await expect(notification).toBeVisible()
  9  |         await expect(notification).toHaveAttribute('data-type', 'success')
  10 |         
  11 |         const message = page.getByTestId('notification-message')
  12 |         await expect(message).toHaveText('Operation completed successfully')
  13 |         
  14 |         const closeButton = page.getByTestId('notification-close')
  15 |         await expect(closeButton).toBeVisible()
  16 |         await expect(closeButton).toHaveText('닫기')
  17 |     })
  18 | 
  19 |     test('error notification displays correctly', async ({ page }) => {
  20 |         await page.goto('/test-notification?type=error&message=Something went wrong')
  21 |         
  22 |         const notification = page.getByTestId('notification')
  23 |         await expect(notification).toBeVisible()
  24 |         await expect(notification).toHaveAttribute('data-type', 'error')
  25 |         
  26 |         const message = page.getByTestId('notification-message')
  27 |         await expect(message).toHaveText('Something went wrong')
  28 |         
  29 |         const closeButton = page.getByTestId('notification-close')
  30 |         await expect(closeButton).toBeVisible()
  31 |         await expect(closeButton).toHaveText('닫기')
  32 |     })
  33 | 
  34 |     test('info notification displays correctly', async ({ page }) => {
  35 |         await page.goto('/test-notification?type=info&message=Here is some information')
  36 |         
  37 |         const notification = page.getByTestId('notification')
  38 |         await expect(notification).toBeVisible()
  39 |         await expect(notification).toHaveAttribute('data-type', 'info')
  40 |         
  41 |         const message = page.getByTestId('notification-message')
  42 |         await expect(message).toHaveText('Here is some information')
  43 |         
  44 |         const closeButton = page.getByTestId('notification-close')
  45 |         await expect(closeButton).toBeVisible()
  46 |         await expect(closeButton).toHaveText('닫기')
  47 |     })
  48 | 
  49 |     test('close button functionality', async ({ page }) => {
  50 |         await page.goto('/test-notification?type=info&message=Test message&closeable=true')
  51 |         
  52 |         const notification = page.getByTestId('notification')
  53 |         await expect(notification).toBeVisible()
  54 |         
  55 |         const closeButton = page.getByTestId('notification-close')
  56 |         await closeButton.click()
  57 |         
  58 |         await expect(notification).not.toBeVisible()
  59 |     })
  60 | 
  61 |     test('notification with long message displays correctly', async ({ page }) => {
  62 |         const longMessage = 'This is a very long notification message that should be displayed properly regardless of its length and should not break the notification layout'
  63 |         await page.goto(`/test-notification?type=info&message=${encodeURIComponent(longMessage)}`)
  64 |         
  65 |         const notification = page.getByTestId('notification')
  66 |         await expect(notification).toBeVisible()
  67 |         
  68 |         const message = page.getByTestId('notification-message')
  69 |         await expect(message).toHaveText(longMessage)
  70 |         
  71 |         const closeButton = page.getByTestId('notification-close')
  72 |         await expect(closeButton).toBeVisible()
  73 |     })
  74 | })
  75 | 
```