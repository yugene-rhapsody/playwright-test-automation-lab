#!/bin/bash
# heal.sh — Claude API로 실패한 Playwright 테스트를 자동 수정
# 사용법: ./scripts/heal.sh <max_attempts>
# 환경변수: ANTHROPIC_API_KEY

set -euo pipefail

MAX_ATTEMPTS=${1:-2}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONSOLE_DIR="$(dirname "$SCRIPT_DIR")"
RULES_FILE="$CONSOLE_DIR/../../.claude/rules/e2e-testing.md"
REPORT_DIR="$CONSOLE_DIR/test-results"

# CTRF 리포트에서 실패한 테스트 추출
get_failed_tests() {
    if [ -f "$CONSOLE_DIR/ctrf/ctrf-report.json" ]; then
        node -e "
            const r = require('./ctrf/ctrf-report.json');
            const failed = r.results?.tests?.filter(t => t.status === 'failed') || [];
            failed.forEach(t => console.log(t.filePath || t.name));
        " 2>/dev/null || true
    fi

    # fallback: playwright exit code 기반
    find "$REPORT_DIR" -name "*.txt" -path "*/retry*" 2>/dev/null | head -20
}

# 테스트 파일의 에러 정보 수집
collect_error_info() {
    local test_file="$1"
    local error_info=""

    # trace 파일에서 에러 메시지 추출
    local trace_dir="$REPORT_DIR"
    if [ -d "$trace_dir" ]; then
        error_info=$(find "$trace_dir" -name "*.txt" 2>/dev/null | head -1 | xargs cat 2>/dev/null || echo "No trace found")
    fi

    echo "$error_info"
}

# Claude API로 테스트 수정
heal_test() {
    local test_file="$1"
    local error_info="$2"
    local test_content
    test_content=$(cat "$test_file")

    local rules_content=""
    if [ -f "$RULES_FILE" ]; then
        rules_content=$(cat "$RULES_FILE")
    fi

    local response
    response=$(curl -s https://api.anthropic.com/v1/messages \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -d "$(jq -n \
            --arg rules "$rules_content" \
            --arg test_code "$test_content" \
            --arg error "$error_info" \
            '{
                model: "claude-sonnet-4-20250514",
                max_tokens: 8192,
                system: ("You are a Playwright E2E test fixer. Follow these rules:\n" + $rules + "\n\nIMPORTANT: Output ONLY the fixed test code. No explanations, no markdown fences, no comments about what you changed. Just the raw TypeScript code."),
                messages: [{
                    role: "user",
                    content: ("This Playwright test is failing. Fix it.\n\nERROR:\n" + $error + "\n\nTEST CODE:\n" + $test_code)
                }]
            }'
        )"
    )

    local fixed_code
    fixed_code=$(echo "$response" | jq -r '.content[0].text // empty')

    if [ -n "$fixed_code" ] && [ "$fixed_code" != "null" ]; then
        echo "$fixed_code" > "$test_file"
        echo "HEALED: $test_file"
        return 0
    else
        echo "HEAL_FAILED: $test_file (no response from Claude)"
        return 1
    fi
}

# 메인 루프
echo "=== Playwright Healer Agent ==="
echo "Max attempts: $MAX_ATTEMPTS"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    echo ""
    echo "--- Healing attempt $attempt/$MAX_ATTEMPTS ---"

    # 실패한 테스트 실행 결과에서 파일 경로 추출
    FAILED_FILES=$(find "$REPORT_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r dir; do
        # 디렉토리명에서 테스트 파일 경로 추출
        basename "$dir" | sed 's/-retry[0-9]*$//' | sed 's/-/\//g' | sed 's/\.spec\.ts.*/.spec.ts/'
    done | sort -u)

    if [ -z "$FAILED_FILES" ]; then
        echo "No failed tests found. Healing complete."
        exit 0
    fi

    HEALED=0
    while IFS= read -r failed_file; do
        # 실제 파일 경로 찾기
        actual_file=$(find "$CONSOLE_DIR/tests" -path "*${failed_file}*" -name "*.spec.ts" 2>/dev/null | head -1)
        if [ -z "$actual_file" ]; then
            echo "SKIP: Cannot find file for $failed_file"
            continue
        fi

        error_info=$(collect_error_info "$actual_file")
        if heal_test "$actual_file" "$error_info"; then
            HEALED=$((HEALED + 1))
        fi
    done <<< "$FAILED_FILES"

    if [ "$HEALED" -eq 0 ]; then
        echo "No tests were healed. Stopping."
        exit 1
    fi

    echo "Healed $HEALED tests. Re-running..."
    npx playwright test --retries=0 --reporter=list || {
        if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
            echo "Tests still failing. Trying again..."
            continue
        else
            echo "Healing exhausted after $MAX_ATTEMPTS attempts."
            exit 1
        fi
    }

    echo "All tests passed after healing!"
    exit 0
done

echo "Healing failed after $MAX_ATTEMPTS attempts."
exit 1
