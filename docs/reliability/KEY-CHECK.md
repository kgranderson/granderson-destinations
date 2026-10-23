# Reliability, key health and property intelligence

## Owner workspace

- `/admin/keys`: latest health results, last 30 runs, stale warning, manual run with 10-minute database cooldown.
- `/admin/analytics`: real monthly performance and matched comparable rentals; CSV imports and optional AirDNA refresh.
- `/admin/optimize`: evidence-based experiments, measured scenarios, optional Claude summary, and action status tracking.

All pages and mutation endpoints reauthenticate the owner. API key values never appear in health results, emails or registry exports. The existing Supabase admin session and legacy owner-cookie login are supported. Removing legacy login after verifying individual owner accounts is recommended.

## Security findings and migration

The live review found authenticated users had table-wide UPDATE on profiles, including `tier`, and active property rows exposed the `ig_access_token` column to anonymous SELECT. One non-null token exists. Values were not retrieved. Treat that token as exposed and rotate it in Meta after the private-storage migration and application rollout; save the replacement in the owner's password manager first. Review administrator accounts for unexpected privilege changes.

`20261023032000_reliability_property_intelligence.sql` narrows profile update grants to safe personal fields, copies provider credentials into `property_integrations`, clears the public token field and prevents it being repopulated. The private table and all new operational tables have RLS and service-role-only grants. Apply the migration and application update in the same maintenance window: the old social deployment cannot use the relocated token. Never roll back by copying tokens into public rows.

The new framework/runtime dependencies are pinned in `package-lock.json`. Next 16 uses async request APIs; affected callers have been migrated. Scroll-reveal content remains visible without JavaScript and above-the-fold content is not delayed by entrance animations. Signed photo proxy URLs prevent arbitrary resource requests, validate image hosts, and keep Google credentials out of redirect requests. Public routes no longer refresh Supabase sessions on every request; protected pages authenticate server-side. Provider clients have bounded request times and public health checks no longer make paid calls. Production dashboards stop replacing missing operating data with synthetic figures; explicit demo mode remains available.

## Key-check behavior

Cron: `50 14 * * *` UTC (07:50 PDT / 06:50 PST). Production only, explicitly enabled, bound to Supabase project `yyhfdqunyufjoyztvcti`. No paid canaries, inference, bookings, messages to guests, pricing writes or key rotation.

22 environment checks plus privately stored property Meta-token presence/expiry:

| Provider | Check |
| --- | --- |
| Supabase public | Auth settings with apikey only; rejects service secrets in the public variable |
| Supabase server | Expected role and private state-table access |
| Anthropic | GET configured model, resolving aliases; does not claim inference was tested |
| ClickUp | User and each configured maintenance list |
| Twilio | Account metadata; never sends SMS |
| Resend | Sender domain; recognizes valid sending-only restricted keys |
| Stripe | Account metadata; configured webhook flagged as unimplemented in existing site |
| Gmail, Hospitable, Meta and internal secrets | Presence only; never claims validity |
| AirDNA, PriceLabs, Perplexity, Google Places/Maps | Skipped: no confirmed free probe; their actual operations have their own errors |

Outcomes: pass, degraded, invalid_auth, permission_or_resource, quota_rate, provider_unavailable, configured, missing, skipped. Required missing variables fail health; optional absent integrations are skipped. Provider requests use fixed HTTPS origins, no redirects/retries, 10-second timeout, three concurrent workers, 50-second run budget and at most 14 calls. Supabase requests have an 8-second timeout. Results contain fixed codes and keyed 8-character version tags, never raw responses or exception text. Retain 90 days.

Alerts go only to kgranderson@mac.com using Resend: on result/version changes, once per Pacific date while unhealthy, and Mondays. A durable notice queue freezes message bodies for safe idempotent retries within 23 hours. A missing state store gets a fixed daily notice. If alert credentials are absent the UI explicitly says alerts are disabled.

## Activation sequence

1. Review the PR and test migration on isolated staging. Apply the migration to production with the coordinated application update. Database changes are separate from Vercel deploys.
2. Owner generates `CRON_SECRET`, `KEY_CHECK_READ_TOKEN`, `KEY_CHECK_VERSION_SALT`, saves in Bitwarden first, then Vercel Production as Sensitive. Do not paste values in chat. Add a sending-only `RESEND_API_KEY` and verified `KEY_CHECK_EMAIL_FROM` for alerts. Set `KEY_CHECK_ENABLED=true` only after tables exist.
3. Per attached playbook, merge only on “Merge PR N”; redeploy only on “redeploy”. Wait after environment saves and reload `/admin/keys` after deployment.
4. Run once, verify deployment ID and each outcome, verify the owner email. Do not interpret skipped/presence-only as working credentials. Confirm the next scheduled run.
5. Install/review the registry adapter and seed metadata described in `registry/README.md`, place the read-token file from Bitwarden at mode 0600, run the existing supervised Hub checker and inspect its dry run before applying.
6. Rotate the exposed Meta token, update it through the owner settings, and confirm posting access manually. No provider keys were rotated during implementation.

Rollback: unset KEY_CHECK_ENABLED; disable paid refresh/analysis if needed. Revert application features only after preserving the private-credential reader. Do not restore the vulnerable grants or public-token layout.

## Analytics contract and limits

Actuals: completed months only, USD lodging revenue excluding taxes, deposits and pass-through cleaning; booked nights / sellable available nights; ADR = revenue / booked nights; RevPAR = revenue / available nights. Zero bookings is distinct from missing data. Imports validate the whole file before writes. Example CSVs contain illustrative values and must be replaced.

AirDNA uses the documented Enterprise v2 Rentalizer estimate endpoint with an exact owner-entered address, beds, baths and capacity. An API-enabled AirDNA plan is required. One explicit refresh per property per day, 20-second timeout, bounded response, no automatic polling/retry. The address goes to AirDNA and is not retained in the benchmark. A failed request preserves the last snapshot. CSV comparables work without a vendor subscription.

Comparison uses matching months, USD, entire homes within 10 km, bedrooms within one and capacity within two; duplicate listings excluded. Directional recommendations require at least three comparable rentals and three completed months, benchmark fetch <=45 days old and actuals <=60 days behind. AirDNA doesn't supply monthly available nights in this response: calendar days approximate that denominator and are labeled. Check amenities, pool, finish quality, neighborhood and market seasonality manually. AirDNA forecasts are never presented as actual comparable history. This is not an appraisal or a guaranteed revenue forecast.

Thinking runs on owner request with a 10-minute cooldown. Deterministic metrics generate actions first; optional Claude adds a short explanation using aggregates only, no guest data. AI failure falls back to calculated guidance. Evidence hashes invalidate summaries when the input changes. No price, listing or advertisement is changed automatically. Scenarios overlap and must not be added together.

Production review found zero occupancy and monthly-financial rows; import real records before relying on the dashboard. AirDNA and the new checker/alert variables were not configured at review time. Live provider checks and registry health sync require activation, so no successful checks have been fabricated.

## Recommended next features

1. Booking-pace and pickup curves by stay date, with event-aware alerts and owner-approved rate experiments.
2. Net contribution by channel, including platform fees, cleaning, utilities and maintenance; optimize profit rather than occupancy alone.
3. Direct-booking funnel analytics (search, availability, inquiry, checkout, confirmed stay), consent-aware attribution and conversion experiments.
4. Verified guest-review themes and maintenance recurrence linked to each property, with a measurable resolution queue.
5. Complete the existing Stripe webhook/booking flow with signed events, idempotency and reconciliation before accepting direct payments.
6. Automated backups with restore drills, uptime monitoring and measured Core Web Vitals. Verify the custom-domain/DNS assignment: the reviewed Vercel project listed only Vercel aliases.

## Validation

Run `npm ci --ignore-scripts`, `npm test`, `npm run lint`, `npm run build`, then `node scripts/smoke.mjs`. CI executes these without production secrets. Tests cover financial math, data quality, CSV validation, provider error mapping/redaction, production gates, profile escalation prevention, private-token isolation and database leases. Activation also requires signed-out route checks, owner-login checks, current deployment/run ID confirmation and a first-day provider correction cycle.
