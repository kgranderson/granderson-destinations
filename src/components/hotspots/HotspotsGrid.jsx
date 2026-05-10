'use client';

import { useMemo, useState } from 'react';
import { HotspotCard } from './HotspotCard';
import { CATEGORIES } from '@/lib/hotspots/data';

export function HotspotsGrid({ items, showFilters = true }) {
  const [activeCategory, setActiveCategory] = useState('all');

  // Only show category chips that have items in this market
  const presentCategories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return [{ id: 'all', label: 'All' }, ...CATEGORIES.filter((c) => set.has(c.id))];
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <div>
      {showFilters && presentCategories.length > 2 && (
        <div className="-mx-2 flex flex-wrap items-center gap-2 px-2">
          {presentCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                activeCategory === c.id
                  ? 'border-brand-ink bg-brand-ink text-brand-cloud'
                  : 'border-brand-tan/60 bg-brand-cloud text-brand-slate hover:border-brand-ink hover:text-brand-ink'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid auto-rows-min gap-6 stagger-grid sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((h, i) => (
          <HotspotCard key={h.id} hotspot={h} featured={i === 0 && activeCategory === 'all'} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-brand-slate">
          Nothing in this category yet — check another or come back next week.
        </p>
      )}
    </div>
  );
}
