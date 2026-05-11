/**
 * Slow-drifting city ledger. The track is duplicated so the
 * translateX(-50%) keyframe creates a seamless loop. Hover pauses
 * the drift; prefers-reduced-motion disables it.
 */
export function Marquee({ items = [] }) {
  const renderRow = (k) => (
    <span key={k} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={`${k}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span>{item}</span>
          <span className="dot" aria-hidden>/</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className="marquee" aria-label="Markets">
      <div className="marquee-track">
        {renderRow('a')}
        {renderRow('b')}
      </div>
    </div>
  );
}
