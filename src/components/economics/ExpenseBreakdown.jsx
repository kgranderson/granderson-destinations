'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { usd } from '@/lib/utils/format';

const PALETTE = [
  '#0E1116',
  '#3F4A56',
  '#C9A24E',
  '#C6633C',
  '#5E7C6B',
  '#D98E78',
  '#E8DCC6',
  '#A99577',
  '#7E6B53',
  '#615445',
  '#4A4036',
];

export function ExpenseBreakdown({ monthly }) {
  // Aggregate trailing-12 expenses by category
  const data = useMemo(() => {
    const ttm = monthly.slice(-12);
    const totals = {};
    for (const m of ttm) {
      for (const [cat, amt] of Object.entries(m.expensesByCategory || {})) {
        totals[cat] = (totals[cat] || 0) + amt;
      }
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [monthly]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">Expenses · trailing 12</h3>
        <p className="text-[11px] uppercase tracking-widest text-brand-slate/60">
          {usd(total)} total
        </p>
      </div>

      <div className="mt-5 grid items-center gap-6 md:grid-cols-2">
        <div className="h-[260px] w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={62} paddingAngle={1}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#FAFAF7', border: '1px solid #E8DCC6', borderRadius: 8 }}
                formatter={(v) => usd(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-1.5 text-sm">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-brand-slate">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                {d.name}
              </span>
              <span className="font-medium text-brand-ink tabular-nums">
                {usd(d.value)}{' '}
                <span className="ml-1 text-xs text-brand-slate/70">
                  ({((d.value / total) * 100).toFixed(0)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
