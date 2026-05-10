'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Scroll-triggered reveal. Uses IntersectionObserver, respects
 * prefers-reduced-motion. Stagger via the `delayMs` prop or by
 * wrapping children in a `.stagger-grid` parent.
 */
export function Reveal({ children, className, delayMs = 0, as: Tag = 'div' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('reveal-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => el.classList.add('reveal-in'), delayMs);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  return (
    <Tag ref={ref} className={cn('reveal-init', className)}>
      {children}
    </Tag>
  );
}
