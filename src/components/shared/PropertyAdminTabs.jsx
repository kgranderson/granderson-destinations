'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LineChart, Calendar, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Property-scoped admin tab strip. Renders on every per-property
 * admin page so the operator can hop between Financial, Occupancy,
 * and Maintenance without losing the property in focus.
 *
 * The active tab is derived from the current URL — no prop drilling.
 */
const TABS = [
  {
    key: 'financial',
    label: 'Financial',
    icon: LineChart,
    href: (slug) => `/economics/${slug}`,
    match: (pathname, slug) => pathname === `/economics/${slug}`,
  },
  {
    key: 'occupancy',
    label: 'Occupancy',
    icon: Calendar,
    href: (slug) => `/admin/occupancy/${slug}`,
    match: (pathname, slug) => pathname === `/admin/occupancy/${slug}`,
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
    href: (slug) => `/admin/maintenance?property=${slug}`,
    match: (pathname) => pathname.startsWith('/admin/maintenance'),
  },
];

export function PropertyAdminTabs({ propertySlug }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Property admin sections"
      className="flex flex-wrap items-center gap-2 rounded-full border border-brand-tan/60 bg-brand-cloud p-1 shadow-soft"
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.match(pathname, propertySlug);
        return (
          <Link
            key={t.key}
            href={t.href(propertySlug)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-colors',
              active
                ? 'bg-brand-ink text-brand-cloud'
                : 'text-brand-slate hover:text-brand-ink',
            )}
          >
            <Icon size={12} /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
