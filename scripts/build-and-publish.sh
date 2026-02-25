#!/usr/bin/env bash
set -euo pipefail

SITE_DIR="/home/clawdbot/projects/ai-news-site"
cd "$SITE_DIR"

echo "==> Loading briefings..."
node scripts/load-briefings.mjs

echo "==> Fetching OG images..."
node scripts/fetch-og-images.mjs

echo "==> Committing data and pushing to GitHub..."
git add src/data/briefings.json src/data/image-map.json
if git diff --cached --quiet; then
  echo "No data changes to commit."
else
  git commit -m "Update briefings $(date -u +%Y-%m-%d)"
  git push origin main
  echo "Pushed to GitHub — Cloudflare Pages will auto-deploy."
fi
