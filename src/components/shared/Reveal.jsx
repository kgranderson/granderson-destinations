'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll-triggered reveal. Uses IntersectionObserver to add an
 * `.in-view` class when the element enters the viewport, triggering
 * the opacity + 8px Y-translate transition defined in globals.css.
 * Respects prefers-reduced-motion via CSS.
 */
export function Reveal({
  as: Tag = 'div',
  stagger = false,
  delayMs = 0,
  once = true,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in-view');
      return;
    }
    // Content is visible without JS. Animate only offscreen content after hydration.
    if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add('reveal-pending');
    else el.classList.add('in-view');
    let timer;
    const show = () => { el.classList.add('in-view'); el.classList.remove('reveal-pending'); };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            clearTimeout(timer);
            if (delayMs > 0) timer = setTimeout(show, Math.min(delayMs,1000));
            else show();
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove('in-view');
            el.classList.add('reveal-pending');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); el.classList.remove('reveal-pending'); };
  }, [delayMs, once]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${stagger ? 'stagger' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

