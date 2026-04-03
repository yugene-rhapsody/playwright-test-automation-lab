# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auto-generated/general-auto-20260403-084535.spec.ts >> Pagination Component >> disables previous button on first page
- Location: tests/auto-generated/general-auto-20260403-084535.spec.ts:14:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/pagination-test", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Pagination Component', () => {
  4  |     test('displays current page and total pages', async ({ page }) => {
  5  |         await page.goto('/pagination-test')
  6  |         
  7  |         const pageInfo = page.getByTestId('page-info')
  8  |         await expect(pageInfo).toBeVisible()
  9  |         
  10 |         const pageText = await pageInfo.textContent()
  11 |         expect(pageText).toMatch(/\d+ \/ \d+/)
  12 |     })
  13 | 
  14 |     test('disables previous button on first page', async ({ page }) => {
> 15 |         await page.goto('/pagination-test')
     |                    ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  16 |         
  17 |         const prevButton = page.getByTestId('prev-page')
  18 |         await expect(prevButton).toBeVisible()
  19 |         await expect(prevButton).toHaveText('이전')
  20 |         await expect(prevButton).toBeDisabled()
  21 |     })
  22 | 
  23 |     test('disables next button on last page', async ({ page }) => {
  24 |         await page.goto('/pagination-test?page=last')
  25 |         
  26 |         const nextButton = page.getByTestId('next-page')
  27 |         await expect(nextButton).toBeVisible()
  28 |         await expect(nextButton).toHaveText('다음')
  29 |         await expect(nextButton).toBeDisabled()
  30 |     })
  31 | 
  32 |     test('enables both buttons on middle page', async ({ page }) => {
  33 |         await page.goto('/pagination-test?page=2&total=5')
  34 |         
  35 |         const prevButton = page.getByTestId('prev-page')
  36 |         const nextButton = page.getByTestId('next-page')
  37 |         
  38 |         await expect(prevButton).toBeEnabled()
  39 |         await expect(nextButton).toBeEnabled()
  40 |         
  41 |         const pageInfo = page.getByTestId('page-info')
  42 |         await expect(pageInfo).toHaveText('2 / 5')
  43 |     })
  44 | 
  45 |     test('navigates to previous page when clicking previous button', async ({ page }) => {
  46 |         await page.goto('/pagination-test?page=3&total=5')
  47 |         
  48 |         const prevButton = page.getByTestId('prev-page')
  49 |         const pageInfo = page.getByTestId('page-info')
  50 |         
  51 |         await expect(pageInfo).toHaveText('3 / 5')
  52 |         await prevButton.click()
  53 |         
  54 |         await expect(pageInfo).toHaveText('2 / 5')
  55 |     })
  56 | 
  57 |     test('navigates to next page when clicking next button', async ({ page }) => {
  58 |         await page.goto('/pagination-test?page=2&total=5')
  59 |         
  60 |         const nextButton = page.getByTestId('next-page')
  61 |         const pageInfo = page.getByTestId('page-info')
  62 |         
  63 |         await expect(pageInfo).toHaveText('2 / 5')
  64 |         await nextButton.click()
  65 |         
  66 |         await expect(pageInfo).toHaveText('3 / 5')
  67 |     })
  68 | 
  69 |     test('handles single page scenario', async ({ page }) => {
  70 |         await page.goto('/pagination-test?page=1&total=1')
  71 |         
  72 |         const prevButton = page.getByTestId('prev-page')
  73 |         const nextButton = page.getByTestId('next-page')
  74 |         const pageInfo = page.getByTestId('page-info')
  75 |         
  76 |         await expect(pageInfo).toHaveText('1 / 1')
  77 |         await expect(prevButton).toBeDisabled()
  78 |         await expect(nextButton).toBeDisabled()
  79 |     })
  80 | 
  81 |     test('pagination container has correct structure', async ({ page }) => {
  82 |         await page.goto('/pagination-test')
  83 |         
  84 |         const pagination = page.getByTestId('pagination')
  85 |         await expect(pagination).toBeVisible()
  86 |         
  87 |         const prevButton = pagination.getByTestId('prev-page')
  88 |         const pageInfo = pagination.getByTestId('page-info')
  89 |         const nextButton = pagination.getByTestId('next-page')
  90 |         
  91 |         await expect(prevButton).toBeVisible()
  92 |         await expect(pageInfo).toBeVisible()
  93 |         await expect(nextButton).toBeVisible()
  94 |     })
  95 | })
  96 | 
```