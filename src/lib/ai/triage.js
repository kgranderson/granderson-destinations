import 'server-only';
/**
 * Claude-powered maintenance triage.
 *
 * Receives a free-text issue description (and optional photos) submitted
 * from /maintenance/report, returns structured JSON ready to be turned
 * into a ClickUp task + a vendor SMS.
 *
 * Stub mode (no ANTHROPIC_API_KEY): returns a deterministic triage based
 * on keyword matching so the full pipeline runs end-to-end without keys.
 */
import Anthropic from '@anthropic-ai/sdk';
import { FEATURE_FLAGS, MAINTENANCE_CATEGORIES } from '@/lib/constants';

let client = null;
function getClient() {
  if (!FEATURE_FLAGS.anthropicLive()) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

/**
 * Triage one maintenance report.
 *
 * Input:
 *   property        — { slug, name, city, addressLine, ... } from constants
 *   description     — guest/manager text
 *   reportedBy      — 'guest' | 'manager' | 'owner'
 *   photos          — optional array of public photo URLs
 *   vendorRoster    — [{ id, name, specialties: ['HVAC','Plumbing'], phone, notes }]
 *   recentSimilar   — optional array of past tickets in same category (for recurrence detection)
 *
 * Output:
 *   {
 *     title,
 *     category,           // one of MAINTENANCE_CATEGORIES
 *     severity,           // 1-5
 *     priority,           // 'low' | 'normal' | 'high' | 'urgent' (matches DB constraint)
 *     vendorType,         // free-text specialty needed
 *     matchedVendorId,    // best fit from roster, or null
 *     taskDescription,    // formatted markdown for ClickUp task body
 *     vendorMessage,      // SMS-ready string for Twilio
 *     estimatedHours,     // rough time estimate
 *     recurringFlag,      // true if recentSimilar shows pattern
 *     confidence,         // 0-1
 *     reasoning,          // 1-line explanation for owner
 *   }
 */
export async function triageMaintenance({
  property,
  description,
  reportedBy = 'guest',
  photos = [],
  vendorRoster = [],
  recentSimilar = [],
}) {
  const c = getClient();
  if (!c) return stubTriage({ property, description, reportedBy, vendorRoster, recentSimilar });

  const system = `You are the maintenance triage assistant for Granderson Destinations,
a luxury short-term rental operator. Given an issue description, classify it,
estimate severity, pick the best vendor from the provided roster, and draft
both a structured task body and a concise vendor SMS in the owner's voice.

Always return STRICT JSON matching the schema described in the user message.
Never include markdown fences, never write prose outside the JSON.`;

  const roster = vendorRoster.length
    ? vendorRoster.map((v) => `  - id=${v.id}  name=${v.name}  specialties=[${(v.specialties || []).join(', ')}]  notes=${v.notes || ''}`).join('\n')
    : '  (no vendors on roster yet)';

  const recurrenceLines = recentSimilar.length
    ? `\nRECENT SIMILAR TICKETS (last 90 days):\n${recentSimilar.map((t) => `  - ${t.created_at?.slice(0, 10)} ${t.category} ${t.title}`).join('\n')}`
    : '';

  const user = `Property: ${property.name} — ${property.city}, ${property.region}${property.addressLine ? ` (${property.addressLine})` : ''}.
Reported by: ${reportedBy}
Issue description:
"""
${description}
"""
${photos.length ? `Photos: ${photos.length} attached.` : 'No photos.'}

VENDOR ROSTER:
${roster}
${recurrenceLines}

Return STRICT JSON, no markdown, matching this schema:
{
  "title": "<short title, <= 80 chars>",
  "category": "<one of: ${MAINTENANCE_CATEGORIES.join(' | ')}>",
  "severity": <integer 1-5; 1=emergency safety risk, 5=cosmetic>,
  "priority": "<low | normal | high | urgent>",
  "vendorType": "<short skill needed, e.g. 'Licensed HVAC technician'>",
  "matchedVendorId": "<vendor id from roster, or null>",
  "taskDescription": "<markdown body for the ClickUp task: a clear summary, observed symptoms, asks of the vendor, address line. Keep under 600 words.>",
  "vendorMessage": "<plain-text SMS body, <= 320 chars, warm-professional, in the owner's voice; include property short-name + symptoms + ask>",
  "estimatedHours": <number, e.g. 1.5>,
  "recurringFlag": <true if recent similar tickets suggest a pattern, else false>,
  "confidence": <number 0-1>,
  "reasoning": "<one short sentence explaining the classification and vendor match for the owner>"
}`;

  let msg;
  try {
    msg = await c.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: user }],
    });
  } catch (err) {
    return { stub: true, ...stubTriage({ property, description, reportedBy, vendorRoster, recentSimilar }), error: String(err) };
  }

  const text = msg.content?.[0]?.text ?? '';
  let parsed;
  try {
    const i = text.indexOf('{');
    const j = text.lastIndexOf('}');
    parsed = JSON.parse(text.slice(i, j + 1));
  } catch {
    return { stub: true, ...stubTriage({ property, description, reportedBy, vendorRoster, recentSimilar }), error: 'parse-fail', raw: text };
  }
  return { stub: false, ...parsed };
}

// ---------- Stub: keyword-based triage so the pipeline works keyless -------

function stubTriage({ property, description, reportedBy, vendorRoster, recentSimilar }) {
  const d = (description || '').toLowerCase();
  const hit = (kws) => kws.some((k) => d.includes(k));

  let category = 'Other';
  let severity = 3;
  let vendorType = 'Handyman';

  if (hit(['ac ', 'air condition', 'cooling', 'heater', 'heating', 'hvac', 'thermostat'])) {
    category = 'HVAC'; severity = 2; vendorType = 'HVAC technician';
  } else if (hit(['leak', 'drain', 'toilet', 'sink', 'shower', 'faucet', 'plumb', 'water'])) {
    category = 'Plumbing'; severity = 2; vendorType = 'Plumber';
  } else if (hit(['outlet', 'breaker', 'light', 'electric', 'spark', 'switch'])) {
    category = 'Electrical'; severity = 2; vendorType = 'Electrician';
  } else if (hit(['pool', 'spa', 'hot tub', 'jacuzzi'])) {
    category = 'Pool'; severity = 3; vendorType = 'Pool service tech';
  } else if (hit(['dishwasher', 'fridge', 'refrigerator', 'oven', 'stove', 'microwave', 'washer', 'dryer'])) {
    category = 'Appliance'; severity = 3; vendorType = 'Appliance repair';
  } else if (hit(['lawn', 'tree', 'garden', 'landscape', 'irrigation', 'sprinkler'])) {
    category = 'Landscape'; severity = 4; vendorType = 'Landscaper';
  } else if (hit(['lock', 'door', 'safe', 'alarm', 'gate', 'camera', 'security'])) {
    category = 'Security'; severity = 2; vendorType = 'Locksmith / security tech';
  } else if (hit(['stain', 'clean', 'trash', 'odor', 'smell'])) {
    category = 'Cleaning'; severity = 4; vendorType = 'Housekeeping deep-clean';
  }

  // Emergency keyword bump
  if (hit(['flood', 'gas', 'smoke', 'fire', 'unsafe', 'no water', 'no power'])) severity = 1;

  const priority = severity <= 1 ? 'urgent' : severity === 2 ? 'high' : severity === 3 ? 'normal' : 'low';
  const matched = vendorRoster.find((v) => (v.specialties || []).some((s) => vendorType.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(vendorType.toLowerCase().split(' ')[0])));
  const recurringFlag = recentSimilar.filter((t) => t.category === category).length >= 2;

  const title = `${category}: ${description.split(/[.\n]/)[0].slice(0, 70)}`;

  const taskDescription = [
    `**Reported by:** ${reportedBy}`,
    `**Property:** ${property.name} — ${property.addressLine || property.city}`,
    `**Severity:** ${severity}/5  •  **Priority:** ${priority}`,
    `**Vendor needed:** ${vendorType}`,
    '',
    '### Issue',
    description,
    '',
    recurringFlag ? '> ⚠️ **Recurring** — multiple similar tickets in the last 90 days; consider a capex fix.' : '',
  ].filter(Boolean).join('\n');

  const vendorMessage = `Hi${matched ? ` ${matched.name.split(' ')[0]}` : ''} — Kwame at Granderson Destinations. Issue at ${property.shortName || property.name}: ${description.slice(0, 120)}${description.length > 120 ? '…' : ''}. Severity ${severity}/5. Can you take a look? I'll send the address and access details once you confirm. Thanks.`;

  return {
    title,
    category,
    severity,
    priority,
    vendorType,
    matchedVendorId: matched?.id || null,
    taskDescription,
    vendorMessage,
    estimatedHours: severity <= 2 ? 2 : 1,
    recurringFlag,
    confidence: 0.55,
    reasoning: `[stub] Keyword match → ${category}; vendor ${matched?.name || 'unmatched'}.`,
  };
}
