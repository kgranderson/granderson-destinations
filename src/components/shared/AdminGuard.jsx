import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { getServerClient } from '@/lib/supabase/server';

/**
 * Server-side gate for admin-only pages. Renders children only if
 * the request has an authenticated session AND profile.tier ==='admin'.
 * Otherwise: redirects to /auth/login OR shows a 403 explainer.
 *
 * Returns { profile, supabase } as a tuple via a render prop pattern
 * — pages can call this then check the return to know if they should
 * render their normal layout.
 *
 * Usage:
 *   const result = await assertAdmin();
 *   if (!result.ok) return result.render;
 *   // proceed; result.profile is the admin profile
 */
export async function assertAdmin() {
  const supabase = getServerClient();
  if (!supabase) {
    redirect('/auth/login?redirect=/admin');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?redirect=/admin');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, tier')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.tier !== 'admin') {
    return {
      ok: false,
      profile,
      render: (
        <>
          <NavBar />
          <main className="animate-page-in pt-32">
            <Container size="sm" className="pb-20">
              <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Forbidden</p>
              <h1 className="display mt-3 text-display-lg text-brand-ink">Admin access required</h1>
              <p className="mt-3 text-brand-slate">
                Your account exists but isn&rsquo;t on the admin list. Reach out to the operator
                to grant admin tier, then refresh.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-full bg-brand-ink px-5 py-2.5 text-sm text-brand-cloud"
              >
                Back home
              </Link>
            </Container>
          </main>
          <Footer />
        </>
      ),
    };
  }
  return { ok: true, profile };
}
