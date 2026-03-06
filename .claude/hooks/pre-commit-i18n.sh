#!/bin/bash
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx|jsx)$')
if [ -z "$STAGED" ]; then exit 0; fi
VIOLATIONS=0
for file in $STAGED; do
  # Find string literals in JSX that aren't in t() calls, className, data-testid, etc.
  if grep -nE '>\s*[A-Z][a-z]+(\s+[a-z]+)+\s*<' "$file" | grep -vE '(className|data-testid|aria-|console\.)' > /tmp/i18n_violations 2>/dev/null; then
    if [ -s /tmp/i18n_violations ]; then
      echo "  ⚠️  $file — possible untranslated string:"
      cat /tmp/i18n_violations | head -3
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done
rm -f /tmp/i18n_violations
if [ $VIOLATIONS -gt 0 ]; then
  echo "⚠️  $VIOLATIONS file(s) may have untranslated strings. Use t() wrapper."
fi
