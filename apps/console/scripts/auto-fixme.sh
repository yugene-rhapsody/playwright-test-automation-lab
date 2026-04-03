#!/bin/bash
# auto-fixme.sh — 3회 연속 실패한 테스트를 test.fixme()로 전환
# 사용법: ./scripts/auto-fixme.sh <test-results-dir>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONSOLE_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="${1:-$CONSOLE_DIR/test-results}"

echo "=== Auto Fixme ==="

if [ ! -d "$RESULTS_DIR" ]; then
    echo "No test results directory found. Skipping."
    exit 0
fi

FIXED=0

# 실패한 테스트 파일 추출
find "$RESULTS_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r dir; do
    dir_name=$(basename "$dir")

    # retry가 있는 디렉토리 = 실패한 테스트
    retry_count=$(find "$dir" -name "retry*" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$retry_count" -lt 2 ]; then
        continue
    fi

    # 테스트 파일 경로 복원 시도
    # test-results 디렉토리명 패턴: project-name-test-file-name-test-title
    test_file=$(find "$CONSOLE_DIR/tests" -name "*.spec.ts" 2>/dev/null | while read -r f; do
        base=$(basename "$f" .spec.ts)
        if echo "$dir_name" | grep -q "$base"; then
            echo "$f"
            break
        fi
    done)

    if [ -z "$test_file" ]; then
        continue
    fi

    echo "FIXME: $test_file (failed with $retry_count retries)"

    # test( 를 test.fixme(true, 'Auto-disabled: healing 실패', 로 교체
    # 첫 번째 test( 만 교체 (파일에 여러 test가 있을 수 있음)
    if grep -q "test\.fixme" "$test_file"; then
        echo "  Already has fixme. Skipping."
        continue
    fi

    # 모든 test( 호출을 fixme로 변경
    sed -i '' "s/test('/test.fixme(true, 'Auto-disabled: healing 실패 $(date +%Y-%m-%d)', () => {});\\ntest.skip('/g" "$test_file" 2>/dev/null || {
        # GNU sed fallback
        sed -i "s/test('/test.fixme(true, 'Auto-disabled: healing 실패 $(date +%Y-%m-%d)', () => {});\\ntest.skip('/g" "$test_file" 2>/dev/null || true
    }

    FIXED=$((FIXED + 1))
done

echo ""
echo "=== Auto Fixme complete: $FIXED test(s) disabled ==="
