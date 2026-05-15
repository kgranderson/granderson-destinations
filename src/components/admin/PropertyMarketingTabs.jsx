'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tags, Calendar, Megaphone, Mail, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Horizontal tabs for every page under /admin/marketing/[property]/*.
 * Order mirrors the Phase A → D build sequence so the user always sees
 * "what's shipping next" in the tab order:
 *
 *   Pricing  →  Quarter plan  →  Campaigns  →  Email  →  Ads  →  Settings
 *
 * Phase A ships /pricing live. /quarter, /campaigns, /email, /ads land
 * with their respective phases; until then the tab links to the section
 * with a "Coming in Phase X" placeholder so nothing 404s.
 */
const TABS = [
  { slug: 'pricing',   label: 'Pricing',     icon: Tags,      phase: 'A' },
  { slug: 'quarter',   label: 'Quarter plan', icon: Calendar,  phase: 'B' },
  { slug: 'campaigns', label: 'Campaigns',   icon: Megaphone, phase: 'C' },
  { slug: 'email',     label: 'Email',       icon: Mail,      phase: 'D' },
  { slug: 'ads',       label: 'Ads',         icon: BarChart3, phase: 'D' },
  { slug: 'settings',  label: 'Settings',    icon: Settings,  phase: 'C' },
];

export function PropertyMarketingTabs({ propertySlug }) {
  const pathname = usePathname();
  const base = `/admin/marketing/${propertySlug}`;

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-brand-tan/60 pb-px">
      {TABS.map(({ slug, label, icon: Icon, phase }) => {
        const href = `${base}/${slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={slug}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors',
              active
                ? 'border-brand-ink text-brand-ink'
                : 'border-transparent text-brand-slate hover:border-brand-tan hover:text-brand-ink',
            )}
          >
            <Icon size={14} />
            {label}
            {phase !== 'A' && (
              <span className="ml-1 hidden rounded-full bg-brand-sand/60 px-1.5 py-px text-[9px] uppercase tracking-widest text-brand-slate/70 sm:inline">
                Phase {phase}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
