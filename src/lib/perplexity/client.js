import 'server-only';
/**
 * Perplexity Sonar client. Used for:
 *  - City council / entitlement intel (Feature 1)
 *  - Local hotspot narrative refresh (Feature 2)
 *  - Event landscape verification (Feature 3)
 *
 * In stub mode (no PERPLEXITY_API_KEY) the client returns realistic
 * mock results so the UI is fully usable while keys are provisioned.
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const BASE = 'https://api.perplexity.ai';

export async function perplexityChat({
  prompt,
  systemPrompt,
  model = process.env.PERPLEXITY_MODEL || 'sonar-pro',
  searchRecencyFilter = 'month',
  maxTokens = 1500,
} = {}) {
  if (!FEATURE_FLAGS.perplexityLive()) {
    return {
      stub: true,
      content: '[stub] PERPLEXITY_API_KEY missing — returning placeholder.',
      citations: [],
    };
  }

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      search_recency_filter: searchRecencyFilter,
      return_citations: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Perplexity API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    stub: false,
    content: data?.choices?.[0]?.message?.content ?? '',
    citations: data?.citations ?? [],
    raw: data,
  };
}
