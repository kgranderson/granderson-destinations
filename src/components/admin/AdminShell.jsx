import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { AdminNav } from '@/components/shared/AdminNav';
export function AdminShell({ profile, eyebrow, title, description, children }) {
  return <><NavBar /><main className="min-h-screen bg-brand-cloud pt-24 text-brand-ink"><div className="mx-auto flex max-w-[96rem]"><AdminNav profile={profile} /><div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10"><nav className="mb-8 flex gap-4 overflow-x-auto text-sm lg:hidden"><Link href="/admin">Dashboard</Link><Link href="/admin/keys">API health</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/optimize">Optimize</Link></nav><p className="text-xs uppercase tracking-[.25em] text-brand-terracotta">{eyebrow}</p><h1 className="display mt-3 text-4xl sm:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-brand-slate">{description}</p><div className="mt-9">{children}</div></div></div></main></>;
}
