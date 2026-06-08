#!/usr/bin/env sh
# Build a PKZip archive of the repository root, excluding .env and any node_modules tree.
# Output defaults to the parent directory: ../<repo-name>-YYYYMMDD-HHMMSS.zip
# Override destination: ZIP_OUT=/path/to/out.zip ./scripts/zip-project.sh
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$(basename "$ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEFAULT_OUT="$(dirname "$ROOT")/${NAME}-${STAMP}.zip"
OUT="${ZIP_OUT:-$DEFAULT_OUT}"

if ! command -v zip >/dev/null 2>&1; then
    echo "zip(1) is required but was not found in PATH." >&2
    exit 1
fi

cd "$ROOT" || exit 1
mkdir -p "$(dirname "$OUT")"

TMP_LIST="$(mktemp "${TMPDIR:-/tmp}/${NAME}.zip-list.XXXXXX")"
cleanup() {
    rm -f "$TMP_LIST"
}
trap cleanup EXIT

# Prune every node_modules directory; skip repository root .env only.
find . \( -type d -name node_modules -prune \) -o \( -type d -name Mobile -prune \) -o \( -type d -name DOCs -prune \) -o \( -path ./.env -prune \) -o -type f -print >"$TMP_LIST"

zip -q -r "$OUT" -@ <"$TMP_LIST"

echo "Created: $OUT"
