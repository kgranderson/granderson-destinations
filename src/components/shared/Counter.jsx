'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated number counter. Strings only as props (suffix / prefix /
 * decimals) — Server Components can't pass functions across the
 * client-component boundary in Next 14.
 */
export function Counter({
  to = 0,
  duration = 1400,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}) {
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      let lastRendered = -Infinity;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const next = to * eased;
        const factor = 10 ** decimals;
        if (Math.round(next * factor) !== Math.round(lastRendered * factor)) {
          lastRendered = next;
          setVal(next);
        }
        if (p < 1) requestAnimationFrame(tick);
        else setVal(to);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && start()),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, decimals]);

  const display = val.toFixed(decimals);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
