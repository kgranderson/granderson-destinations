'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LineChart,
  Calendar,
  Wrench,
  Megaphone,
  Tags,
  Upload,
  Users,
  Truck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const SECTIONS = [
  { href: '/admin', label: 'Dashboard', icon: Home, match: (p) => p === '/admin' },
  { href: '/economics', label: 'Financial', icon: LineChart, match: (p) => p.startsWith('/economics') },
  { href: '/admin/occupancy', label: 'Occupancy', icon: Calendar, match: (p) => p.startsWith('/admin/occupancy') },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench, match: (p) => p.startsWith('/admin/maintenance') },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone, match: (p) => p.startsWith('/admin/marketing') },
  { href: '/pricing-engine', label: 'Pricing', icon: Tags, match: (p) => p.startsWith('/pricing-engine') },
  { href: '/admin/vendors', label: 'Vendors', icon: Truck, match: (p) => p.startsWith('/admin/vendors') },
  { href: '/admin/users', label: 'Admins', icon: Users, match: (p) => p.startsWith('/admin/users') },
  { href: '/admin/import', label: 'Import', icon: Upload, match: (p) => p.startsWith('/admin/import') },
];

/**
 * Sidebar shell for every page under /admin/*. Uses the same logout endpoint
 * as the maintenance dashboard's SignOutButton so we clear BOTH the Supabase
 * session cookies AND the legacy gd_owner cookie in one POST. The inline
 * supabase.auth.signOut() shortcut that used to live here was missing the
 * legacy-cookie clear, which let a stale gd_owner re-grant admin access on
 * the next page load.
 */
export function AdminNav({ profile }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      /* swallow — we redirect regardless */
    } finally {
      window.location.href = '/admin/login';
    }
  }

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-brand-tan/60 bg-brand-sand/30 px-4 py-6 lg:flex">
      <div className="px-3 pb-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-slate/70">Admin</p>
        <p className="mt-1 truncate text-sm font-medium text-brand-ink">
          {profile?.full_name || profile?.email || 'Operator'}
        </p>
      </div>

      <nav className="space-y-1">
        {SECTIONS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-brand-ink text-brand-cloud'
                  : 'text-brand-slate hover:bg-brand-tan/40 hover:text-brand-ink',
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-slate hover:bg-brand-tan/40 hover:text-brand-ink disabled:opacity-50"
        >
          <LogOut size={14} /> {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
