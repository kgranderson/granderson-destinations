import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Admin sign-in',
  description: 'Sign in to the Granderson Destinations operations dashboard.',
};

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="sm" className="pb-24">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-ink/75 font-medium">
            Granderson Destinations · Operations
          </p>
          <h1 className="display mt-2 text-display-md text-brand-ink">Sign in</h1>
          <p className="mt-2 text-brand-slate">
            Email + password access to the maintenance admin. Contact the owner if you need an
            account.
          </p>

          <div className="mt-8 rounded-xl border border-brand-slate/15 bg-white p-8 shadow-sm">
            <LoginForm />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
