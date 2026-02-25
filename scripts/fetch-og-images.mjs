import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const DATA_FILE = path.join(import.meta.dirname, '../src/data/briefings.json');
const CACHE_FILE = path.join(import.meta.dirname, '../src/data/image-map.json');
const CONCURRENCY = 5;
const TIMEOUT = 5000;

function fetchOgImage(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OracleBrief/1.0)' },
      timeout: TIMEOUT,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchOgImage(new URL(res.headers.location, url).href).then(resolve);
        res.resume();
        return;
      }
      let data = '';
      let resolved = false;
      function tryResolve() {
        if (resolved) return;
        resolved = true;
        const match =
          data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
          data.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i) ||
          data.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
        resolve(match ? new URL(match[1].replace(/&amp;/g, '&'), url).href : null);
      }
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 100000) { res.destroy(); tryResolve(); }
      });
      res.on('end', tryResolve);
      res.on('close', tryResolve);
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

async function main() {
  const briefings = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};

  // Collect all URLs that need fetching
  const toFetch = [];
  for (const b of briefings) {
    for (const s of b.sections) {
      for (const story of s.stories) {
        if (story.url && !(story.url in cache)) {
          toFetch.push(story.url);
        }
      }
    }
  }

  console.log(`Cache: ${Object.keys(cache).length} entries, ${toFetch.length} new URLs to fetch`);

  if (toFetch.length > 0) {
    const tasks = toFetch.map(url => async () => {
      const img = await fetchOgImage(url);
      console.log(`  ${img ? '✓' : '✗'} ${url.substring(0, 60)}...`);
      return { url, img };
    });

    const results = await runWithConcurrency(tasks, CONCURRENCY);
    for (const { url, img } of results) {
      cache[url] = img;
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`Image map: ${Object.keys(cache).length} total entries → ${CACHE_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
