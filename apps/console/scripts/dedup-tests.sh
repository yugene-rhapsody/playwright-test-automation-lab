#!/bin/bash
# dedup-tests.sh — auto-generated 테스트와 기존 테스트의 중복 검사
# 사용법: ./scripts/dedup-tests.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONSOLE_DIR="$(dirname "$SCRIPT_DIR")"
AUTO_DIR="$CONSOLE_DIR/tests/auto-generated"
TESTS_DIR="$CONSOLE_DIR/tests"

if [ ! -d "$AUTO_DIR" ] || [ -z "$(find "$AUTO_DIR" -name '*.spec.ts' 2>/dev/null)" ]; then
    echo "No auto-generated tests to check."
    exit 0
fi

echo "=== Dedup Check ==="

REMOVED=0

find "$AUTO_DIR" -name "*.spec.ts" -type f | while read -r auto_file; do
    echo "Checking: $(basename "$auto_file")"

    # test() 블록의 제목 추출
    TITLES=$(grep -oP "test\(\s*['\"](.+?)['\"]" "$auto_file" 2>/dev/null | sed "s/test(['\"]//;s/['\"]$//" || true)

    if [ -z "$TITLES" ]; then
        echo "  No test titles found. Skipping."
        continue
    fi

    HAS_UNIQUE=false

    while IFS= read -r title; do
        [ -z "$title" ] && continue

        # 기존 테스트에서 같은 제목 검색 (auto-generated 제외)
        EXISTING=$(grep -rl "$title" "$TESTS_DIR" --include="*.spec.ts" 2>/dev/null | grep -v "auto-generated" | head -1 || true)

        if [ -n "$EXISTING" ]; then
            echo "  DUPLICATE: '$title' already exists in $(basename "$EXISTING")"
        else
            HAS_UNIQUE=true
        fi
    done <<< "$TITLES"

    if [ "$HAS_UNIQUE" = false ]; then
        echo "  All tests are duplicates. Removing: $(basename "$auto_file")"
        rm "$auto_file"
        REMOVED=$((REMOVED + 1))
    fi
done

echo ""
echo "=== Dedup complete: $REMOVED file(s) removed ==="
