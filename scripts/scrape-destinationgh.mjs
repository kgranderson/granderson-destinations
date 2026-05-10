#!/usr/bin/env node
/**
 * Pulls Palm Springs + San Miguel content + images off destinationgh.com.
 *
 * Usage: node scripts/scrape-destinationgh.mjs
 *
 * Produces:
 *   /public/properties/palm-springs/*.jpg
 *   /public/properties/san-miguel-de-allende/*.jpg
 *   /supabase/seed/properties.json
 *
 * This is intentionally network-light and dependency-free so it can
 * run inside the Vercel build sandbox.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCES = {
  'palm-springs': [
    'https://destinationgh.com/properties/palm-springs/',
  ],
  'san-miguel-de-allende': [
    'https://destinationgh.com/properties/san-miguel-de-allende/',
  ],
};

function extractImgUrls(html) {
  const re = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
  const out = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = m[1].startsWith('http') ? m[1] : new URL(m[1], 'https://destinationgh.com').toString();
    out.add(url);
  }
  return [...out];
}

function extractText(html, selector) {
  // crude — pulls innerText-ish content of the first matching tag
  const re = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
  const m = html.match(re);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function downloadImage(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buf);
}

async function main() {
  const seed = {};
  for (const [slug, urls] of Object.entries(SOURCES)) {
    const outDir = path.join(ROOT, 'public', 'properties', slug);
    await fs.mkdir(outDir, { recursive: true });
    const collected = { slug, images: [], title: null, description: null };

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'GrandersonScrape/2.0' } });
        if (!res.ok) {
          console.warn(`Skipping ${url}: ${res.status}`);
          continue;
        }
        const html = await res.text();
        collected.title ||= extractText(html, 'h1');
        collected.description ||= extractText(html, 'p');
        const imgs = extractImgUrls(html).filter((u) => !u.includes('placeholder'));
        for (let i = 0; i < imgs.length; i++) {
          const ext = path.extname(new URL(imgs[i]).pathname) || '.jpg';
          const local = path.join(outDir, `${slug}-${String(i).padStart(2, '0')}${ext}`);
          try {
            await downloadImage(imgs[i], local);
            collected.images.push(`/properties/${slug}/${path.basename(local)}`);
            console.log(`  ✓ ${imgs[i]}`);
          } catch (err) {
            console.warn(`  × ${imgs[i]}: ${err.message}`);
          }
        }
      } catch (err) {
        console.warn(`Error scraping ${url}:`, err.message);
      }
    }

    seed[slug] = collected;
  }

  const seedDir = path.join(ROOT, 'supabase', 'seed');
  await fs.mkdir(seedDir, { recursive: true });
  await fs.writeFile(path.join(seedDir, 'properties.json'), JSON.stringify(seed, null, 2));
  console.log('\nWrote supabase/seed/properties.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
