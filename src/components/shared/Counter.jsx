'use client';

import { useEffect, useRef, useState } from 'react';

export function Counter({ to = 0, duration = 1400, format = (n) => n, className }) {
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
        // Only push a render when the displayed integer changes (Counter is
        // typically wrapped in Math.round). Cuts re-renders to ~`to` total.
        if (Math.round(next) !== Math.round(lastRendered)) {
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
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {format(val)}
    </span>
  );
}
