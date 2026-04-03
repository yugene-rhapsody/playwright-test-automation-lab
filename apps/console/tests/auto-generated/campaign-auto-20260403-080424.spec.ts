import { test, expect } from '../fixtures/test'

test.describe('캠페인 목록 관리', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/campaign-list')
        await expect(page.getByRole('heading', { name: '캠페인 관리' })).toBeVisible()
    })

    test('초기 상태 확인', async ({ page }) => {
        await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 0원')
        await expect(page.getByTestId('campaign-list')).toBeEmpty()
    })

    test('필터 버튼 동작 확인', async ({ page }) => {
        const allFilter = page.getByTestId('filter-all')
        const activeFilter = page.getByTestId('filter-active')
        const pausedFilter = page.getByTestId('filter-paused')

        await expect(allFilter).toBeVisible()
        await expect(activeFilter).toBeVisible()
        await expect(pausedFilter).toBeVisible()

        await activeFilter.click()
        await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')

        await pausedFilter.click()
        await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')

        await allFilter.click()
        await expect(page.getByTestId('campaign-count')).toHaveText('0개 캠페인')
    })

    test('캠페인 데이터가 있을 때 목록 표시', async ({ page }) => {
        await page.evaluate(() => {
            const mockCampaigns = [
                { id: 'c1', name: '테스트 캠페인 1', status: 'active', budget: 10000 },
                { id: 'c2', name: '테스트 캠페인 2', status: 'paused', budget: 20000 },
                { id: 'c3', name: '테스트 캠페인 3', status: 'draft', budget: 15000 }
            ]
            window.dispatchEvent(new CustomEvent('mock-campaigns', { detail: mockCampaigns }))
        })

        await expect(page.getByTestId('campaign-count')).toHaveText('3개 캠페인')
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 45,000원')

        await expect(page.getByTestId('campaign-c1')).toContainText('테스트 캠페인 1')
        await expect(page.getByTestId('status-c1')).toHaveText('active')
        await expect(page.getByTestId('campaign-c1')).toContainText('10,000원')

        await expect(page.getByTestId('campaign-c2')).toContainText('테스트 캠페인 2')
        await expect(page.getByTestId('status-c2')).toHaveText('paused')
        await expect(page.getByTestId('campaign-c2')).toContainText('20,000원')

        await expect(page.getByTestId('campaign-c3')).toContainText('테스트 캠페인 3')
        await expect(page.getByTestId('status-c3')).toHaveText('draft')
        await expect(page.getByTestId('campaign-c3')).toContainText('15,000원')
    })

    test('상태별 필터링 동작', async ({ page }) => {
        await page.evaluate(() => {
            const mockCampaigns = [
                { id: 'c1', name: '활성 캠페인', status: 'active', budget: 10000 },
                { id: 'c2', name: '일시정지 캠페인', status: 'paused', budget: 20000 },
                { id: 'c3', name: '초안 캠페인', status: 'draft', budget: 15000 }
            ]
            window.dispatchEvent(new CustomEvent('mock-campaigns', { detail: mockCampaigns }))
        })

        await page.getByTestId('filter-active').click()
        await expect(page.getByTestId('campaign-count')).toHaveText('1개 캠페인')
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 10,000원')
        await expect(page.getByTestId('campaign-c1')).toBeVisible()
        await expect(page.getByTestId('campaign-c2')).not.toBeVisible()
        await expect(page.getByTestId('campaign-c3')).not.toBeVisible()

        await page.getByTestId('filter-paused').click()
        await expect(page.getByTestId('campaign-count')).toHaveText('1개 캠페인')
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 20,000원')
        await expect(page.getByTestId('campaign-c1')).not.toBeVisible()
        await expect(page.getByTestId('campaign-c2')).toBeVisible()
        await expect(page.getByTestId('campaign-c3')).not.toBeVisible()

        await page.getByTestId('filter-all').click()
        await expect(page.getByTestId('campaign-count')).toHaveText('3개 캠페인')
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 45,000원')
        await expect(page.getByTestId('campaign-c1')).toBeVisible()
        await expect(page.getByTestId('campaign-c2')).toBeVisible()
        await expect(page.getByTestId('campaign-c3')).toBeVisible()
    })

    test('예산 합계 계산 검증', async ({ page }) => {
        await page.evaluate(() => {
            const mockCampaigns = [
                { id: 'c1', name: '캠페인 1', status: 'active', budget: 1234567 },
                { id: 'c2', name: '캠페인 2', status: 'active', budget: 987654 }
            ]
            window.dispatchEvent(new CustomEvent('mock-campaigns', { detail: mockCampaigns }))
        })

        await page.getByTestId('filter-active').click()
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 2,222,221원')

        await page.getByTestId('filter-paused').click()
        await expect(page.getByTestId('total-budget')).toHaveText('총 예산: 0원')
    })
})
