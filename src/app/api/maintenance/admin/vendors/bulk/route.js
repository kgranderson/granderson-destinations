import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { parseVendorSpreadsheet } from '@/lib/maintenance/vendor-csv';
import { MAINTENANCE_CATEGORIES, PROPERTIES } from '@/lib/constants';

/**
 * POST /api/maintenance/admin/vendors/bulk
 *   Accepts a CSV or XLSX file as multipart/form-data under field "file".
 *
 * Behavior:
 *   - Parses the spreadsheet using lib/maintenance/vendor-csv.js.
 *   - For each row with an email that already exists in maintenance_vendors,
 *     UPDATES the existing row (idempotent re-uploads).
 *   - For each new row, INSERTs.
 *   - Returns a summary with counts + per-row errors and warnings so the
 *     admin can see exactly what happened.
 *
 * Body limit: Vercel serverless allows ~4.5MB by default. A vendor roster
 * spreadsheet is typically <100KB so this is comfortably under the limit.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // give parsing room for larger files

export async function POST(request) {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return NextResponse.json({ error: 'expected multipart/form-data', detail: String(err.message || err) }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded under "file" field.' }, { status: 400 });
  }

  // File-size guard — Vercel will also enforce its own limit but we fail
  // fast with a clearer message.
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 4MB).' }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const parsed = parseVendorSpreadsheet(buffer, {
    allowedSpecialties: MAINTENANCE_CATEGORIES,
    allowedMarkets: PROPERTIES.map((p) => p.slug),
  });
  const { errors, warnings } = parsed;

  // Dedupe by email within the spreadsheet itself — last occurrence wins.
  // Without this guard, two rows with the same email would both attempt
  // INSERT since the existingByEmail map is built before the loop runs.
  const seenEmails = new Map();
  const rows = [];
  for (const r of parsed.rows) {
    // Cap notes length at 2000 chars so a runaway cell can't break the insert.
    const capped = { ...r, notes: r.notes ? r.notes.slice(0, 2000) : null };
    if (capped.email) {
      const prevIdx = seenEmails.get(capped.email);
      if (prevIdx != null) {
        rows[prevIdx] = capped; // overwrite earlier row
        warnings.push({
          row: 0,
          warning: `Multiple rows for ${capped.email} in this upload — kept the last occurrence.`,
        });
        continue;
      }
      seenEmails.set(capped.email, rows.length);
    }
    rows.push(capped);
  }

  if (!rows.length) {
    return NextResponse.json({
      inserted: 0,
      updated: 0,
      errors,
      warnings,
      message: 'No valid rows in the file.',
    }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  // Pull existing emails so we can decide insert vs. update per row.
  // For larger rosters this is fine (<10k vendors); at scale we'd batch.
  const emails = rows.filter((r) => r.email).map((r) => r.email);
  let existingByEmail = new Map();
  if (emails.length) {
    const { data: existing } = await supabase
      .from('maintenance_vendors')
      .select('id,email')
      .in('email', emails);
    if (existing) {
      existingByEmail = new Map(existing.map((v) => [v.email, v.id]));
    }
  }

  let inserted = 0;
  let updated = 0;
  const rowErrors = [...errors];

  // Process row-by-row so a single failure doesn't roll back others. For a
  // few hundred rows this is fine; for larger imports we'd batch with
  // upsert-on-conflict once we add a unique constraint on email.
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const existingId = row.email ? existingByEmail.get(row.email) : null;
    if (existingId) {
      const { error: updateErr } = await supabase
        .from('maintenance_vendors')
        .update({
          name: row.name,
          phone: row.phone,
          specialties: row.specialties,
          markets: row.markets,
          notes: row.notes,
          active: row.active,
        })
        .eq('id', existingId);
      if (updateErr) {
        rowErrors.push({ row: i + 2, error: `Update failed for ${row.email}: ${updateErr.message}` });
      } else {
        updated += 1;
      }
    } else {
      const { error: insertErr } = await supabase
        .from('maintenance_vendors')
        .insert(row);
      if (insertErr) {
        rowErrors.push({ row: i + 2, error: `Insert failed for "${row.name}": ${insertErr.message}` });
      } else {
        inserted += 1;
      }
    }
  }

  revalidateTag('maintenance');
  return NextResponse.json({
    inserted,
    updated,
    skipped: rows.length - inserted - updated,
    errors: rowErrors,
    warnings,
    parsed: rows.length,
  });
}
