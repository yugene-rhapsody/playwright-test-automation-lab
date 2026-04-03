#!/bin/bash
# generate-tests.sh — git diff 기반으로 Claude API가 Playwright 테스트를 자동 생성
# 사용법: ./scripts/generate-tests.sh
# 환경변수: ANTHROPIC_API_KEY

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONSOLE_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$CONSOLE_DIR/../.."
RULES_FILE="$REPO_ROOT/.claude/rules/e2e-testing.md"
OUTPUT_DIR="$CONSOLE_DIR/tests/auto-generated"

mkdir -p "$OUTPUT_DIR"

# 변경된 소스 파일 추출 (apps/console/src/ 만 대상)
CHANGED_FILES=$(git diff HEAD~1 --name-only --diff-filter=ACMR -- 'apps/console/src/**' 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo "No source file changes detected. Skipping test generation."
    exit 0
fi

echo "=== Test Auto-Generator ==="
echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

# 도메인 매핑: src 경로 → 테스트 도메인
get_domain() {
    local file="$1"
    case "$file" in
        *campaign*|*Campaign*) echo "campaign" ;;
        *creative*|*Creative*) echo "creative" ;;
        *ad-unit*|*AdUnit*|*adunit*) echo "ad-unit" ;;
        *setting*|*Setting*) echo "settings" ;;
        *payment*|*Payment*|*billing*|*Billing*) echo "payments" ;;
        *dashboard*|*Dashboard*) echo "dashboard" ;;
        *report*|*Report*) echo "report" ;;
        *auth*|*Auth*|*login*|*Login*) echo "auth" ;;
        *onboarding*|*Onboarding*) echo "onboarding" ;;
        *targeting*|*Targeting*) echo "targeting" ;;
        *navigation*|*Navigation*|*sidebar*|*Sidebar*) echo "navigation" ;;
        *app*|*App*) echo "app-crud" ;;
        *adproduct*|*AdProduct*) echo "adproduct" ;;
        *event*|*Event*) echo "event" ;;
        *property*|*Property*) echo "property" ;;
        *) echo "general" ;;
    esac
}

# 도메인별 기존 테스트 예시 가져오기 (최대 2개)
get_example_tests() {
    local domain="$1"
    local test_dir="$CONSOLE_DIR/tests/$domain"
    if [ -d "$test_dir" ]; then
        find "$test_dir" -name "*.spec.ts" -type f | head -2 | while read -r f; do
            echo "--- Example: $(basename "$f") ---"
            head -80 "$f"
            echo ""
        done
    fi
}

# 규칙 파일 읽기
RULES_CONTENT=""
if [ -f "$RULES_FILE" ]; then
    RULES_CONTENT=$(cat "$RULES_FILE")
fi

# 변경된 파일별로 처리
GENERATED=0
DOMAINS_PROCESSED=""

echo "$CHANGED_FILES" | while IFS= read -r file; do
    [ -z "$file" ] && continue

    DOMAIN=$(get_domain "$file")

    # 같은 도메인은 한 번만 처리
    if echo "$DOMAINS_PROCESSED" | grep -q "$DOMAIN"; then
        continue
    fi
    DOMAINS_PROCESSED="$DOMAINS_PROCESSED $DOMAIN"

    echo "Processing domain: $DOMAIN (from $file)"

    # 해당 도메인의 모든 변경 파일 diff 수집
    DOMAIN_DIFF=$(echo "$CHANGED_FILES" | while IFS= read -r f; do
        f_domain=$(get_domain "$f")
        if [ "$f_domain" = "$DOMAIN" ]; then
            git diff HEAD~1 -- "$f" 2>/dev/null
        fi
    done)

    if [ -z "$DOMAIN_DIFF" ]; then
        echo "  No diff content for $DOMAIN. Skipping."
        continue
    fi

    EXAMPLES=$(get_example_tests "$DOMAIN")

    mkdir -p "$OUTPUT_DIR"

    # Claude API 호출
    RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -d "$(jq -n \
            --arg rules "$RULES_CONTENT" \
            --arg examples "$EXAMPLES" \
            --arg diff "$DOMAIN_DIFF" \
            --arg domain "$DOMAIN" \
            '{
                model: "claude-sonnet-4-20250514",
                max_tokens: 8192,
                system: ("You are a Playwright E2E test generator for the Adrop ads console.\n\nRULES:\n" + $rules + "\n\nEXISTING TEST EXAMPLES:\n" + $examples + "\n\nIMPORTANT:\n- Output ONLY valid TypeScript Playwright test code\n- No markdown fences, no explanations\n- Follow the exact same import patterns as the examples\n- Use semantic selectors (getByRole, getByText, data-cy)\n- Use conditional waits, never waitForTimeout\n- Use the test fixture from ../fixtures/test\n- Korean UI text should use i18n constants from test-packages/constants"),
                messages: [{
                    role: "user",
                    content: ("Generate Playwright E2E tests for these code changes in the " + $domain + " domain.\n\nCODE DIFF:\n" + $diff)
                }]
            }'
        )"
    )

    TEST_CODE=$(echo "$RESPONSE" | jq -r '.content[0].text // empty')

    if [ -n "$TEST_CODE" ] && [ "$TEST_CODE" != "null" ]; then
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        OUTPUT_FILE="$OUTPUT_DIR/${DOMAIN}-auto-${TIMESTAMP}.spec.ts"
        echo "$TEST_CODE" > "$OUTPUT_FILE"
        echo "  GENERATED: $OUTPUT_FILE"
        GENERATED=$((GENERATED + 1))
    else
        echo "  FAILED: No test generated for $DOMAIN"
        echo "  API response: $(echo "$RESPONSE" | jq -r '.error.message // "unknown error"')"
    fi
done

echo ""
echo "=== Generation complete: $GENERATED test file(s) created ==="
