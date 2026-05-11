import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import * as XLSX from 'xlsx';
import { withAdmin } from '@/lib/auth/admin';
import { getAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Imports a trailing-12 (or longer) P&L from CSV or Excel.
 *
 * Accepts multipart/form-data with:
 *   - file:           CSV or XLSX file
 *   - propertySlug:   string (auto-detected from CSV if column present)
 *   - mode:           'append' (default) or 'replace-all-history'
 *
 * Expected columns (CSV header row or XLSX first row):
 *   month             YYYY-MM
 *   revenue           number (optional — if present, treated as gross rev for the month)
 *   expense           number (optional — present when category is set)
 *   category          string (required for expense rows; empty for revenue rows)
 *   property_slug     string (optional override; falls back to propertySlug form field)
 *
 * Alternative wide-format input (one row per month, columns are categories):
 *   month | revenue | Cleaning | Property management | Utilities | ...
 *   2025-07 | 52400 | 6030 | 4192 | 2882 | ...
 *
 * Either shape works — we detect by looking at the header row.
 */
export const POST = withAdmin(async (request) => {
  let form;
  try {
    form = await request.formData();
  } catch (err) {
    return NextResponse.json({ error: `bad form: ${err.message}` }, { status: 400 });
  }

  const file = form.get('file');
  const propertySlug = (form.get('propertySlug') || '').toString();
  const mode = (form.get('mode') || 'append').toString();

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file missing' }, { status: 400 });
  }
  if (!propertySlug) {
    return NextResponse.json({ error: 'propertySlug missing' }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'admin client unavailable' }, { status: 500 });
  }

  // ---------- Parse the workbook ----------
  let sheet;
  try {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(ab), { type: 'array' });
    const sheetName = wb.SheetNames[0];
    sheet = wb.Sheets[sheetName];
  } catch (err) {
    return NextResponse.json({ error: `parse failed: ${err.message}` }, { status: 400 });
  }

  // Convert to array-of-objects keyed by header row
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (!rawRows.length) {
    return NextResponse.json({ error: 'no data rows' }, { status: 400 });
  }

  // Normalize keys: lowercase, strip whitespace
  const normalizeKey = (k) => String(k).trim().toLowerCase();
  const norm = rawRows.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) out[normalizeKey(k)] = v;
    return out;
  });

  // ---------- Detect shape: long vs wide ----------
  const headers = Object.keys(norm[0]);
  const looksLong = headers.includes('category') || headers.includes('type');
  const dbRows = looksLong ? parseLong(norm, propertySlug) : parseWide(norm, propertySlug);

  if (!dbRows.rows.length) {
    return NextResponse.json({ error: `no valid rows parsed`, errors: dbRows.errors }, { status: 400 });
  }
  if (dbRows.errors.length) {
    return NextResponse.json(
      { error: `${dbRows.errors.length} validation errors`, errors: dbRows.errors.slice(0, 20) },
      { status: 400 },
    );
  }

  // ---------- Resolve property slug → uuid ----------
  const { data: prop, error: propErr } = await supabase
    .from('properties')
    .select('id, slug, name')
    .eq('slug', propertySlug)
    .maybeSingle();
  if (propErr || !prop) {
    return NextResponse.json(
      { error: `property "${propertySlug}" not found. Run seed:properties.` },
      { status: 400 },
    );
  }

  // ---------- Stamp property_id on every row ----------
  const stamped = dbRows.rows.map((r) => ({ ...r, property_id: prop.id, source: 'csv-import' }));

  // ---------- Replace existing rows per (property_id, month) ----------
  const touched = new Set(stamped.map((r) => r.month));
  if (mode === 'replace-all-history') {
    const { error } = await supabase.from('monthly_financials').delete().eq('property_id', prop.id);
    if (error) return NextResponse.json({ error: `wipe failed: ${error.message}` }, { status: 500 });
  } else {
    for (const month of touched) {
      const { error } = await supabase
        .from('monthly_financials')
        .delete()
        .eq('property_id', prop.id)
        .eq('month', month);
      if (error) return NextResponse.json({ error: `wipe ${month} failed: ${error.message}` }, { status: 500 });
    }
  }

  // ---------- Bulk insert ----------
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < stamped.length; i += CHUNK) {
    const slice = stamped.slice(i, i + CHUNK);
    const { error } = await supabase.from('monthly_financials').insert(slice);
    if (error) return NextResponse.json({ error: `insert failed at ${i}: ${error.message}` }, { status: 500 });
    inserted += slice.length;
  }

  // ---------- Bust cache so /economics shows new data immediately ----------
  revalidateTag('economics');
  revalidateTag(`economics:${propertySlug}`);

  return NextResponse.json({
    ok: true,
    propertySlug,
    propertyName: prop.name,
    monthsTouched: touched.size,
    rowsInserted: inserted,
  });
});

// =============================================================
// Parsers
// =============================================================

/**
 * Long format: one row per (month × line item).
 *   month, type ('revenue'|'expense'), category, amount  (or revenue/expense columns)
 */
function parseLong(norm, slugFallback) {
  const rows = [];
  const errors = [];
  norm.forEach((r, i) => {
    const ln = i + 2;
    const month = normalizeMonth(r.month);
    if (!month) {
      errors.push(`L${ln}: bad month "${r.month}"`);
      return;
    }
    const type = (r.type || (r.category ? 'expense' : 'revenue')).toString().toLowerCase();
    const slug = (r.property_slug || slugFallback || '').toString();
    if (slug && slugFallback && slug !== slugFallback) {
      errors.push(`L${ln}: property_slug "${slug}" does not match upload target "${slugFallback}"`);
      return;
    }
    if (type === 'revenue') {
      const amount = toNumber(r.amount ?? r.revenue);
      if (!Number.isFinite(amount)) {
        errors.push(`L${ln}: revenue amount not a number`);
        return;
      }
      rows.push({ month, revenue: amount, expense: 0, expense_category: null });
    } else if (type === 'expense') {
      const amount = toNumber(r.amount ?? r.expense);
      const category = (r.category || '').toString().trim();
      if (!category) {
        errors.push(`L${ln}: expense row missing category`);
        return;
      }
      if (!Number.isFinite(amount)) {
        errors.push(`L${ln}: expense amount not a number`);
        return;
      }
      rows.push({ month, revenue: 0, expense: amount, expense_category: category });
    } else {
      errors.push(`L${ln}: bad type "${r.type}"`);
    }
  });
  return { rows, errors };
}

/**
 * Wide format: one row per month, columns are category buckets.
 *   month, revenue, <category 1>, <category 2>, ...
 */
function parseWide(norm, slugFallback) {
  const rows = [];
  const errors = [];
  const RESERVED = new Set(['month', 'revenue', 'property_slug', 'notes']);
  norm.forEach((r, i) => {
    const ln = i + 2;
    const month = normalizeMonth(r.month);
    if (!month) {
      errors.push(`L${ln}: bad month "${r.month}"`);
      return;
    }
    const slug = (r.property_slug || slugFallback || '').toString();
    if (slug && slugFallback && slug !== slugFallback) {
      errors.push(`L${ln}: property_slug "${slug}" does not match upload target "${slugFallback}"`);
      return;
    }
    if (r.revenue != null) {
      const amount = toNumber(r.revenue);
      if (Number.isFinite(amount)) {
        rows.push({ month, revenue: amount, expense: 0, expense_category: null });
      }
    }
    for (const [k, v] of Object.entries(r)) {
      if (RESERVED.has(k)) continue;
      if (v == null || v === '') continue;
      const amount = toNumber(v);
      if (!Number.isFinite(amount)) {
        errors.push(`L${ln}: column "${k}" is not a number: "${v}"`);
        continue;
      }
      rows.push({ month, revenue: 0, expense: amount, expense_category: k });
    }
  });
  return { rows, errors };
}

function normalizeMonth(v) {
  if (!v) return null;
  // Accept YYYY-MM or any value that XLSX may have given us as a date number
  if (typeof v === 'number') {
    // Excel serial date — convert
    const d = XLSX.SSF.parse_date_code(v);
    if (d && d.y && d.m) return `${d.y}-${String(d.m).padStart(2, '0')}`;
    return null;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // Accept YYYY-MM-DD too — keep YYYY-MM only
  const m = s.match(/^(\d{4})-(\d{2})-?\d{0,2}$/);
  if (m) return `${m[1]}-${m[2]}`;
  // Accept "Jul 2025" / "July 2025"
  const date = new Date(`${s} 01`);
  if (!Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
}

function toNumber(v) {
  if (v == null || v === '') return NaN;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/[$,()]/g, '').trim();
  // Parens = negative (accountants' convention)
  if (String(v).includes('(') && String(v).includes(')')) return -Math.abs(Number(cleaned));
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
