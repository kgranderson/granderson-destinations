'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Subtle magnetic CTA — pointer-driven micro-translation. Cap at 6px
 * so it never crosses the threshold from delight into "weird."
 */
export function MagneticButton({ children, className, as: Tag = 'button', ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = '';
  };
  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-transform duration-300 ease-out-quint',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
