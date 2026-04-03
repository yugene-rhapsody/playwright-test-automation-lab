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

    # Claude API 호출 (임시 파일로 JSON 생성하여 특수문자 문제 방지)
    REQUEST_FILE=$(mktemp /tmp/claude-req-XXXXXXXX.json)

    python3 -c "
import json, sys
data = {
    'model': 'claude-sonnet-4-20250514',
    'max_tokens': 8192,
    'system': '''You are a Playwright E2E test generator.

RULES:
$(cat "$RULES_FILE" 2>/dev/null || echo "No rules file found")

IMPORTANT:
- Output ONLY valid TypeScript Playwright test code
- No markdown fences, no explanations
- Always import from @playwright/test: import { test, expect } from '@playwright/test'
- Never import from fixtures or relative paths
- Use semantic selectors (getByRole, getByText, data-testid)
- Use conditional waits, never waitForTimeout
- Every test must have at least one real value assertion''',
    'messages': [{
        'role': 'user',
        'content': 'Generate Playwright E2E tests for these code changes in the $DOMAIN domain.\n\nCODE DIFF:\n' + sys.stdin.read()
    }]
}
json.dump(data, open('$REQUEST_FILE', 'w'))
" <<< "$DOMAIN_DIFF"

    RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -d @"$REQUEST_FILE"
    )

    rm -f "$REQUEST_FILE"

    TEST_CODE=$(echo "$RESPONSE" | jq -r '.content[0].text // empty')

    if [ -n "$TEST_CODE" ] && [ "$TEST_CODE" != "null" ]; then
        # markdown 펜스 제거 (```typescript ... ``` → 순수 코드만)
        TEST_CODE=$(echo "$TEST_CODE" | sed '/^```[a-z]*/d' | sed '/^```$/d')

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
