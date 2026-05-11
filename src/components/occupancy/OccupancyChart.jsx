'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { pct, usd } from '@/lib/utils/format';

export function OccupancyChart({ rows }) {
  const data = rows.map((r) => ({
    month: r.month.slice(2),
    occupancy: +(r.occupancy * 100).toFixed(1),
    adr: Math.round(r.adr_realized || 0),
    nights: r.nights_booked,
  }));

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">Occupancy + ADR · last 24 months</h3>
        <p className="text-[11px] uppercase tracking-widest text-brand-slate/60">monthly</p>
      </div>

      <div className="mt-5 h-[320px] w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC6" />
            <XAxis dataKey="month" stroke="#3F4A56" fontSize={11} />
            <YAxis
              yAxisId="occ"
              tickFormatter={(v) => `${v}%`}
              stroke="#3F4A56"
              fontSize={11}
              width={42}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="adr"
              orientation="right"
              tickFormatter={(v) => `$${v}`}
              stroke="#3F4A56"
              fontSize={11}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: '#FAFAF7',
                border: '1px solid #E8DCC6',
                borderRadius: 8,
              }}
              formatter={(value, name) =>
                name === 'Occupancy' ? `${value}%` : name === 'ADR' ? usd(value) : value
              }
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar yAxisId="occ" dataKey="occupancy" name="Occupancy" fill="#5E7C6B" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="adr"
              type="monotone"
              dataKey="adr"
              name="ADR"
              stroke="#C9A24E"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
