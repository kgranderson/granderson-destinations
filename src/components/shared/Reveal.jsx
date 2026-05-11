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
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs > 0) setTimeout(() => el.classList.add('in-view'), delayMs);
            else el.classList.add('in-view');
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove('in-view');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
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
