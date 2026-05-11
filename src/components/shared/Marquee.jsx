/**
 * Static marquee strip. Sits between the hero and the first content
 * section as a city ledger. Per the design system motion rules,
 * no animation — the strip is declarative.
 */
export function Marquee({ items = [] }) {
  return (
    <div className="marquee" aria-label="Markets">
      {items.map((item, i) => (
        <span key={item}>
          <span>{item}</span>
          {i < items.length - 1 && <span className="dot">/</span>}
        </span>
      ))}
    </div>
  );
}
