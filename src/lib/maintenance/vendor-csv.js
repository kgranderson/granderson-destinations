import 'server-only';
import * as XLSX from 'xlsx';

/**
 * Spreadsheet-import helper for the vendor roster.
 *
 * Accepts CSV or XLSX, returns { rows, errors } where each row is a partial
 * vendor record ready to upsert into maintenance_vendors. Errors are
 * row-numbered so the admin can see exactly which line of their spreadsheet
 * had a problem.
 *
 * Expected column headers (case-insensitive, order-independent):
 *   - name             (required)
 *   - phone            (optional, E.164 format like +13107294453)
 *   - email            (optional, but at least one of phone/email recommended)
 *   - specialties      (comma-separated, e.g. "HVAC, Plumbing")
 *   - markets          (comma-separated property slugs, e.g. "palm-springs")
 *   - notes            (optional free-form)
 *   - active           (optional, defaults true; "false" / "no" / "0" → false)
 *
 * Synonyms accepted:
 *   - "category" / "categories" → specialties
 *   - "property" / "properties" → markets
 *   - "contact" → email if it matches an email shape, otherwise phone
 */

const HEADER_ALIASES = {
  name: 'name',
  'vendor name': 'name',
  'business name': 'name',
  'company': 'name',

  phone: 'phone',
  'phone number': 'phone',
  mobile: 'phone',
  cell: 'phone',

  email: 'email',
  'email address': 'email',

  specialties: 'specialties',
  specialty: 'specialties',
  category: 'specialties',
  categories: 'specialties',
  trade: 'specialties',
  trades: 'specialties',

  markets: 'markets',
  market: 'markets',
  property: 'markets',
  properties: 'markets',
  'serves at': 'markets',

  notes: 'notes',
  note: 'notes',

  active: 'active',
};

function normalizeHeader(h) {
  if (!h) return null;
  return HEADER_ALIASES[String(h).trim().toLowerCase()] || null;
}

function splitList(value) {
  if (value == null) return [];
  return String(value)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseActive(value) {
  if (value == null || value === '') return true;
  const s = String(value).trim().toLowerCase();
  return !['false', 'no', '0', 'off', 'inactive'].includes(s);
}

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function normalizePhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/[^\d+]/g, '');
  if (!digits) return null;
  // Already E.164-ish: starts with + and 8-15 digits total
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  // 10 digits → assume US, prepend +1
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  // 11 digits starting with 1 → US, prepend +
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  // Otherwise pass through with a + if missing; caller can decide whether to flag
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Parse a CSV or XLSX file buffer into vendor row candidates.
 *
 * @param {Buffer|Uint8Array} buffer
 * @param {{ allowedSpecialties?: string[], allowedMarkets?: string[] }} [opts]
 * @returns {{ rows: object[], errors: {row: number, error: string}[], warnings: {row: number, warning: string}[] }}
 */
export function parseVendorSpreadsheet(buffer, opts = {}) {
  const allowedSpecialties = (opts.allowedSpecialties || []).map((s) => s.toLowerCase());
  const allowedMarkets = (opts.allowedMarkets || []).map((s) => s.toLowerCase());

  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    return { rows: [], errors: [{ row: 0, error: `Could not parse file: ${err.message || err}` }], warnings: [] };
  }

  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return { rows: [], errors: [{ row: 0, error: 'File has no sheets.' }], warnings: [] };

  // sheet_to_json with raw: false gives strings, header: 1 gives arrays
  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], {
    header: 1,
    raw: false,
    defval: '',
  });
  if (!matrix.length) return { rows: [], errors: [{ row: 0, error: 'Sheet is empty.' }], warnings: [] };

  const headerRow = matrix[0].map(normalizeHeader);
  // Validate header has at minimum a "name" column
  if (!headerRow.includes('name')) {
    return {
      rows: [],
      errors: [{ row: 1, error: 'Missing required "name" column header. Accepted: name, vendor name, business name, company.' }],
      warnings: [],
    };
  }

  const rows = [];
  const errors = [];
  const warnings = [];

  for (let i = 1; i < matrix.length; i += 1) {
    const cells = matrix[i];
    if (!cells || cells.every((c) => c === '' || c == null)) continue; // skip blank lines

    const record = {};
    headerRow.forEach((field, idx) => {
      if (field) record[field] = cells[idx];
    });

    if (!record.name || !String(record.name).trim()) {
      errors.push({ row: i + 1, error: 'Missing name.' });
      continue;
    }

    const phone = normalizePhone(record.phone);
    const email = record.email && isEmail(String(record.email).trim()) ? String(record.email).trim().toLowerCase() : null;
    if (!email && !phone) {
      warnings.push({ row: i + 1, warning: `Vendor "${record.name}" has neither phone nor email; dispatch may not reach them.` });
    }
    if (record.email && !email) {
      warnings.push({ row: i + 1, warning: `"${record.email}" doesn't look like a valid email — saved as null.` });
    }

    const specialties = splitList(record.specialties);
    const markets = splitList(record.markets).map((m) => m.toLowerCase());

    if (allowedSpecialties.length) {
      for (const s of specialties) {
        if (!allowedSpecialties.includes(s.toLowerCase())) {
          warnings.push({ row: i + 1, warning: `Specialty "${s}" isn't in your standard category list.` });
        }
      }
    }
    if (allowedMarkets.length) {
      for (const m of markets) {
        if (!allowedMarkets.includes(m)) {
          warnings.push({ row: i + 1, warning: `Market "${m}" isn't a known property slug.` });
        }
      }
    }

    rows.push({
      name: String(record.name).trim(),
      phone,
      email,
      specialties,
      markets,
      notes: record.notes ? String(record.notes).trim() : null,
      active: parseActive(record.active),
    });
  }

  return { rows, errors, warnings };
}

/**
 * Produce a CSV template string the admin can download to use as a starting
 * point. Includes one example row so the format is unambiguous.
 */
export function vendorCsvTemplate() {
  const headers = ['name', 'phone', 'email', 'specialties', 'markets', 'notes', 'active'];
  const example = [
    "Bill's HVAC",
    '+17605551234',
    'bill@billshvac.com',
    'HVAC, Appliance',
    'palm-springs',
    'Same-day for emergencies; closed Sunday',
    'true',
  ];
  return [headers, example]
    .map((row) =>
      row
        .map((cell) => {
          const needsQuote = /[",\n]/.test(String(cell));
          return needsQuote ? `"${String(cell).replace(/"/g, '""')}"` : String(cell);
        })
        .join(','),
    )
    .join('\n');
}
