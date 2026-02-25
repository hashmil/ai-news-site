#!/usr/bin/env bash
set -euo pipefail

SITE_DIR="/home/clawdbot/projects/ai-news-site"
SKILL_DIR="/home/clawdbot/.openclaw/skills/here-now"
SLUG="sleek-shrine-vg8p"

cd "$SITE_DIR"

echo "==> Loading briefings..."
node scripts/load-briefings.mjs

echo "==> Fetching OG images..."
node scripts/fetch-og-images.mjs

echo "==> Building Astro site..."
npx astro build

echo "==> Publishing to here.now..."
"$SKILL_DIR/scripts/publish.sh" dist/ --slug "$SLUG" --api-key "${HERENOW_API_KEY:-}"

echo "https://${SLUG}.here.now/"
