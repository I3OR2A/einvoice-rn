#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/build_release.sh v1.0.0
#   ./scripts/build_release.sh   (will use current tag if HEAD is tagged, else latest tag)
#
# Output:
#   dist/einvoice-rn-v1.0.0.zip

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Determine tag
TAG="${1:-}"

if [[ -z "$TAG" ]]; then
  # If HEAD is exactly at a tag, use it; otherwise use latest tag
  TAG="$(git describe --tags --exact-match 2>/dev/null || true)"
  if [[ -z "$TAG" ]]; then
    TAG="$(git describe --tags --abbrev=0 2>/dev/null || true)"
  fi
fi

if [[ -z "$TAG" ]]; then
  echo "❌ No tag found. Please pass a tag, e.g. ./scripts/build_release.sh v1.0.0"
  exit 1
fi

# Validate tag exists
if ! git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "❌ Tag '${TAG}' does not exist."
  exit 1
fi

VERSION="${TAG#v}" # strip leading v if present

OUT_DIR="${ROOT_DIR}/dist"
mkdir -p "$OUT_DIR"

OUT_ZIP="${OUT_DIR}/einvoice-rn-v${VERSION}.zip"
PREFIX="einvoice-rn-v${VERSION}/"

echo "📦 Building release zip from tag: ${TAG}"
echo "➡️  Output: ${OUT_ZIP}"

# Reproducible source archive from git tree at tag
git archive \
  --format=zip \
  --prefix="${PREFIX}" \
  -o "${OUT_ZIP}" \
  "${TAG}"

echo "✅ Done: ${OUT_ZIP}"
