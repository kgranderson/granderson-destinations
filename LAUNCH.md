# Granderson Destinations — Launch readiness & DNS cutover

**Status (2026-05-10):** M1–M6 shipped. 4 senior-review blockers from M6 audit closed. Cleared for production cutover from `destinationgh.com` (WordPress / Bluehost) to `granderson-destinations.vercel.app` (Next.js / Vercel).

---

## What's live (recap)

| Surface | Routes | Notes |
| --- | --- | --- |
| **Marketing** | `/`, `/destinations`, `/destinations/[slug]`, `/experiences/[city]`, `/events`, `/events/[slug]`, `/intel`, `/about`, `/contact`, `/legal/*` | 6 top-level + 12 dynamic pages |
| **Admin dashboards** | `/economics`, `/economics/[slug]`, `/social`, `/pricing-engine`, `/pricing-engine/[slug]` | Currently open (synthetic/stub data); locked down in M7 when auth UI ships |
| **API routes** | `/api/health`, `/api/cron`, `/api/intel/refresh`, `/api/social/{generate-caption,publish}`, `/api/pricing/push-overrides`, `/api/places/photo`, `/api/stripe/webhook`, `/api/auth/callback` | Cron + admin routes gated |
| **Sitemap** | `/sitemap.xml` | Public routes only |
| **Robots** | `/robots.txt` | Disallows `/api/*` + `/auth/callback` |

**Live integrations:** Supabase (auth + DB + RLS), Perplexity Sonar (intel feed), Anthropic Claude (captions + concierge), Google Places (hotspot photos + maps).

**Stub mode (M7 work):** PriceLabs, AirDNA, Meta IG Business.

---

## Pre-cutover checklist

Before you flip DNS:

- [ ] `/api/health` returns `"supabase": { "live": true }`, `"perplexity": { "live": true }`, `"anthropic": { "live": true }`, `"googlePlaces": { "live": true, "gotPlaceId": true }`
- [ ] Spot-check the 6 highest-traffic routes in incognito (so no cached state):
  - [ ] `/` — hero renders, marquee scrolls, Stats counters animate
  - [ ] `/destinations/palm-springs` — gallery lightbox works (click any image, then ← → arrows, then ESC)
  - [ ] `/destinations/san-miguel-de-allende` — same
  - [ ] `/experiences/palm-springs` — hotspot cards render with real Google Place Photos (no gradients on the major venues)
  - [ ] `/intel` — Perplexity-fed cards render (no "Editorial fallback" badge)
  - [ ] `/events/coachella-2026-w1` — calculator sliders update revenue projection in real time
- [ ] Vercel Cron secret set (Project → Settings → Cron → Secret)
- [ ] Budget alert active on Google Cloud (Maps API spend cap)
- [ ] CRON_SECRET env var set in Vercel
- [ ] Resize OG default image to 1200×630 (currently 2304×1536)

---

## DNS cutover plan

### Phase 1 — Prep at Vercel (do this 24 hours before flipping DNS)

1. **Add domains in Vercel:**
   - <https://vercel.com/granderson-holdings/granderson-destinations/settings/domains>
   - Click **Add** → enter `destinationgh.com` → Continue
   - Click **Add** again → enter `www.destinationgh.com` → Continue
   - Vercel will show DNS records you need to add at your registrar:
     - `destinationgh.com` → A record to `76.76.21.21` (Vercel's apex IP)
     - `www.destinationgh.com` → CNAME to `cname.vercel-dns.com`

2. **Set production env var** so all canonical URLs, OG images, sitemap entries point at the right host:
   ```
   NEXT_PUBLIC_SITE_URL=https://destinationgh.com
   ```
   Settings → Environment Variables → edit `NEXT_PUBLIC_SITE_URL` → save → trigger a redeploy

3. **Verify the new deploy** still passes `/api/health` from `granderson-destinations.vercel.app` (DNS hasn't flipped yet).

### Phase 2 — Old WordPress URL inventory (do this 24 hours before)

Export the URL map from the existing WordPress site so we can build proper 301 redirects:

1. Sign into Bluehost / WordPress admin
2. Plugins → install **Yoast SEO** (if not already) → Yoast → Tools → Import & Export → export sitemap
3. Or simply browse the site and note these URLs (most common WordPress → custom migration mapping):

| Old WordPress URL | New Next.js URL |
| --- | --- |
| `/about-us/` | `/about` |
| `/about-us` | `/about` |
| `/contact-us/` | `/contact` |
| `/contact-us` | `/contact` |
| `/properties/` | `/destinations` |
| `/properties/casa-del-sol/` | `/destinations/palm-springs` |
| `/properties/casa-talavera/` | `/destinations/san-miguel-de-allende` |
| `/blog/*` | `/intel` (until blog ships) |
| `/wp-admin/*` | `/` (block old admin) |
| `/wp-content/*` | (let 404 — assets aren't referenced by new site) |

Add these to `next.config.js`:

```js
async redirects() {
  return [
    { source: '/about-us', destination: '/about', permanent: true },
    { source: '/about-us/:path*', destination: '/about', permanent: true },
    { source: '/contact-us', destination: '/contact', permanent: true },
    { source: '/contact-us/:path*', destination: '/contact', permanent: true },
    { source: '/properties', destination: '/destinations', permanent: true },
    { source: '/properties/casa-del-sol', destination: '/destinations/palm-springs', permanent: true },
    { source: '/properties/casa-talavera', destination: '/destinations/san-miguel-de-allende', permanent: true },
    { source: '/blog', destination: '/intel', permanent: true },
    { source: '/blog/:path*', destination: '/intel', permanent: true },
    { source: '/wp-admin/:path*', destination: '/', permanent: true },
  ];
}
```

Push the change, redeploy.

### Phase 3 — Cut DNS (the actual flip)

1. **Lower the TTL** at your registrar 24 hours BEFORE the cutover. Set TTL to 5 minutes (300s) on the existing Bluehost A records. This lets propagation finish in minutes once you flip rather than hours.

2. **At your DNS registrar** (likely Bluehost domain panel, or wherever destinationgh.com nameservers point):
   - Find the A record for `destinationgh.com` (root domain) → change value to `76.76.21.21`
   - Find the CNAME for `www` → change value to `cname.vercel-dns.com`
   - Delete any other A/CNAME records pointing at Bluehost servers

3. **Watch propagation:**
   - <https://dnschecker.org/#A/destinationgh.com> — refresh every minute, you'll see green checkmarks roll across global DNS resolvers
   - Most resolvers update within 5–15 minutes; some stragglers take 1–4 hours

4. **In Vercel** (Domains panel) — watch for the SSL certificate provisioning. Vercel auto-issues a Let's Encrypt cert once DNS resolves. Status will go from "Pending" → "Valid Configuration" → "Active." Usually 2–10 minutes.

5. **Once both domains show "Active" with green checkmarks in Vercel, the site is live at destinationgh.com.**

### Phase 4 — Post-cutover (first hour)

- [ ] Open `https://destinationgh.com/` in incognito — should load the new site
- [ ] Open `https://www.destinationgh.com/` — should redirect to apex (Vercel handles this)
- [ ] Open `https://destinationgh.com/api/health` — confirm all 4 integrations still live
- [ ] Test the old WordPress URLs you mapped above — each should 301 to the new path:
  - `https://destinationgh.com/about-us` → `/about` ✓
  - `https://destinationgh.com/properties` → `/destinations` ✓
- [ ] Verify SSL: padlock icon in browser, cert issued by Let's Encrypt / Google Trust Services
- [ ] Run Google's Rich Results Test on `/destinations/palm-springs` and `/events/coachella-2026-w1`: <https://search.google.com/test/rich-results>

### Phase 5 — Post-cutover (first 24 hours)

- [ ] **Google Search Console** (<https://search.google.com/search-console>):
  - Add `destinationgh.com` as a property (or move ownership from old site)
  - Submit `https://destinationgh.com/sitemap.xml`
  - Request indexing for the 6 highest-priority routes: `/`, `/destinations`, `/destinations/palm-springs`, `/destinations/san-miguel-de-allende`, `/events`, `/intel`
- [ ] **Bing Webmaster Tools** — submit same sitemap
- [ ] **Vercel Analytics** → Enable in Project Settings → Speed Insights + Web Analytics (free tiers)
- [ ] Watch Vercel logs (Runtime Logs panel) for any 500s — especially on `/destinations/[slug]` (the Perplexity-fed Intel section)
- [ ] Confirm Vercel Cron jobs fire: `/api/intel/refresh` (Mondays 7am UTC) + `/api/social/publish` (hourly) — first heartbeat should appear in logs within an hour
- [ ] **Decommission the old WordPress site** at Bluehost — but don't delete the database/files yet. Keep as a backup for 30 days.

### Phase 6 — Within 48 hours

- [ ] Investigate any 404s in Vercel logs → add specific redirects in `next.config.js`
- [ ] Verify analytics baseline (Vercel Web Analytics will start collecting immediately)
- [ ] Email past guests if you have a list — share the new site URL
- [ ] Update social-media bios (Instagram, Pinterest, Facebook) with the new (same) destinationgh.com URL — it's now pointing to the new site

---

## Known deferred work (M7 backlog)

The senior reviewer flagged these as non-blocking but worth fixing soon:

1. **Auth UI (highest priority)** — `/auth/login` and `/auth/signup` are placeholders. Build Supabase magic-link auth. Then re-add `/economics`, `/social`, `/pricing-engine` to `PROTECTED_PREFIXES` for proper admin gating.
2. **Stripe webhook** — currently returns 501. Implement signature verification + idempotency before enabling booking deposits.
3. **PriceLabs live integration** — real API key + listing-ID mapping.
4. **AirDNA Pro subscription** — for real comp-set benchmarking on `/economics`.
5. **Meta IG Business + token refresh** — for real Instagram posting from `/social`.
6. **Suspense boundaries on property pages** — wrap `<PropertyIntel>` and `<PropertyHotspots>` in `<Suspense fallback={skeleton}>` so they parallel-fetch instead of serializing.
7. **OG image resize** — 1200×630 (currently 2304×1536).
8. **Color contrast** — bump `text-brand-slate/70` instances to `/80` for AA compliance.
9. **Real reviews + intel persistence** — wire Supabase tables to replace stub seeds.
10. **Rate limiting** on `/api/health` (gate behind cron secret) and `/api/places/photo` (already cached but worth IP throttling at the edge).

---

## Architecture summary (for future reference)

```
src/
├── app/                # Next.js App Router
│   ├── (marketing)     # Public surface
│   ├── api/            # Route handlers + webhooks
│   ├── auth/           # Login/signup/callback (M7 will complete)
│   ├── economics/      # Admin: financial dashboards
│   ├── social/         # Admin: IG composer + cadence
│   └── pricing-engine/ # Admin: PriceLabs dashboard
├── components/         # Server + client components, organized by feature
├── lib/
│   ├── ai/             # Anthropic Claude
│   ├── airdna/         # MarketMinder (stub mode)
│   ├── auth/           # Cron + admin gates
│   ├── economics/      # Loader, model, synthetic seed
│   ├── events/         # Premium calculator, event details
│   ├── google/         # Places API + photo proxy
│   ├── hotspots/       # Curated data + Supabase loader
│   ├── perplexity/     # Sonar client + intel pipeline
│   ├── pricelabs/      # API client + event-override sync
│   ├── seo/            # JSON-LD helpers
│   ├── social/         # Cadence + hashtag bank + photo library
│   ├── stripe/         # Client + server (M7 will complete)
│   ├── supabase/       # Browser / server / admin client factories
│   └── utils/          # cn, format, stats, distance
├── hooks/              # useProfile, useProperty (M7 will wire)
├── middleware.js       # Auth-aware routing
└── supabase/schema.sql # 9 tables + RLS policies + auth trigger
```

**Stub-first pattern:** Every external integration in `src/lib/<service>/` checks for its API key on first call. If absent, it returns realistic mock data and tags the response `{ stub: true }`. Adding a key in Vercel envs flips that integration to live with zero code change. This is the discipline that let M2–M5 build and deploy without waiting for every paid subscription.

---

**Site is ready. Cleared for production cutover.**
