#!/bin/bash
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx|jsx)$')
if [ -z "$STAGED" ]; then exit 0; fi
# Check for div used as button without role
for file in $STAGED; do
  if grep -nE '<div\s+onClick' "$file" | grep -v 'role=' > /tmp/a11y_violations 2>/dev/null; then
    if [ -s /tmp/a11y_violations ]; then
      echo "  ⚠️  $file — clickable div without role attribute. Use <button> or add role=\"button\""
    fi
  fi
done
rm -f /tmp/a11y_violations
