import { test as base } from '@playwright/test'

export const test = base.extend({
    page: async ({ page }, use) => {
        page.on('dialog', async dialog => {
            await dialog.accept()
        })

        const consoleErrors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
        })

        await use(page)
    }
})

export { expect } from '@playwright/test'
