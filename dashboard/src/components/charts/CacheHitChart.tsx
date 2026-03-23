import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { prefixCacheStats } from '../../data/mockData';

const data = [
  { name: 'Cache Hits', value: prefixCacheStats.totalHits, color: '#2563eb' },
  { name: 'Cache Misses', value: prefixCacheStats.totalMisses, color: '#334155' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }} />
        <span className="text-dark-400">{payload[0].name}:</span>
        <span className="font-medium text-dark-100">{payload[0].value.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default function CacheHitChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-dark-200 mb-4">Cache Hit Rate</h3>
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-dark-50">{(prefixCacheStats.hitRate * 100).toFixed(0)}%</p>
            <p className="text-xs text-dark-400">Hit Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
