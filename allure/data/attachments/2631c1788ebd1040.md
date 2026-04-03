# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auto-generated/campaign-auto-20260403-080424.spec.ts >> 캠페인 목록 관리 >> 필터 버튼 동작 확인
- Location: tests/auto-generated/campaign-auto-20260403-080424.spec.ts:15:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/campaign-list", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('캠페인 목록 관리', () => {
  4   |     test.beforeEach(async ({ page }) => {
> 5   |         await page.goto('/campaign-list')
      |                    ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6   |         await expect(page.getByRole('heading', { name: '캠페인 관리' })).toBeVisible()
  7   |     })
  8   | 
  9   |     test('초기 상태 확인', async ({ page }) => {
  10  |         await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')
  11  |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 0원')
  12  |         await expect(page.getByTestId('campaign-list')).toBeEmpty()
  13  |     })
  14  | 
  15  |     test('필터 버튼 동작 확인', async ({ page }) => {
  16  |         const allFilter = page.getByTestId('filter-all')
  17  |         const activeFilter = page.getByTestId('filter-active')
  18  |         const pausedFilter = page.getByTestId('filter-paused')
  19  | 
  20  |         await expect(allFilter).toBeVisible()
  21  |         await expect(activeFilter).toBeVisible()
  22  |         await expect(pausedFilter).toBeVisible()
  23  | 
  24  |         await activeFilter.click()
  25  |         await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')
  26  | 
  27  |         await pausedFilter.click()
  28  |         await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')
  29  | 
  30  |         await allFilter.click()
  31  |         await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')
  32  |     })
  33  | 
  34  |     test('캠페인 데이터가 있을 때 목록 표시', async ({ page }) => {
  35  |         await page.evaluate(() => {
  36  |             const mockCampaigns = [
  37  |                 { id: 'c1', name: '테스트 캠페인 1', status: 'active', budget: 10000 },
  38  |                 { id: 'c2', name: '테스트 캠페인 2', status: 'paused', budget: 20000 },
  39  |                 { id: 'c3', name: '테스트 캠페인 3', status: 'draft', budget: 15000 }
  40  |             ]
  41  |             window.dispatchEvent(new CustomEvent('mock-campaigns', { detail: mockCampaigns }))
  42  |         })
  43  | 
  44  |         await expect(page.getByTestId('campaign-count')).toHaveText('3개 캠페인')
  45  |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 45,000원')
  46  | 
  47  |         await expect(page.getByTestId('campaign-c1')).toContainText('테스트 캠페인 1')
  48  |         await expect(page.getByTestId('status-c1')).toHaveText('active')
  49  |         await expect(page.getByTestId('campaign-c1')).toContainText('10,000원')
  50  | 
  51  |         await expect(page.getByTestId('campaign-c2')).toContainText('테스트 캠페인 2')
  52  |         await expect(page.getByTestId('status-c2')).toHaveText('paused')
  53  |         await expect(page.getByTestId('campaign-c2')).toContainText('20,000원')
  54  | 
  55  |         await expect(page.getByTestId('campaign-c3')).toContainText('테스트 캠페인 3')
  56  |         await expect(page.getByTestId('status-c3')).toHaveText('draft')
  57  |         await expect(page.getByTestId('campaign-c3')).toContainText('15,000원')
  58  |     })
  59  | 
  60  |     test('상태별 필터링 동작', async ({ page }) => {
  61  |         await page.evaluate(() => {
  62  |             const mockCampaigns = [
  63  |                 { id: 'c1', name: '활성 캠페인', status: 'active', budget: 10000 },
  64  |                 { id: 'c2', name: '일시정지 캠페인', status: 'paused', budget: 20000 },
  65  |                 { id: 'c3', name: '초안 캠페인', status: 'draft', budget: 15000 }
  66  |             ]
  67  |             window.dispatchEvent(new CustomEvent('mock-campaigns', { detail: mockCampaigns }))
  68  |         })
  69  | 
  70  |         await page.getByTestId('filter-active').click()
  71  |         await expect(page.getByTestId('campaign-count')).toHaveText('1개 캠페인')
  72  |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 10,000원')
  73  |         await expect(page.getByTestId('campaign-c1')).toBeVisible()
  74  |         await expect(page.getByTestId('campaign-c2')).not.toBeVisible()
  75  |         await expect(page.getByTestId('campaign-c3')).not.toBeVisible()
  76  | 
  77  |         await page.getByTestId('filter-paused').click()
  78  |         await expect(page.getByTestId('campaign-count')).toHaveText('1개 캠페인')
  79  |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 20,000원')
  80  |         await expect(page.getByTestId('campaign-c1')).not.toBeVisible()
  81  |         await expect(page.getByTestId('campaign-c2')).toBeVisible()
  82  |         await expect(page.getByTestId('campaign-c3')).not.toBeVisible()
  83  | 
  84  |         await page.getByTestId('filter-all').click()
  85  |         await expect(page.getByTestId('campaign-count')).toHaveText('3개 캠페인')
  86  |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 45,000원')
  87  |         await expect(page.getByTestId('campaign-c1')).toBeVisible()
  88  |         await expect(page.getByTestId('campaign-c2')).toBeVisible()
  89  |         await expect(page.getByTestId('campaign-c3')).toBeVisible()
  90  |     })
  91  | 
  92  |     test('예산 합계 계산 검증', async ({ page }) => {
  93  |         await page.evaluate(() => {
  94  |             const mockCampaigns = [
  95  |                 { id: 'c1', name: '캠페인 1', status: 'active', budget: 1234567 },
  96  |                 { id: 'c2', name: '캠페인 2', status: 'active', budget: 987654 }
  97  |             ]
  98  |             window.dispatchEvent(new CustomEvent('mock-campaigns', { detail: mockCampaigns }))
  99  |         })
  100 | 
  101 |         await page.getByTestId('filter-active').click()
  102 |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 2,222,221원')
  103 | 
  104 |         await page.getByTestId('filter-paused').click()
  105 |         await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 0원')
```