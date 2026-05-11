const STATS = [
  { figure: '87', unit: '%', label: 'Top-quartile ADR vs. the AirDNA comp set' },
  { figure: '42', unit: '%', label: 'Repeat-guest rate across the portfolio' },
  { figure: '4.9', unit: '/ 5', label: 'Average across the last two hundred reviews' },
  { figure: '2', unit: '', label: 'Markets live, three opening in 2026' },
];

export function Stats() {
  return (
    <section className="container" style={{ padding: 'var(--space-12) 0' }}>
      <div className="stats">
        {STATS.map((s) => (
          <div key={s.label} className="stat">
            <div className="figure">
              {s.figure}
              {s.unit && <sub>{s.unit}</sub>}
            </div>
            <div className="figure-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
