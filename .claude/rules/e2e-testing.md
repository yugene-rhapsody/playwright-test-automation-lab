---
globs: ["apps/console/tests/**/*.{ts,tsx}"]
---

# E2E 테스트 작성 규칙

## 1. 테스트 추가 전 필수 확인

### 중복 검사
- 기존 `tests/` 디렉토리에서 **같은 기능을 이미 테스트하고 있는지 반드시 검색**
- 중복 테스트 만들지 않음. 기존 테스트에 assert 추가로 충분하면 그렇게 함
- 검색 대상: test() 제목, 테스트하는 URL 경로, 조작하는 UI 요소
- `auto-generated/`에 있는 테스트도 중복 검사 대상에 포함

### 작성 범위
- 현재 코드에 존재하는 기능만 테스트. 향후 예정 기능의 테스트 작성 금지
- 사용자가 실제로 브라우저에서 도달할 수 있는 경로만 테스트
- 코드상 가능하지만 UI에서 도달 불가능한 경로는 테스트하지 않음

## 2. 글로벌 핸들러 (fixture에 등록 필수)

### dialog/toast/에러 팝업 자동 처리
Vite overlay 제거만으로는 부족하다. dialog, confirm, alert, toast, 에러 모달이 테스트 도중 뜨면 블로킹된다. fixture에서 전역으로 처리할 것.

```typescript
// fixtures/test.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
    page: async ({ page }, use) => {
        // dialog (alert, confirm, prompt) 자동 처리
        page.on('dialog', async dialog => {
            await dialog.accept()
        })

        // Vite 에러 오버레이 제거
        await page.addInitScript(() => {
            window.addEventListener('vite:error', (e) => {
                e.stopImmediatePropagation()
            })
            // vite-plugin-checker overlay 제거
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement && node.tagName === 'VITE-PLUGIN-CHECKER-ERROR-OVERLAY') {
                            node.remove()
                        }
                    })
                }
            })
            observer.observe(document.documentElement, { childList: true, subtree: true })
        })

        // 콘솔 에러 수집 (디버깅용)
        const consoleErrors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
        })

        await use(page)
    }
})

export { expect } from '@playwright/test'
```

모든 테스트 파일은 `@playwright/test` 대신 `../fixtures/test`에서 import할 것:
```typescript
// ✅
import { test, expect } from '../fixtures/test'

// ❌
import { test, expect } from '@playwright/test'
```

## 3. Flaky Test 방지 (가장 중요)

### 셀렉터 — UX 기반 Selector 전략
```
✅ 사용                              ❌ 금지
─────────────────────────────────────────────────────
getByRole('button', { name: '저장' }) nth(3), nth-child
getByText('캠페인 생성')              .class-name-selector
getByTestId('campaign-title')         순서 의존 셀렉터
getByLabel('이름')                    DOM 구조에 의존하는 selector chain
page.locator('[data-cy="..."]')       xpath
```

**nth() 셀렉터 교체 가이드:**
```typescript
// ❌ nth()는 DOM 순서가 바뀌면 엉뚱한 요소를 타겟팅
await page.locator('.campaign-row').nth(2).click()

// ✅ 텍스트나 속성으로 특정
await page.locator('.campaign-row').filter({ hasText: '내 캠페인' }).click()

// ✅ data 속성으로 특정
await page.locator('[data-cy="campaign-row"][data-id="abc123"]').click()

// ✅ 역할 + 이름으로 특정
await page.getByRole('row', { name: '내 캠페인' }).click()

// ✅ 테이블에서 특정 행 찾기
await page.getByRole('row').filter({ hasText: '내 캠페인' }).getByRole('button', { name: '편집' }).click()
```

- 셀렉터가 UI 변경에 영향받지 않는지 자문할 것: "이 셀렉터는 디자이너가 버튼 위치를 옮기면 깨지는가?"
- 깨진다면 다른 셀렉터를 쓸 것
- **nth()를 써야만 하는 상황이면, 상위 요소를 filter로 좁힌 뒤 사용**

### 대기 — 조건 기반 대기만 사용
```typescript
// ✅ 조건 기반 대기
await expect(page.getByText('저장 완료')).toBeVisible()
await page.waitForResponse(res => res.url().includes('/api/campaign') && res.status() === 200)
await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' })

// ❌ 절대 금지
await page.waitForTimeout(5000)       // 고정 대기: 느린 환경에서 실패, 빠른 환경에서 시간 낭비
await page.waitForLoadState('networkidle')  // SPA 폴링 때문에 끝나지 않음
```

### waitForResponse 타이밍 — API 호출 직전에 설정
```typescript
// ✅ 올바른 패턴: API 호출 직전에 설정
await page.getByRole('textbox', { name: '이름' }).fill('Test Campaign')
// ... 폼 작성 ...
const responsePromise = page.waitForResponse(res =>
    res.url().includes('/campaign') && res.request().method() === 'POST'
)
await page.getByRole('button', { name: '생성' }).click()
const response = await responsePromise

// ❌ 잘못된 패턴: 테스트 시작부에 설정
const responsePromise = page.waitForResponse(...)  // 여기서 설정하면
// ... 30초 넘는 작업들 ...                         // 30초 타임아웃으로 실패
await page.getByRole('button', { name: '생성' }).click()
```

### 테스트 격리 — 각 테스트는 독립적으로 실행 가능해야 함
- 다른 테스트의 결과에 **절대 의존하지 않음**
- 테스트가 생성한 데이터는 테스트 내에서 정리하거나, fixture의 cleanup에서 처리
- 고유한 이름 사용: `uniqueName('campaign')` → `test-campaign-1743648273-abc` 같은 패턴
- 고정된 ID, 이름, 이메일을 여러 테스트에서 공유 금지
- 예외: serial 모드에서 순서가 보장되는 CRUD 플로우 (생성 → 수정 → 삭제)

### networkidle 대신 waitForApiSettle 사용
`waitForLoadState('networkidle')`는 SPA에서 폴링/웹소켓이 idle을 방해해 타임아웃이 발생한다. XHR/fetch 요청만 추적하는 유틸로 교체할 것.

```typescript
// helpers/wait.ts
import { Page } from '@playwright/test'

/**
 * 진행 중인 API 요청이 모두 끝날 때까지 대기 (폴링/웹소켓 무시)
 * networkidle 대신 사용
 */
export async function waitForApiSettle(page: Page, options?: { timeout?: number, ignorePatterns?: RegExp[] }) {
    const timeout = options?.timeout ?? 10000
    const ignorePatterns = options?.ignorePatterns ?? [
        /polling/i, /heartbeat/i, /health/i, /ws:/i, /wss:/i,
        /hot-update/i, /__vite/i
    ]

    let pending = 0
    const onRequest = (request: any) => {
        const url = request.url()
        if (ignorePatterns.some(p => p.test(url))) return
        if (['fetch', 'xhr'].includes(request.resourceType())) pending++
    }
    const onResponse = () => { if (pending > 0) pending-- }
    const onFailed = () => { if (pending > 0) pending-- }

    page.on('request', onRequest)
    page.on('response', onResponse)
    page.on('requestfailed', onFailed)

    try {
        await page.waitForFunction(() => true, null, { timeout: 500 })  // 최소 대기
        const start = Date.now()
        while (pending > 0 && Date.now() - start < timeout) {
            await page.waitForTimeout(100)
        }
    } finally {
        page.off('request', onRequest)
        page.off('response', onResponse)
        page.off('requestfailed', onFailed)
    }
}

/**
 * 특정 조건이 충족될 때까지 대기 (waitForTimeout 대체)
 * PDF 생성 등 비동기 작업 대기에 사용
 */
export async function waitForCondition(
    page: Page,
    condition: () => Promise<boolean>,
    options?: { timeout?: number, interval?: number, message?: string }
) {
    const timeout = options?.timeout ?? 30000
    const interval = options?.interval ?? 500
    const message = options?.message ?? 'Condition not met'
    const start = Date.now()

    while (Date.now() - start < timeout) {
        if (await condition()) return
        await page.waitForTimeout(interval)
    }
    throw new Error(`${message} (timeout: ${timeout}ms)`)
}
```

```typescript
// ✅ networkidle 대신
await waitForApiSettle(page)

// ✅ waitForTimeout(5000) 대신 (예: PDF 생성 대기)
await waitForCondition(page, async () => {
    const download = page.locator('[data-cy="pdf-download"]')
    return await download.isVisible()
}, { timeout: 15000, message: 'PDF 생성 대기 중' })

// ❌ 금지
await page.waitForLoadState('networkidle')
await page.waitForTimeout(5000)
```

### 네트워크/환경 변동 대응
```typescript
// ✅ API 응답 상태 확인 후 진행
const response = await responsePromise
expect(response.status()).toBe(200)
const body = await response.json()
expect(body).toBeTruthy()

// ✅ 느린 환경을 고려한 타임아웃
await expect(page.getByText('완료')).toBeVisible({ timeout: 10000 })

// ❌ 기본 타임아웃에 의존
await expect(page.getByText('완료')).toBeVisible()  // 5초 안에 안 뜨면 flaky
```

## 3. Skip/Fixme 규칙

### test.skip() — 환경 조건이 맞지 않을 때만
```typescript
// ✅ 올바른 skip: 조건이 명확하고, 조건 해소 시 자동으로 실행됨
test('Stripe 결제 테스트', async ({ page }) => {
    test.skip(!process.env.STRIPE_KEY, 'Stripe API 키가 없는 환경에서는 실행 불가')
    // ...
})

// ❌ 잘못된 skip
test.skip('나중에 고칠 예정')           // 사유 불명확, 영원히 스킵됨
test.skip(true, '일단 스킵')           // 조건이 항상 true → 의미 없는 테스트
test.skip(!isProduction, '프로덕션만')  // 대부분의 환경에서 안 돌아감
```

### test.fixme() — UI가 아직 구현되지 않았을 때만
```typescript
// ✅ 올바른 fixme
test.fixme(true, '결제 모달 UI 미구현 — JIRA-1234')

// ❌ 잘못된 fixme
test.fixme(true, '왜인지 모르겠는데 실패함')     // 원인 파악 없이 fixme 금지
test.fixme(true, 'flaky해서 일단 비활성화')      // flaky는 고쳐야지 숨기면 안 됨
```

### 금지 패턴
- **flaky 테스트를 skip/fixme로 숨기지 않음** — 원인을 찾아서 고칠 것
- **사유 없는 skip/fixme 금지** — 반드시 왜 스킵하는지, 언제 해제할 수 있는지 명시
- **영구 skip 금지** — 조건이 영원히 true인 skip은 테스트를 삭제하는 것과 같음

## 4. False Positive 방지 — 의미 있는 검증만

### 검증해야 할 것
```typescript
// ✅ 실제 값을 검증
const title = await page.getByTestId('campaign-title').textContent()
expect(title).toBe('내 캠페인')

// ✅ API 응답과 입력값 일치 확인
const response = await responsePromise
const body = await response.json()
expect(body.name).toBe(inputName)
expect(body.status).toBe('draft')

// ✅ 상태 변화 검증
await page.getByRole('button', { name: '삭제' }).click()
await expect(page.getByText('삭제되었습니다')).toBeVisible()
await expect(page.getByTestId('campaign-row')).toHaveCount(initialCount - 1)
```

### 검증하면 안 되는 것
```typescript
// ❌ 존재만 확인하는 무의미한 assertion
await expect(page.getByRole('button')).toBeVisible()  // "아무 버튼이나 보이면 통과"

// ❌ 항상 참인 assertion
expect(true).toBe(true)
expect(response.status()).toBeLessThan(500)  // 404도 통과

// ❌ 디자인 수치 검증 (E2E로 검증 불가)
expect(await element.evaluate(el => getComputedStyle(el).padding)).toBe('16px')
```

### 규칙
- 모든 test()에는 **최소 1개의 실제 값 검증 assertion**이 있어야 함
- `toBeVisible()`만으로는 불충분 — "무엇이 보이는지"도 확인해야 함
- CRUD 테스트는 반드시 **API 응답의 실제 값**을 검증할 것

## 5. 파일 구조 및 코드 조직

### 파일 구조
- CRUD 흐름이 동일하면 1개 파일에서 상수 배열 순회로 전체 커버
- UI 흐름이 근본적으로 다를 때만 파일 분리
- 공통 동작(페이지 이동, 모달 열기, 검색, 삭제)은 `helpers/`에 함수로 분리
- 상수(프리셋, 포맷, 검증 기준)는 `test-packages/`에 분리

### 하드코딩 금지
```typescript
// ✅ 상수에서 import
import { AD_FORMATS } from '../test-packages/constants'
for (const format of AD_FORMATS) {
    test(`${format.name} 포맷 생성`, async ({ page }) => { ... })
}

// ❌ 하드코딩
test('배너 320x180 생성', async ({ page }) => {
    await page.locator('[data-cy="ad-unit-format-1"]').click()  // 의미 불명
})
```
- 상수 배열은 `[0]`만 쓰지 말고 전체 순회
- URL/프로젝트ID 같은 환경 설정값은 `.env`에서 관리

### 만들지 않는 테스트
- 상수 자체를 검증하는 테스트 (상수값이 30인지 확인하는 건 의미 없음)
- 코드상 가능하지만 UI에서 도달 불가능한 경로
- 디자인 수치(padding, color) 검증

## 6. Serial 테스트 (CRUD 플로우)

### 의존 관계가 있는 테스트
```typescript
test.describe.serial('캠페인 CRUD', () => {
    let campaignId: string

    test('생성', async ({ page }) => {
        // ... 생성 로직
        campaignId = await getCampaignId(page)
        expect(campaignId).toBeTruthy()
    })

    test('수정', async ({ page }) => {
        test.skip(!campaignId, '생성 실패로 수정 불가')
        // ... campaignId를 사용한 수정
    })

    test('삭제', async ({ page }) => {
        test.skip(!campaignId, '생성 실패로 삭제 불가')
        // ... campaignId를 사용한 삭제
    })
})
```
- 생성 실패 시 이후 테스트는 `test.skip`으로 처리
- skip 사유에 **왜 스킵하는지** 명시
- 이 패턴은 serial CRUD에서만 허용. parallel 테스트에서는 금지

## 7. 자동 생성 테스트 추가 규칙 (auto-generated/)

- `tests/auto-generated/`에 저장
- 파일명: `{도메인}-auto-{timestamp}.spec.ts`
- 기존 `tests/`의 테스트와 **제목이 겹치면 안 됨**
- 생성 후 반드시 CI에서 실행하여 통과 확인
- 실패 시 사람이 직접 확인 후 수정 또는 삭제 (자동 fixme 없음)
- **사람이 리뷰 후 머지** — CI 통과만으로 자동 머지하지 않음
- 자동 생성 테스트라도 위의 모든 규칙을 동일하게 적용
