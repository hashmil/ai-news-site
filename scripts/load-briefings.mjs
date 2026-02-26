import fs from 'fs';
import path from 'path';

const DATA_DIR = '/home/clawdbot/.openclaw/workspace-ai-news/data';
const OUT_FILE = path.join(import.meta.dirname, '../src/data/briefings.json');

function parseBriefing(text, date) {
  const lines = text.split('\n');
  let title = '';
  const sections = [];
  let currentSection = null;
  let currentStory = null;

  function flushStory() {
    if (currentStory && currentSection) {
      currentStory.description = currentStory.description.trim();
      currentSection.stories.push(currentStory);
      currentStory = null;
    }
  }

  function flushSection() {
    flushStory();
    if (currentSection) sections.push(currentSection);
    currentSection = null;
  }

  function classifySection(heading) {
    const h = heading.toUpperCase();
    if (h.includes('TOP') || h.includes('STORIES')) return 'top10';
    if (h.includes('VIRAL')) return 'viral';
    if (h.includes('ADVERTIS') || h.includes('AD ')) return 'ads';
    return 'other';
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (trimmed === '---') continue;

    // Title: # AI Tech Brief ... or just start with emoji
    if ((trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) ||
        (trimmed.startsWith('🤖') && !title)) {
      title = trimmed.replace(/^#\s+/, '').replace(/^🤖\s*/, '');
      continue;
    }

    // Section: ## 📰 TOP 10 ... or just start with emoji
    if (trimmed.startsWith('## ') || 
        (trimmed.startsWith('📰') && !currentSection) ||
        (trimmed.startsWith('🔥') && !currentSection) ||
        (trimmed.startsWith('📢') && !currentSection)) {
      flushSection();
      const heading = trimmed.replace(/^##\s+/, '');
      currentSection = {
        type: classifySection(heading),
        heading,
        stories: [],
      };
      continue;
    }

    // Story patterns
    // New format: 1. **Headline**
    const newFmt = trimmed.match(/^(\d+)\.\s+\*\*([^*]+)\*\*/);
    // Old format: **1. Headline**
    const oldFmt = trimmed.match(/^\*\*(\d+)\.\s+([^*]+)\*\*/);
    // H3 format: ### 1. Headline (numbered) or ### Headline (unnumbered, for viral/ads)
    const h3Fmt = trimmed.match(/^###\s+(\d+)\.\s+(.+)/);
    const h3BulletFmt = !h3Fmt && trimmed.match(/^###\s+(.+)/);
    // Bullet: - **Headline** or * **Headline**
    // Exclude metadata lines like - **Source:**, - **URL:**, - **Keywords:**
    const isMetaLine = /^[-*]\s+\*\*(Source|URL|Keywords|Links?|Reference|Read more):?\*\*/i.test(trimmed);
    const bulletFmt = !isMetaLine && trimmed.match(/^[-*]\s+\*\*([^*]+)\*\*/);
    // Old bullet without dash: **Headline** (no number, used in old viral/ads)
    const oldBulletFmt = !newFmt && !oldFmt && !h3Fmt && !bulletFmt &&
      trimmed.match(/^\*\*([^*]+)\*\*\s*$/);

    const storyMatch = newFmt || oldFmt || h3Fmt;
    if (storyMatch) {
      flushStory();
      currentStory = {
        number: storyMatch[1],
        headline: storyMatch[2].trim(),
        description: '',
        url: '',
      };
      continue;
    }

    if (bulletFmt || h3BulletFmt || (oldBulletFmt && currentSection)) {
      flushStory();
      const headline = bulletFmt ? bulletFmt[1] : h3BulletFmt ? h3BulletFmt[1] : oldBulletFmt[1];
      currentStory = {
        number: '•',
        headline: headline.trim(),
        description: '',
        url: '',
      };
      continue;
    }

    // URL line — handle bare URLs, 🔗 prefixed, - **URL:** prefixed, angle-bracketed, Link: prefixed, or (URL) wrapped
    const urlLine = trimmed
      .replace(/^[-*]\s+\*\*URL:?\*\*:?\s*/i, '')
      .replace(/^Link:?\s*/i, '')
      .replace(/^🔗\s*/, '')
      .replace(/^\(/, '')
      .replace(/\)$/, '')
      .replace(/^</, '')
      .replace(/>$/, '');

    if (urlLine.match(/^https?:\/\//)) {
      if (currentStory && !currentStory.url) {
        currentStory.url = urlLine;
      }
      continue;
    }

    // Sources line
    if (trimmed.startsWith('*Sources:') || trimmed.startsWith('*Compiled')) {
      continue;
    }

    // Description text
    if (currentStory) {
      currentStory.description += (currentStory.description ? ' ' : '') + trimmed;
    }
  }

  flushSection();

  return { date, title, sections };
}

// Find all YYYY-MM-DD.md files
const files = fs.readdirSync(DATA_DIR)
  .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  .sort()
  .reverse();

const briefings = files.map(f => {
  const date = f.replace('.md', '');
  const text = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
  return parseBriefing(text, date);
});

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(briefings, null, 2));
console.log(`Loaded ${briefings.length} briefings → ${OUT_FILE}`);
