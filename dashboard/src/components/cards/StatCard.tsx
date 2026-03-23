import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'secondary' | 'accent';
}

const colorMap = {
  primary: 'from-brand-primary/20 to-brand-primary/5',
  success: 'from-brand-success/20 to-brand-success/5',
  warning: 'from-brand-warning/20 to-brand-warning/5',
  secondary: 'from-brand-secondary/20 to-brand-secondary/5',
  accent: 'from-brand-accent/20 to-brand-accent/5',
};

const iconBgMap = {
  primary: 'bg-brand-primary/15 text-brand-primary',
  success: 'bg-brand-success/15 text-brand-success',
  warning: 'bg-brand-warning/15 text-brand-warning',
  secondary: 'bg-brand-secondary/15 text-brand-secondary',
  accent: 'bg-brand-accent/15 text-brand-accent',
};

export default function StatCard({ title, value, subtitle, icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <div className="glass-card-hover p-5 stat-glow">
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colorMap[color]} opacity-50`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgMap[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.value > 0 ? 'text-brand-success' : trend.value < 0 ? 'text-brand-error' : 'text-dark-400'
            }`}>
              {trend.value > 0 ? <TrendingUp size={14} /> : trend.value < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-dark-50">{value}</p>
        {subtitle && <p className="text-dark-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
