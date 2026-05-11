#!/usr/bin/env node
/**
 * Imports monthly financials from a CSV into Supabase.
 *
 * CSV format (header row required):
 *   property_slug,month,type,category,amount
 *
 * Example rows:
 *   palm-springs,2024-05,revenue,,52400
 *   palm-springs,2024-05,expense,Cleaning,6030
 *   palm-springs,2024-05,expense,Property management,4192
 *
 * Rules:
 *   - month must be YYYY-MM
 *   - type must be 'revenue' or 'expense'
 *   - for revenue rows, category should be empty
 *   - for expense rows, category is required and free-form (e.g. 'Cleaning')
 *   - amount is a number (no $ or commas — strip them in your spreadsheet first)
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/import-financials.mjs data/your-export.csv
 *
 * Re-running is safe — the script wipes existing rows for any
 * (property_id, month) tuple it sees in the CSV before inserting,
 * so you can re-import after fixing data errors.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/import-financials.mjs <path-to-csv>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

// ---------- Parse CSV ----------
const raw = await fs.readFile(path.resolve(csvPath), 'utf8');
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
const header = lines.shift().split(',').map((h) => h.trim());
const required = ['property_slug', 'month', 'type', 'category', 'amount'];
for (const col of required) {
  if (!header.includes(col)) {
    console.error(`CSV missing required column: ${col}`);
    process.exit(1);
  }
}
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

const rows = [];
const errors = [];
lines.forEach((line, i) => {
  const cells = line.split(',').map((c) => c.trim());
  const slug = cells[idx.property_slug];
  const month = cells[idx.month];
  const type = cells[idx.type];
  const category = cells[idx.category] || null;
  const amount = Number(cells[idx.amount].replace(/[$,]/g, ''));

  const lineNo = i + 2; // +1 for 0-index, +1 for header
  if (!slug) errors.push(`L${lineNo}: missing property_slug`);
  if (!/^\d{4}-\d{2}$/.test(month)) errors.push(`L${lineNo}: bad month "${month}" (need YYYY-MM)`);
  if (!['revenue', 'expense'].includes(type)) errors.push(`L${lineNo}: bad type "${type}"`);
  if (type === 'expense' && !category) errors.push(`L${lineNo}: expense row missing category`);
  if (!Number.isFinite(amount)) errors.push(`L${lineNo}: bad amount "${cells[idx.amount]}"`);
  rows.push({ slug, month, type, category, amount });
});

if (errors.length) {
  console.error(`CSV has ${errors.length} validation errors:`);
  errors.slice(0, 20).forEach((e) => console.error('  ' + e));
  if (errors.length > 20) console.error(`  ... and ${errors.length - 20} more`);
  process.exit(1);
}

console.log(`Parsed ${rows.length} rows from CSV.`);

// ---------- Resolve property slugs → ids ----------
const slugs = [...new Set(rows.map((r) => r.slug))];
const { data: props, error: propErr } = await sb
  .from('properties')
  .select('id, slug')
  .in('slug', slugs);
if (propErr) {
  console.error('Failed to fetch properties:', propErr.message);
  process.exit(1);
}
const slugToId = Object.fromEntries(props.map((p) => [p.slug, p.id]));
const missing = slugs.filter((s) => !slugToId[s]);
if (missing.length) {
  console.error(`Properties not in Supabase: ${missing.join(', ')}`);
  console.error('Run `node scripts/seed-properties.mjs` first.');
  process.exit(1);
}

// ---------- Map to DB rows ----------
const dbRows = rows.map((r) => ({
  property_id: slugToId[r.slug],
  month: r.month,
  revenue: r.type === 'revenue' ? r.amount : 0,
  expense: r.type === 'expense' ? r.amount : 0,
  expense_category: r.type === 'expense' ? r.category : null,
  source: 'csv-import',
}));

// ---------- Wipe + insert per (property_id, month) ----------
const touched = new Set(dbRows.map((r) => `${r.property_id}::${r.month}`));
console.log(`Replacing rows for ${touched.size} (property, month) tuples …`);

for (const key of touched) {
  const [property_id, month] = key.split('::');
  const { error } = await sb
    .from('monthly_financials')
    .delete()
    .eq('property_id', property_id)
    .eq('month', month);
  if (error) {
    console.error(`  ✗ delete ${month} for ${property_id}:`, error.message);
    process.exit(1);
  }
}

const CHUNK = 500;
for (let i = 0; i < dbRows.length; i += CHUNK) {
  const chunk = dbRows.slice(i, i + CHUNK);
  const { error } = await sb.from('monthly_financials').insert(chunk);
  if (error) {
    console.error(`  ✗ insert chunk [${i}..${i + chunk.length}]:`, error.message);
    process.exit(1);
  }
  console.log(`  ✓ inserted ${i + chunk.length}/${dbRows.length}`);
}

console.log(`\nDone. /economics will now show real data within 10 minutes (cache TTL).`);
console.log(`To force-refresh immediately, redeploy or visit /economics with ?bust=1 once we wire it.`);
