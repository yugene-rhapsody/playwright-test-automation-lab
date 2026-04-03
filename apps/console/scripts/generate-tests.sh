#!/bin/bash
# generate-tests.sh — git diff 기반으로 Claude API가 Playwright 테스트를 자동 생성
# 환경변수: ANTHROPIC_API_KEY
# 실행 위치: 레포 루트 또는 apps/console/

set -euo pipefail

# 레포 루트로 이동
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

CONSOLE_DIR="$REPO_ROOT/apps/console"
RULES_FILE="$REPO_ROOT/.claude/rules/e2e-testing.md"
OUTPUT_DIR="$CONSOLE_DIR/tests/auto-generated"

mkdir -p "$OUTPUT_DIR"

# 변경된 소스 파일 추출
CHANGED_FILES=$(git diff HEAD~1 --name-only --diff-filter=ACMR -- 'apps/console/src/' 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo "No source file changes detected. Skipping test generation."
    exit 0
fi

echo "=== Test Auto-Generator ==="
echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

# 도메인 매핑
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
        *adproduct*|*AdProduct*) echo "adproduct" ;;
        *event*|*Event*) echo "event" ;;
        *property*|*Property*) echo "property" ;;
        *) echo "general" ;;
    esac
}

# 도메인별 기존 테스트 예시 (최대 2개, 앞 80줄)
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

# 규칙 파일
RULES_CONTENT=""
if [ -f "$RULES_FILE" ]; then
    RULES_CONTENT=$(cat "$RULES_FILE")
fi

# jq 필요
if ! command -v jq &> /dev/null; then
    echo "jq not found. Installing..."
    apt-get update -qq && apt-get install -y -qq jq || { echo "Failed to install jq"; exit 1; }
fi

# 도메인별로 처리
GENERATED=0
PROCESSED_DOMAINS=""

while IFS= read -r file; do
    [ -z "$file" ] && continue

    DOMAIN=$(get_domain "$file")

    # 같은 도메인은 한 번만
    if echo "$PROCESSED_DOMAINS" | grep -q "$DOMAIN"; then
        continue
    fi
    PROCESSED_DOMAINS="$PROCESSED_DOMAINS $DOMAIN"

    echo "Processing domain: $DOMAIN (from $file)"

    # diff 수집
    DOMAIN_DIFF=""
    while IFS= read -r f; do
        f_domain=$(get_domain "$f")
        if [ "$f_domain" = "$DOMAIN" ]; then
            DOMAIN_DIFF="$DOMAIN_DIFF$(git diff HEAD~1 -- "$f" 2>/dev/null)"
        fi
    done <<< "$CHANGED_FILES"

    if [ -z "$DOMAIN_DIFF" ]; then
        echo "  No diff content for $DOMAIN. Skipping."
        continue
    fi

    EXAMPLES=$(get_example_tests "$DOMAIN")

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
                system: ("You are a Playwright E2E test generator.\n\nRULES:\n" + $rules + "\n\nEXISTING TEST EXAMPLES:\n" + $examples + "\n\nIMPORTANT:\n- Output ONLY valid TypeScript Playwright test code\n- No markdown fences, no explanations\n- Use semantic selectors (getByRole, getByText, data-testid)\n- Use conditional waits, never waitForTimeout\n- Every test must have at least one real value assertion"),
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
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message // "unknown error"' 2>/dev/null)
        echo "  Error: $ERROR_MSG"
    fi
done <<< "$CHANGED_FILES"

echo ""
echo "=== Generation complete: $GENERATED test file(s) created ==="
