'use client';

import { useState } from 'react';
import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { Plus } from 'lucide-react';

export function PropertyFAQ({ property }) {
  const faqs = property.faqs ?? [];
  const [open, setOpen] = useState(0);
  if (!faqs.length) return null;

  return (
    <section className="bg-brand-cloud py-20 sm:py-28">
      <Container size="md">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Frequently asked</p>
          <h2 className="display mt-3 text-display-lg text-brand-ink">
            What guests usually want to know.
          </h2>
        </Reveal>

        <ul className="mt-12 divide-y divide-brand-tan/60 border-t border-b border-brand-tan/60">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            return (
              <li key={f.q}>
                <button
                  className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="font-medium text-brand-ink">{f.q}</span>
                  <Plus
                    size={18}
                    className={`mt-1 shrink-0 text-brand-slate transition-transform duration-300 ease-out-quint ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-hidden={!isOpen}
                  className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-out-quint ${
                    isOpen ? 'max-h-72 opacity-100 pb-6' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-brand-slate">{f.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
