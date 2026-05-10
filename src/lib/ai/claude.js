/**
 * Anthropic Claude integration.
 *  - Concierge replies (guest itineraries, neighborhood answers)
 *  - Caption generation for Feature 4 (Instagram)
 *  - Expense anomaly narrative for Feature 6 (Economics)
 */
import Anthropic from '@anthropic-ai/sdk';
import { FEATURE_FLAGS } from '@/lib/constants';

let client = null;
function getClient() {
  if (!FEATURE_FLAGS.anthropicLive()) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

export async function generateCaption({ property, theme, vibe = 'warm-editorial' }) {
  const c = getClient();
  if (!c) {
    return {
      stub: true,
      caption:
        `Slow mornings at ${property.name}. ${theme}. Tap the link in our bio to plan your stay in ${property.city}.\n\n#${property.slug.replace(/-/g, '')} #grandersonDestinations`,
    };
  }
  const sys =
    'You are the social voice for Granderson Destinations — luxury short-term rentals. Tone: warm-editorial, sensory, sparing with adjectives, never over-promises. Always ends with 4–6 niche hashtags (city + style). 1 emoji maximum. 280 characters max.';
  const msg = await c.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: sys,
    messages: [
      {
        role: 'user',
        content: `Property: ${property.name} — ${property.city}, ${property.country}.
Vibe: ${vibe}.
Image theme: ${theme}.
Write the IG caption.`,
      },
    ],
  });
  const caption = msg.content?.[0]?.text ?? '';
  return { stub: false, caption };
}

export async function explainExpenseAnomaly({ category, amount, baseline, compMedian, month }) {
  const c = getClient();
  if (!c) {
    return {
      stub: true,
      summary: `[stub] ${category} in ${month} ran $${amount.toLocaleString()} vs. baseline $${baseline.toLocaleString()} (comp median $${compMedian.toLocaleString()}). Likely driver: one-off maintenance or seasonal HVAC.`,
    };
  }
  const msg = await c.messages.create({
    model: MODEL,
    max_tokens: 280,
    system:
      'You are a fractional CFO for a luxury short-term-rental portfolio. Explain expense anomalies in 2–3 sentences. Lead with the most likely cause; never speculate beyond reasonable interpretation; recommend the smallest verifiable next step.',
    messages: [
      {
        role: 'user',
        content: `Category: ${category}\nMonth: ${month}\nActual: $${amount}\nRolling baseline: $${baseline}\nComp set median: $${compMedian}\nWhat\'s the most likely driver and what should I check first?`,
      },
    ],
  });
  return { stub: false, summary: msg.content?.[0]?.text ?? '' };
}
