import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { Star } from 'lucide-react';

// Until guest reviews are wired through Supabase, render curated
// placeholder review snippets. Replace these with real review data
// in a follow-up milestone.
const STUB_REVIEWS = {
  'palm-springs': [
    {
      author: 'Maya R.',
      rating: 5,
      stayMonth: 'Coachella W2 · 2026',
      body:
        '"The pool deck at golden hour is the entire reason you book a Palm Springs house. This one is perfect."',
    },
    {
      author: 'James + Olivia',
      rating: 5,
      stayMonth: 'Modernism Week · 2026',
      body:
        '"Concierge had us on the architecture bus at 9 AM and at Workshop Kitchen by 7. Effortless from start to finish."',
    },
    {
      author: 'Priya K.',
      rating: 5,
      stayMonth: 'BNP Paribas Open · 2026',
      body:
        '"Six of us, perfectly comfortable. The kitchen for late dinners, the spa for early mornings, and Tahquitz Canyon a five-minute drive. We rebooked before we left."',
    },
  ],
  'san-miguel-de-allende': [
    {
      author: 'Carlos D.',
      rating: 5,
      stayMonth: 'Día de Muertos · 2026',
      body:
        '"The rooftop on Día de Muertos with the Parroquia lit up — I have a photo from that night I look at every week."',
    },
    {
      author: 'Anna + Tom',
      rating: 5,
      stayMonth: 'Festival Cervantino · 2026',
      body:
        '"Concierge got us into a Casa Dragones tasting that was sold out for months. The house itself is the most beautifully appointed place we\'ve stayed in Mexico."',
    },
    {
      author: 'Robert M.',
      rating: 5,
      stayMonth: 'San Miguel Jazz Festival · 2026',
      body:
        '"Three blocks from the Jardín, the courtyard fountain running all night, and a kitchen where we hosted a chef for the family. Perfect."',
    },
  ],
};

export function PropertyReviews({ property }) {
  const reviews = STUB_REVIEWS[property.slug] ?? [];
  if (!reviews.length) return null;

  return (
    <section className="bg-brand-sand/40 py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={18} className="text-brand-gold" fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-brand-slate">5.0 · 96% five-star reviews</p>
          </div>
          <h2 className="display mt-4 text-display-lg text-brand-ink">
            What past guests have said.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 stagger-grid md:grid-cols-3">
          {reviews.map((r) => (
            <Reveal key={r.author}>
              <blockquote className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft">
                <div className="flex">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-brand-gold" fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-base leading-relaxed text-brand-ink">{r.body}</p>
                <footer className="mt-4 text-xs uppercase tracking-widest text-brand-slate/70">
                  {r.author} · {r.stayMonth}
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
