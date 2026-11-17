#!/usr/bin/env bash
# Builds the site for GitHub Pages (served from /<repo>/) and publishes dist/ to the gh-pages branch.
# Usage: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_NAME="$(basename -s .git "$(git remote get-url origin)")"
BASE_PATH="/${REPO_NAME}/" npm run build
touch dist/.nojekyll
TMP="$(mktemp -d)"
cp -R dist/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git config user.name "$(git -C "$OLDPWD" config user.name)"
git config user.email "$(git -C "$OLDPWD" config user.email)"
git add -A
git commit -q -m "Deploy $(git -C "$OLDPWD" rev-parse --short HEAD)"
git push -q -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
echo "Published gh-pages for ${REPO_NAME}"
