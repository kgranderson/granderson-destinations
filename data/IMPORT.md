# Importing real financial data

The `/economics` dashboard reads from Supabase's `monthly_financials` table. Until that table has rows, it falls back to synthetic seed data so the dashboard looks complete during development.

This guide walks you through replacing the seed with your real Rent Manager exports.

## One-time setup: seed the `properties` table

Run this once. It upserts the in-memory `PROPERTIES` array (from `src/lib/constants.js`) into Supabase's `properties` table so financial rows can be foreign-keyed to a real UUID:

```bash
cd "/Users/kwamegranderson/Desktop/Claude Sandbox/Granderson Destinations/Granderson Destinations/granderson-destinations"

# Put these two values in your shell or use a .env.local + a tool like dotenvx
export NEXT_PUBLIC_SUPABASE_URL="https://yyhfdqunyufjoyztvcti.supabase.co"  # your project URL
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."                              # the service_role JWT

npm run seed:properties
```

You should see:

```
Upserting 2 properties …
  ✓ palm-springs                <uuid>  Casa del Sol
  ✓ san-miguel-de-allende       <uuid>  Casa Talavera
Done.
```

Re-run any time you change `PROPERTIES` in `constants.js` — the script upserts on `slug`.

## Export your data from Rent Manager

For each property:

1. **Reports → Profit & Loss Statement** (or **Income Statement**)
2. Date range: 24 months ending last completed month
3. Filter: Property = Casa del Sol (then repeat for Casa Talavera)
4. Export to CSV or Excel
5. If Excel: open in Numbers or Excel, then **File → Export As → CSV**

If Rent Manager won't export 24 months at once, export by quarter or month and concatenate.

## Reshape into the flat CSV format

Open `data/financials-template.csv` for the expected shape. One row per (property × month × line item).

| Column | Format | Notes |
|---|---|---|
| `property_slug` | `palm-springs` or `san-miguel-de-allende` | Must match a slug in `PROPERTIES` |
| `month` | `YYYY-MM` | e.g. `2025-07` |
| `type` | `revenue` or `expense` | Lowercase |
| `category` | Free text, e.g. `Cleaning` | Empty for revenue rows; required for expense rows |
| `amount` | Number | No `$`, no commas — `52400` not `$52,400` |

**Pro tip:** the easiest path is a Google Sheet with these 5 columns. Use a `SUMIFS` or pivot table to roll Rent Manager line items into the 11 categories the dashboard recognizes (or invent your own — the donut chart adapts to whatever categories you use).

Suggested categories (mirrors what the synthetic seed uses):

- Cleaning
- Property management
- Utilities
- Pool & landscaping  *(or Gardener & courtyard for SMA)*
- Maintenance
- Insurance
- Property tax
- Lodging tax remitted
- Marketing & OTA fees
- Supplies & restock
- Concierge

You can rename, merge, or split these — the dashboard groups by whatever values appear in the `expense_category` column.

## Import

```bash
npm run import:financials -- data/your-export.csv
```

Output:

```
Parsed 528 rows from CSV.
Replacing rows for 48 (property, month) tuples …
  ✓ inserted 500/528
  ✓ inserted 528/528

Done. /economics will now show real data within 10 minutes (cache TTL).
```

**Re-running is safe.** The script wipes existing rows for every (property, month) tuple in your CSV before inserting, so you can fix data errors and re-import without duplicates.

## Verify

1. Wait 10 minutes (cache TTL on `loadMonthly`) — or trigger a Vercel redeploy to bust the cache immediately
2. Open `https://granderson-destinations.vercel.app/economics/palm-springs`
3. The badges at top should change:
   - Was: "Synthetic data · Stub AirDNA"
   - Now: "Stub AirDNA" (synthetic badge gone)
4. The KPI numbers should match your real Rent Manager totals
5. Expense flags should reflect real anomalies in your operating history

## Rolling future months in

Two options:

**A. Manual monthly:** Each month, export the new month from Rent Manager, append to a CSV with just that month's rows, run `npm run import:financials -- new-month.csv`. The script's "wipe-and-insert per (property, month)" logic means new months don't disturb old ones.

**B. Automated (future):** Build a Rent Manager export connector that runs nightly via Vercel cron. Out of scope for M6 — flag for M8.

## Pulling Rent Manager data live (future)

Rent Manager has a REST API. A future milestone (M8?) wires `lib/rent-manager/client.js` to pull P&L directly, eliminating the CSV step. For now, manual CSV is the operating mode.

## If something goes wrong

- `Properties not in Supabase: palm-springs` → you haven't run `npm run seed:properties` yet
- `Missing env: NEXT_PUBLIC_SUPABASE_URL` → set the two env vars in your shell before running
- `CSV has 12 validation errors` → the script prints up to 20 line numbers; fix in your spreadsheet and re-run
- Dashboard still shows "Synthetic data" badge after import → cache hasn't expired yet (wait 10 min) or you didn't run `seed:properties` first

Ping me with the error and I'll diagnose.
