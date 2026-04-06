import { test, expect } from '@playwright/test'

test.describe('Notification Component', () => {
    test('displays notification message and type', async ({ page }) => {
        await page.setContent(`
            <div id="root"></div>
            <script type="module">
                import { createElement } from 'react'
                import { createRoot } from 'react-dom/client'
                import { Notification } from './src/Notification.tsx'
                
                const root = createRoot(document.getElementById('root'))
                root.render(createElement(Notification, {
                    message: '작업이 완료되었습니다',
                    type: 'success'
                }))
            </script>
        `)

        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()
        await expect(notification).toHaveAttribute('data-type', 'success')
        
        const message = page.getByTestId('notification-message')
        await expect(message).toHaveText('작업이 완료되었습니다')
        
        const closeButton = page.getByTestId('notification-close')
        await expect(closeButton).toBeVisible()
        await expect(closeButton).toHaveText('닫기')
    })

    test('closes notification when close button is clicked', async ({ page }) => {
        await page.setContent(`
            <div id="root"></div>
            <script type="module">
                import { createElement } from 'react'
                import { createRoot } from 'react-dom/client'
                import { Notification } from './src/Notification.tsx'
                
                const root = createRoot(document.getElementById('root'))
                root.render(createElement(Notification, {
                    message: '에러가 발생했습니다',
                    type: 'error'
                }))
            </script>
        `)

        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()

        const closeButton = page.getByTestId('notification-close')
        await closeButton.click()

        await expect(notification).not.toBeVisible()
    })

    test('auto-dismisses notification after specified time', async ({ page }) => {
        await page.setContent(`
            <div id="root"></div>
            <script type="module">
                import { createElement } from 'react'
                import { createRoot } from 'react-dom/client'
                import { Notification } from './src/Notification.tsx'
                
                const root = createRoot(document.getElementById('root'))
                root.render(createElement(Notification, {
                    message: '정보 메시지입니다',
                    type: 'info',
                    autoDismiss: 1000
                }))
            </script>
        `)

        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()

        // Wait for auto-dismiss
        await expect(notification).not.toBeVisible({ timeout: 2000 })
    })

    test('calls onDismiss callback when auto-dismissed', async ({ page }) => {
        await page.setContent(`
            <div id="root"></div>
            <div id="callback-result" data-testid="callback-result"></div>
            <script type="module">
                import { createElement } from 'react'
                import { createRoot } from 'react-dom/client'
                import { Notification } from './src/Notification.tsx'
                
                const handleDismiss = () => {
                    document.getElementById('callback-result').textContent = 'dismissed'
                }
                
                const root = createRoot(document.getElementById('root'))
                root.render(createElement(Notification, {
                    message: '자동 닫힘 테스트',
                    type: 'success',
                    autoDismiss: 500,
                    onDismiss: handleDismiss
                }))
            </script>
        `)

        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()

        const callbackResult = page.getByTestId('callback-result')
        await expect(callbackResult).toHaveText('dismissed', { timeout: 1500 })
        await expect(notification).not.toBeVisible()
    })

    test('calls onDismiss callback when manually closed', async ({ page }) => {
        await page.setContent(`
            <div id="root"></div>
            <div id="callback-result" data-testid="callback-result"></div>
            <script type="module">
                import { createElement } from 'react'
                import { createRoot } from 'react-dom/client'
                import { Notification } from './src/Notification.tsx'
                
                const handleDismiss = () => {
                    document.getElementById('callback-result').textContent = 'manually-dismissed'
                }
                
                const root = createRoot(document.getElementById('root'))
                root.render(createElement(Notification, {
                    message: '수동 닫힘 테스트',
                    type: 'error',
                    onDismiss: handleDismiss
                }))
            </script>
        `)

        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()

        const closeButton = page.getByTestId('notification-close')
        await closeButton.click()

        const callbackResult = page.getByTestId('callback-result')
        await expect(callbackResult).toHaveText('manually-dismissed')
        await expect(notification).not.toBeVisible()
    })

    test('does not auto-dismiss when autoDismiss is not provided', async ({ page }) => {
        await page.setContent(`
            <div id="root"></div>
            <script type="module">
                import { createElement } from 'react'
                import { createRoot } from 'react-dom/client'
                import { Notification } from './src/Notification.tsx'
                
                const root = createRoot(document.getElementById('root'))
                root.render(createElement(Notification, {
                    message: '수동으로만 닫히는 알림',
                    type: 'info'
                }))
            </script>
        `)

        const notification = page.getByTestId('notification')
        await expect(notification).toBeVisible()

        // Wait to ensure it doesn't auto-dismiss
        await page.waitForTimeout(2000)
        await expect(notification).toBeVisible()
    })

    test('supports different notification types', async ({ page }) => {
        const types = ['success', 'error', 'info']
        
        for (const type of types) {
            await page.setContent(`
                <div id="root"></div>
                <script type="module">
                    import { createElement } from 'react'
                    import { createRoot } from 'react-dom/client'
                    import { Notification } from './src/Notification.tsx'
                    
                    const root = createRoot(document.getElementById('root'))
                    root.render(createElement(Notification, {
                        message: '${type} 메시지',
                        type: '${type}'
                    }))
                </script>
            `)

            const notification = page.getByTestId('notification')
            await expect(notification).toBeVisible()
            await expect(notification).toHaveAttribute('data-type', type)
            
            const message = page.getByTestId('notification-message')
            await expect(message).toHaveText(`${type} 메시지`)
        }
    })
})
