import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [
            ['github'],
            ['list'],
            ['html', { outputFolder: 'playwright-report', open: 'never' }],
            ['allure-playwright'],
            ['playwright-ctrf-json-reporter', { outputDir: 'ctrf' }]
        ]
        : 'html',
    use: {
        trace: 'on-first-retry',
        headless: true
    },
    timeout: 30000,
    projects: [
        {
            name: 'default',
            testMatch: [
                'tests/**/*.spec.ts',
                'tests/auto-generated/**/*.spec.ts'
            ]
        },
        {
            name: 'crud',
            testMatch: 'tests/**/*.spec.ts'
        },
        {
            name: 'readonly',
            testMatch: [
                'tests/**/*.spec.ts',
                'tests/auto-generated/**/*.spec.ts'
            ]
        }
    ]
})
