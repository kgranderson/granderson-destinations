import { Container } from '@/components/shared/Container';

export default function Loading() {
  return (
    <main className="min-h-screen bg-brand-cloud pt-32">
      <Container className="pb-20">
        <div className="h-6 w-40 skeleton rounded-md" />
        <div className="mt-4 h-12 w-3/4 skeleton rounded-md" />
        <div className="mt-3 h-12 w-1/2 skeleton rounded-md" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="aspect-[4/5] skeleton rounded-2xl" />
          <div className="aspect-[4/5] skeleton rounded-2xl" />
        </div>
      </Container>
    </main>
  );
}
