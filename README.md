# Granderson Destinations · v2

Luxury short-term rental platform — rebuilt from scratch on the **Scholarship Winner** architecture blueprint.

Live (target): https://granderson-destinations.vercel.app

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 14 (App Router, JavaScript + JSDoc) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Auth + DB | Supabase (`@supabase/ssr`, three-client pattern) |
| Payments | Stripe (booking deposits, idempotent webhooks) |
| AI | Anthropic Claude (concierge + caption gen + expense narrative) |
| Intel | Perplexity Sonar (city-council + entitlement feed) |
| Dynamic pricing | PriceLabs |
| Comps | AirDNA MarketMinder |
| Social | Meta Graph / Instagram Business |
| Maps + Places | Google Maps / Places |
| Styling | Tailwind CSS + Geist + Fraunces display + Framer Motion |
| State | Zustand (client), custom hooks for data |

## What's built (Milestone 1 — foundation)

- `package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`
- Brand tokens + design system in `tailwind.config.js` + `src/app/globals.css` (custom easing, stagger grid, skeleton shimmer, reduced-motion guard, branded scrollbar)
- Configuration spine: `src/lib/constants.js` (BRAND, COLORS, PROPERTIES, FEATURE_FLAGS, ANCHOR_EVENTS_SEED, GUEST_TIERS, GUEST_BADGES, MARKETS)
- Three-client Supabase pattern: `src/lib/supabase/{client,server,middleware}.js`
- Middleware (`src/middleware.js`) with auth-aware routing + stub-mode passthrough
- Integration wrappers — every external API has a stub fallback so the app runs without keys:
  - `lib/perplexity/{client,intel}.js`
  - `lib/pricelabs/client.js`
  - `lib/airdna/client.js`
  - `lib/social/instagram.js`
  - `lib/ai/claude.js`
- Domain logic stubs: `lib/events/premium.js`, `lib/economics/model.js`
- Utility helpers: `lib/utils/{cn,format,stats,distance}.js`
- Shared UI: `Container`, `Reveal`, `Counter`, `NavBar`, `Footer`, `MagneticButton`, `Marquee`
- Landing surface: `Hero`, `PropertyShowcase`, `FeatureGrid`, `Stats`, `CTA`, marquee
- Pages: `/`, `/destinations`, `/destinations/[slug]`, `/not-found`
- Supabase schema (`supabase/schema.sql`) for: profiles, properties, bookings, stripe_events, intel_items, hotspots, anchor_events, monthly_financials, ig_posts — with RLS policies
- Scraper script (`scripts/scrape-destinationgh.mjs`) for Palm Springs + San Miguel content
- Stub-first feature flag pattern: every integration auto-falls back to realistic mock data when its API key is missing

## What's coming (M2–M6)

| # | Milestone | What |
| --- | --- | --- |
| M2 | Palm Springs property page | hero, gallery, amenities, neighborhood, booking, FAQ, JSON-LD |
| M3 | Intel + Hotspots + Event Premium | image-rich, Perplexity-fed, Google Places photos, anchor-event calculator |
| M4 | Economics model | AirDNA comps, expense outlier flags, what-if levers, P&L |
| M5 | Instagram engine + PriceLabs backend | scheduled posting, Claude captions, event-driven price overrides |
| M6 | San Miguel + final review + cutover | replicate template, full senior-reviewer pass, prod deploy |

## Setup

```bash
git init && git add . && git commit -m "feat: M1 foundation"
gh repo create granderson-destinations --public --source=. --push
# or push to an existing repo:
git remote add origin git@github.com:<you>/granderson-destinations.git
git push -u origin main

npm install
cp .env.example .env.local        # fill in any keys you have; the rest stub gracefully
npm run dev                       # http://localhost:3000
```

Vercel deploy: import the GitHub repo from the Vercel dashboard. Add envs from `.env.example`. Subsequent pushes auto-deploy.

## Stub mode

Every integration in `src/lib/<service>/` checks for its API key on first call. If absent, it returns realistic mock data and tags the response `{ stub: true }`. This lets the marketing site render and the dashboards populate while you provision real keys one-by-one. Adding a key (in Vercel envs) flips that integration to live with zero code change.
