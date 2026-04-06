import { test, expect } from '@playwright/test'

test.describe('Badge Component', () => {
    test.beforeEach(async ({ page }) => {
        // Setup a test page with Badge components
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head><title>Badge Test</title></head>
            <body>
                <div id="root"></div>
                <script type="module">
                    import { Badge } from './Badge.tsx'
                    import { createRoot } from 'react-dom/client'
                    import React from 'react'
                    
                    const root = createRoot(document.getElementById('root'))
                    root.render(React.createElement('div', {}, [
                        React.createElement(Badge, { key: '1', label: 'Default Badge' }),
                        React.createElement(Badge, { key: '2', label: 'Success Badge', variant: 'success' }),
                        React.createElement(Badge, { key: '3', label: 'Warning Badge', variant: 'warning' }),
                        React.createElement(Badge, { key: '4', label: 'Error Badge', variant: 'error' }),
                        React.createElement(Badge, { key: '5', label: 'Badge with Count', count: 5 }),
                        React.createElement(Badge, { key: '6', label: 'Badge with High Count', count: 150 }),
                        React.createElement(Badge, { key: '7', label: 'Badge with Zero Count', count: 0 })
                    ]))
                </script>
            </body>
            </html>
        `)
        await page.waitForSelector('[data-testid="badge"]')
    })

    test('renders badge with default variant', async ({ page }) => {
        const defaultBadge = page.getByTestId('badge').first()
        
        await expect(defaultBadge).toBeVisible()
        await expect(defaultBadge).toHaveAttribute('data-variant', 'default')
        
        const label = defaultBadge.getByTestId('badge-label')
        await expect(label).toHaveText('Default Badge')
    })

    test('renders badge with success variant', async ({ page }) => {
        const successBadge = page.getByTestId('badge').filter({ has: page.getByText('Success Badge') })
        
        await expect(successBadge).toBeVisible()
        await expect(successBadge).toHaveAttribute('data-variant', 'success')
        
        const label = successBadge.getByTestId('badge-label')
        await expect(label).toHaveText('Success Badge')
    })

    test('renders badge with warning variant', async ({ page }) => {
        const warningBadge = page.getByTestId('badge').filter({ has: page.getByText('Warning Badge') })
        
        await expect(warningBadge).toBeVisible()
        await expect(warningBadge).toHaveAttribute('data-variant', 'warning')
        
        const label = warningBadge.getByTestId('badge-label')
        await expect(label).toHaveText('Warning Badge')
    })

    test('renders badge with error variant', async ({ page }) => {
        const errorBadge = page.getByTestId('badge').filter({ has: page.getByText('Error Badge') })
        
        await expect(errorBadge).toBeVisible()
        await expect(errorBadge).toHaveAttribute('data-variant', 'error')
        
        const label = errorBadge.getByTestId('badge-label')
        await expect(label).toHaveText('Error Badge')
    })

    test('renders badge with count when count is provided and greater than 0', async ({ page }) => {
        const badgeWithCount = page.getByTestId('badge').filter({ has: page.getByText('Badge with Count') })
        
        await expect(badgeWithCount).toBeVisible()
        
        const label = badgeWithCount.getByTestId('badge-label')
        await expect(label).toHaveText('Badge with Count')
        
        const count = badgeWithCount.getByTestId('badge-count')
        await expect(count).toBeVisible()
        await expect(count).toHaveText('5')
    })

    test('displays 99+ when count exceeds 99', async ({ page }) => {
        const badgeWithHighCount = page.getByTestId('badge').filter({ has: page.getByText('Badge with High Count') })
        
        await expect(badgeWithHighCount).toBeVisible()
        
        const count = badgeWithHighCount.getByTestId('badge-count')
        await expect(count).toBeVisible()
        await expect(count).toHaveText('99+')
    })

    test('does not render count when count is 0', async ({ page }) => {
        const badgeWithZeroCount = page.getByTestId('badge').filter({ has: page.getByText('Badge with Zero Count') })
        
        await expect(badgeWithZeroCount).toBeVisible()
        
        const count = badgeWithZeroCount.getByTestId('badge-count')
        await expect(count).not.toBeVisible()
    })

    test('does not render count when count is not provided', async ({ page }) => {
        const defaultBadge = page.getByTestId('badge').first()
        
        await expect(defaultBadge).toBeVisible()
        
        const count = defaultBadge.getByTestId('badge-count')
        await expect(count).not.toBeVisible()
    })

    test('renders all badge variants correctly', async ({ page }) => {
        const badges = page.getByTestId('badge')
        
        await expect(badges).toHaveCount(7)
        
        const variants = ['default', 'success', 'warning', 'error', 'default', 'default', 'default']
        
        for (let i = 0; i < variants.length; i++) {
            const badge = badges.nth(i)
            await expect(badge).toHaveAttribute('data-variant', variants[i])
        }
    })
})
