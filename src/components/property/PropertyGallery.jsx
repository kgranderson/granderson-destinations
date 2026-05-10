'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Container } from '../shared/Container';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export function PropertyGallery({ property }) {
  const images = property.gallery ?? [];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Keyboard nav for the lightbox
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length]);

  if (!images.length) return null;

  return (
    <section className="bg-brand-cloud py-20 sm:py-28">
      <Container>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Inside the home</p>
            <h2 className="display mt-3 text-display-lg text-brand-ink">Gallery</h2>
          </div>
          <p className="hidden text-sm text-brand-slate sm:block">
            Click any image to expand · arrow keys to navigate
          </p>
        </div>

        <div className="mt-10 grid gap-3 grid-cols-2 md:grid-cols-4">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => {
                setActive(i);
                setOpen(true);
              }}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-sand"
              aria-label={`Open image ${i + 1} of ${images.length}`}
            >
              <Image
                src={src}
                alt={`${property.name} — interior shot ${i + 1}`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-[1200ms] ease-out-quint group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>
      </Container>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/95 p-4 sm:p-10"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            aria-label="Close"
            className="absolute right-5 top-5 rounded-full bg-brand-cloud/10 p-3 text-brand-cloud hover:bg-brand-cloud/20"
          >
            <X size={20} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i - 1 + images.length) % images.length);
            }}
            aria-label="Previous image"
            className="absolute left-5 rounded-full bg-brand-cloud/10 p-3 text-brand-cloud hover:bg-brand-cloud/20"
          >
            <ChevronLeft size={22} />
          </button>

          <div
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[active]}
              alt={`${property.name} — image ${active + 1}`}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i + 1) % images.length);
            }}
            aria-label="Next image"
            className="absolute right-5 rounded-full bg-brand-cloud/10 p-3 text-brand-cloud hover:bg-brand-cloud/20"
          >
            <ChevronRight size={22} />
          </button>

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-brand-cloud/10 px-4 py-1 text-xs text-brand-cloud">
            {active + 1} / {images.length}
          </p>
        </div>
      )}
    </section>
  );
}
