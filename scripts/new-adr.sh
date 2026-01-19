#!/usr/bin/env bash
set -euo pipefail

TITLE="${1:-}"
if [ -z "$TITLE" ]; then
  echo "Usage: scripts/new-adr.sh \"title\""
  exit 1
fi

mkdir -p docs/adr

# Find next ADR number
LAST=$(ls docs/adr 2>/dev/null | grep -E '^[0-9]{4}-' | sort | tail -n 1 | cut -d- -f1 || true)
if [ -z "$LAST" ]; then
  NEXT="0001"
else
  NEXT=$(printf "%04d" $((10#$LAST + 1)))
fi

SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-|-$//g')
FILE="docs/adr/${NEXT}-${SLUG}.md"

cat > "$FILE" <<EOF
# ADR ${NEXT}: ${TITLE}

## Context
What problem are we solving? What constraints exist?

## Decision
What did we decide?

## Alternatives considered
- Option A:
- Option B:

## Consequences
What gets easier/harder because of this decision?
EOF

echo "Created $FILE"
