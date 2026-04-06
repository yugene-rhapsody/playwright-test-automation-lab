# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auto-generated/general-auto-20260406-004612.spec.ts >> Badge Component >> does not render count when count is not provided
- Location: tests/auto-generated/general-auto-20260406-004612.spec.ts:106:5

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="badge"]') to be visible

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('Badge Component', () => {
  4   |     test.beforeEach(async ({ page }) => {
  5   |         // Setup a test page with Badge components
  6   |         await page.setContent(`
  7   |             <!DOCTYPE html>
  8   |             <html>
  9   |             <head><title>Badge Test</title></head>
  10  |             <body>
  11  |                 <div id="root"></div>
  12  |                 <script type="module">
  13  |                     import { Badge } from './Badge.tsx'
  14  |                     import { createRoot } from 'react-dom/client'
  15  |                     import React from 'react'
  16  |                     
  17  |                     const root = createRoot(document.getElementById('root'))
  18  |                     root.render(React.createElement('div', {}, [
  19  |                         React.createElement(Badge, { key: '1', label: 'Default Badge' }),
  20  |                         React.createElement(Badge, { key: '2', label: 'Success Badge', variant: 'success' }),
  21  |                         React.createElement(Badge, { key: '3', label: 'Warning Badge', variant: 'warning' }),
  22  |                         React.createElement(Badge, { key: '4', label: 'Error Badge', variant: 'error' }),
  23  |                         React.createElement(Badge, { key: '5', label: 'Badge with Count', count: 5 }),
  24  |                         React.createElement(Badge, { key: '6', label: 'Badge with High Count', count: 150 }),
  25  |                         React.createElement(Badge, { key: '7', label: 'Badge with Zero Count', count: 0 })
  26  |                     ]))
  27  |                 </script>
  28  |             </body>
  29  |             </html>
  30  |         `)
> 31  |         await page.waitForSelector('[data-testid="badge"]')
      |                    ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  32  |     })
  33  | 
  34  |     test('renders badge with default variant', async ({ page }) => {
  35  |         const defaultBadge = page.getByTestId('badge').first()
  36  |         
  37  |         await expect(defaultBadge).toBeVisible()
  38  |         await expect(defaultBadge).toHaveAttribute('data-variant', 'default')
  39  |         
  40  |         const label = defaultBadge.getByTestId('badge-label')
  41  |         await expect(label).toHaveText('Default Badge')
  42  |     })
  43  | 
  44  |     test('renders badge with success variant', async ({ page }) => {
  45  |         const successBadge = page.getByTestId('badge').filter({ has: page.getByText('Success Badge') })
  46  |         
  47  |         await expect(successBadge).toBeVisible()
  48  |         await expect(successBadge).toHaveAttribute('data-variant', 'success')
  49  |         
  50  |         const label = successBadge.getByTestId('badge-label')
  51  |         await expect(label).toHaveText('Success Badge')
  52  |     })
  53  | 
  54  |     test('renders badge with warning variant', async ({ page }) => {
  55  |         const warningBadge = page.getByTestId('badge').filter({ has: page.getByText('Warning Badge') })
  56  |         
  57  |         await expect(warningBadge).toBeVisible()
  58  |         await expect(warningBadge).toHaveAttribute('data-variant', 'warning')
  59  |         
  60  |         const label = warningBadge.getByTestId('badge-label')
  61  |         await expect(label).toHaveText('Warning Badge')
  62  |     })
  63  | 
  64  |     test('renders badge with error variant', async ({ page }) => {
  65  |         const errorBadge = page.getByTestId('badge').filter({ has: page.getByText('Error Badge') })
  66  |         
  67  |         await expect(errorBadge).toBeVisible()
  68  |         await expect(errorBadge).toHaveAttribute('data-variant', 'error')
  69  |         
  70  |         const label = errorBadge.getByTestId('badge-label')
  71  |         await expect(label).toHaveText('Error Badge')
  72  |     })
  73  | 
  74  |     test('renders badge with count when count is provided and greater than 0', async ({ page }) => {
  75  |         const badgeWithCount = page.getByTestId('badge').filter({ has: page.getByText('Badge with Count') })
  76  |         
  77  |         await expect(badgeWithCount).toBeVisible()
  78  |         
  79  |         const label = badgeWithCount.getByTestId('badge-label')
  80  |         await expect(label).toHaveText('Badge with Count')
  81  |         
  82  |         const count = badgeWithCount.getByTestId('badge-count')
  83  |         await expect(count).toBeVisible()
  84  |         await expect(count).toHaveText('5')
  85  |     })
  86  | 
  87  |     test('displays 99+ when count exceeds 99', async ({ page }) => {
  88  |         const badgeWithHighCount = page.getByTestId('badge').filter({ has: page.getByText('Badge with High Count') })
  89  |         
  90  |         await expect(badgeWithHighCount).toBeVisible()
  91  |         
  92  |         const count = badgeWithHighCount.getByTestId('badge-count')
  93  |         await expect(count).toBeVisible()
  94  |         await expect(count).toHaveText('99+')
  95  |     })
  96  | 
  97  |     test('does not render count when count is 0', async ({ page }) => {
  98  |         const badgeWithZeroCount = page.getByTestId('badge').filter({ has: page.getByText('Badge with Zero Count') })
  99  |         
  100 |         await expect(badgeWithZeroCount).toBeVisible()
  101 |         
  102 |         const count = badgeWithZeroCount.getByTestId('badge-count')
  103 |         await expect(count).not.toBeVisible()
  104 |     })
  105 | 
  106 |     test('does not render count when count is not provided', async ({ page }) => {
  107 |         const defaultBadge = page.getByTestId('badge').first()
  108 |         
  109 |         await expect(defaultBadge).toBeVisible()
  110 |         
  111 |         const count = defaultBadge.getByTestId('badge-count')
  112 |         await expect(count).not.toBeVisible()
  113 |     })
  114 | 
  115 |     test('renders all badge variants correctly', async ({ page }) => {
  116 |         const badges = page.getByTestId('badge')
  117 |         
  118 |         await expect(badges).toHaveCount(7)
  119 |         
  120 |         const variants = ['default', 'success', 'warning', 'error', 'default', 'default', 'default']
  121 |         
  122 |         for (let i = 0; i < variants.length; i++) {
  123 |             const badge = badges.nth(i)
  124 |             await expect(badge).toHaveAttribute('data-variant', variants[i])
  125 |         }
  126 |     })
  127 | })
  128 | 
```