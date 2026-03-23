import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { timeSeriesData } from '../../data/mockData';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-dark-300 font-medium mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-dark-400">{entry.name}:</span>
          <span className="font-medium text-dark-100">{entry.value}{entry.name === 'Ratio' ? 'x' : ''}</span>
        </div>
      ))}
    </div>
  );
};

export default function CompressionChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-dark-200 mb-4">Compression Ratio Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="ratioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[2, 4.5]} tickFormatter={v => `${v}x`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="compressionRatio"
              name="Ratio"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#ratioGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#2563eb', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
