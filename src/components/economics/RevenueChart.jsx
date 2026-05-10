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
import { usd } from '@/lib/utils/format';

/**
 * Monthly revenue + NOI overlay. Last 24 months. Revenue as bars,
 * NOI as a line.
 */
export function RevenueChart({ monthly }) {
  const data = monthly.map((m) => ({
    month: m.month.slice(2), // YY-MM
    revenue: Math.round(m.revenue),
    noi: Math.round(m.noi),
  }));

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">Revenue + NOI · last 24 months</h3>
        <p className="text-[11px] uppercase tracking-widest text-brand-slate/60">
          monthly · USD
        </p>
      </div>

      <div className="mt-5 h-[320px] w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC6" />
            <XAxis dataKey="month" stroke="#3F4A56" fontSize={11} />
            <YAxis
              tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
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
              formatter={(value) => usd(value)}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#C9A24E" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="noi"
              name="NOI"
              stroke="#0E1116"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
