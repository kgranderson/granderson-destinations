'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';

export function PostComposer({ property, photos = [] }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [theme, setTheme] = useState('pool-or-courtyard');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStub, setIsStub] = useState(true);

  const photo = photos[activePhotoIdx];

  async function generate() {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/social/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertySlug: property.slug, theme }),
      });
      const data = await res.json();
      setCaption(data.caption || '');
      setHashtags(data.hashtags || []);
      setIsStub(!!data.stub);
    } catch (err) {
      setCaption(`[error] ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Photo selector + preview */}
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">Photo</p>

        {photo && (
          <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl bg-brand-sand">
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Photo strip */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.slice(0, 16).map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActivePhotoIdx(i)}
              aria-label={`Use photo ${i + 1}`}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-md ${
                i === activePhotoIdx ? 'ring-2 ring-brand-gold' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={p.src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Caption + hashtag composer */}
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">Caption</p>
          {isStub && caption && (
            <span className="rounded-full bg-brand-tan/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
              Stub
            </span>
          )}
        </div>

        <label className="mt-3 block">
          <span className="text-[10px] uppercase tracking-widest text-brand-slate/70">Theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-tan/60 bg-brand-cloud p-2 text-sm"
          >
            <option>pool-or-courtyard</option>
            <option>lifestyle</option>
            <option>kitchen</option>
            <option>golden-hour</option>
            <option>neighborhood</option>
            <option>detail</option>
            <option>event</option>
          </select>
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          placeholder="Generate a caption, then tweak before scheduling…"
          aria-label="Instagram caption"
          className="mt-4 w-full resize-none rounded-md border border-brand-tan/60 bg-brand-sand/30 p-3 text-sm leading-relaxed outline-none focus:border-brand-ink"
        />

        {hashtags.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">Hashtags</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {hashtags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-brand-tan/60 bg-brand-sand/40 px-2 py-0.5 text-[11px] text-brand-slate"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-medium text-brand-cloud hover:bg-brand-slate disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {caption ? 'Regenerate' : 'Generate caption'}
          </button>

          <button
            type="button"
            onClick={() => {
              const fullText = `${caption}\n\n${hashtags.join(' ')}`.trim();
              navigator.clipboard.writeText(fullText).catch(() => {});
            }}
            disabled={!caption}
            className="inline-flex items-center gap-2 rounded-full border border-brand-ink px-5 py-2.5 text-sm text-brand-ink hover:bg-brand-ink hover:text-brand-cloud disabled:opacity-50"
          >
            <Copy size={14} /> Copy
          </button>
        </div>

        <p className="mt-4 text-xs text-brand-slate/80">
          Generated by Claude (concierge tone). Stub mode returns realistic placeholder copy until
          <code className="mx-1 rounded bg-brand-tan/40 px-1">ANTHROPIC_API_KEY</code>
          is set.
        </p>
      </div>
    </div>
  );
}
