'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertTriangle, CheckCircle2, Key, Calendar, Hash } from 'lucide-react';

/**
 * Per-property Meta credentials form. Operator pastes:
 *   - IG Business ID (numeric)
 *   - FB Page ID    (numeric)
 *   - Long-lived access token (200+ chars)
 *   - Token expiry date  (optional but recommended — drives warning)
 *
 * Token is write-only. We never echo the raw value back; the
 * "current token" field shows only the last 4 chars from the saved
 * row. Operator must paste the FULL token again to update.
 */
export function MetaCredsForm({ propertySlug, initialCreds }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    ig_business_id: initialCreds?.ig_business_id || '',
    fb_page_id: initialCreds?.fb_page_id || '',
    meta_ad_account_id: initialCreds?.meta_ad_account_id || '',
    ig_access_token: '',
    ig_token_expires_at: initialCreds?.token_expires_at?.slice(0, 10) || '',
  });

  const tokenPreview = initialCreds?.ig_access_token_preview;
  const expiresInDays = initialCreds?.token_expires_in_days;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      // Build payload — only include fields that changed / are non-empty.
      // Operator-intentional blanking is signaled by typing then deleting,
      // which leaves a literal empty string that the server interprets
      // as "clear this field".
      const payload = {
        ig_business_id: form.ig_business_id,
        fb_page_id: form.fb_page_id,
        meta_ad_account_id: form.meta_ad_account_id,
      };
      if (form.ig_access_token.trim()) {
        payload.ig_access_token = form.ig_access_token.trim();
      }
      if (form.ig_token_expires_at) {
        payload.ig_token_expires_at = form.ig_token_expires_at;
      }

      const r = await fetch(`/api/admin/marketing/meta-creds/${propertySlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `Save failed (${r.status})`);
      setResult({ ok: true, message: 'Credentials saved.' });
      // Clear the token field after a successful save so it isn't sitting
      // in browser memory longer than needed
      setForm((f) => ({ ...f, ig_access_token: '' }));
      router.refresh();
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft">
      <h2 className="display text-display-md text-brand-ink">Meta connection</h2>
      <p className="mt-1 text-sm text-brand-slate">
        Per-property Instagram + Facebook credentials.
      </p>

      {/* Token expiry warning */}
      {tokenPreview && expiresInDays !== null && expiresInDays < 14 && (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={16} />
          <div>
            <strong>Token expires in {expiresInDays} day{expiresInDays === 1 ? '' : 's'}.</strong>{' '}
            Generate a fresh long-lived token in Meta Business Suite and paste it below.
          </div>
        </div>
      )}

      <form onSubmit={save} className="mt-6 space-y-5">
        <Field
          label="Instagram Business ID"
          icon={Hash}
          value={form.ig_business_id}
          onChange={(v) => setForm((f) => ({ ...f, ig_business_id: v }))}
          placeholder="17841400000000000"
          help="The numeric IG user ID — find it via Graph API /me/accounts."
        />
        <Field
          label="Facebook Page ID"
          icon={Hash}
          value={form.fb_page_id}
          onChange={(v) => setForm((f) => ({ ...f, fb_page_id: v }))}
          placeholder="100000000000000"
          help="The numeric Page ID. In Page Settings → About → Page ID."
        />
        <Field
          label="Meta Ad Account ID (optional)"
          icon={Hash}
          value={form.meta_ad_account_id}
          onChange={(v) => setForm((f) => ({ ...f, meta_ad_account_id: v }))}
          placeholder="act_000000000000000"
          help="Only needed for Phase D (ads roll-up). Leave blank for now if you don't run paid yet."
        />

        {/* Token field — write-only */}
        <div>
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
              <Key size={12} />
              Long-lived access token {tokenPreview && <span className="lowercase normal-case ml-2 text-brand-slate/60">currently: {tokenPreview}</span>}
            </span>
            <textarea
              rows={3}
              value={form.ig_access_token}
              onChange={(e) => setForm((f) => ({ ...f, ig_access_token: e.target.value }))}
              placeholder={tokenPreview ? 'Paste a new token to replace the saved one' : 'EAAGmZACFI…'}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm font-mono"
            />
          </label>
          <p className="mt-1 text-[11px] text-brand-slate/70">
            ~200 chars. Stored server-side only; never re-displayed in plaintext.
          </p>
        </div>

        <Field
          label="Token expiration date"
          icon={Calendar}
          type="date"
          value={form.ig_token_expires_at}
          onChange={(v) => setForm((f) => ({ ...f, ig_token_expires_at: v }))}
          help="Meta long-lived tokens last 60 days. We warn you 14 days before."
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-5 py-2 text-sm text-brand-cloud hover:bg-brand-ink/85 disabled:opacity-50"
          >
            <Save size={14} /> {busy ? 'Saving…' : 'Save connection'}
          </button>
          {result && (
            <span
              className={`inline-flex items-center gap-1.5 text-sm ${
                result.ok ? 'text-brand-jade' : 'text-rose-700'
              }`}
            >
              {result.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {result.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function Field({ label, icon: Icon, value, onChange, placeholder, help, type = 'text' }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
        {Icon && <Icon size={12} />}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
      />
      {help && <p className="mt-1 text-[11px] text-brand-slate/70">{help}</p>}
    </label>
  );
}
