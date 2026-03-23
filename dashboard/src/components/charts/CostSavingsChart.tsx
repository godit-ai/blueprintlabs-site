import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { timeSeriesData } from '../../data/mockData';

// Build cumulative data
const cumulativeData = timeSeriesData.reduce<{ date: string; cumulative: number; daily: number }[]>((acc, d) => {
  const prev = acc.length ? acc[acc.length - 1].cumulative : 0;
  acc.push({ date: d.date, cumulative: Number((prev + d.costSavings).toFixed(2)), daily: d.costSavings });
  return acc;
}, []);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-dark-300 font-medium mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-dark-400">{entry.name}:</span>
          <span className="font-medium text-dark-100">${entry.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function CostSavingsChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-dark-200 mb-4">Cumulative Cost Savings</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cumulativeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="costLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulative"
              name="Total Saved"
              stroke="url(#costLine)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
