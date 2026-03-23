import React from 'react';
import StatCard from '../cards/StatCard';
import CompressionChart from '../charts/CompressionChart';
import TokenSavingsChart from '../charts/TokenSavingsChart';
import CostSavingsChart from '../charts/CostSavingsChart';
import { usageStats } from '../../data/mockData';
import { Coins, Zap, Activity, DollarSign } from 'lucide-react';

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-50 mb-2">PMI Dashboard</h1>
        <p className="text-dark-400">
          Real-time monitoring of Predictive Memory Intelligence compression, object extraction, and caching performance.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tokens Saved"
          value={usageStats.totalTokensSaved.toLocaleString()}
          subtitle="Total compression savings"
          icon={<Zap size={20} />}
          trend={{ value: 12.5, label: 'vs last week' }}
          color="primary"
        />
        <StatCard
          title="Avg Compression"
          value={`${usageStats.avgCompressionRatio}x`}
          subtitle="Average ratio"
          icon={<Activity size={20} />}
          trend={{ value: 8.3, label: 'vs last week' }}
          color="secondary"
        />
        <StatCard
          title="Cost Savings"
          value={`$${usageStats.costSavings.toFixed(2)}`}
          subtitle="This month"
          icon={<DollarSign size={20} />}
          trend={{ value: 15.7, label: 'vs last month' }}
          color="success"
        />
        <StatCard
          title="API Calls"
          value={usageStats.totalApiCalls.toLocaleString()}
          subtitle="Total requests"
          icon={<Coins size={20} />}
          trend={{ value: 5.2, label: 'vs last week' }}
          color="accent"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompressionChart />
        <TokenSavingsChart />
      </div>

      <CostSavingsChart />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary" />
            <h4 className="text-sm font-semibold text-dark-200">Compression</h4>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">
            PMI analyzes conversation context and compresses redundant information while maintaining semantic meaning.
            Average 3.2x reduction in token usage.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-secondary" />
            <h4 className="text-sm font-semibold text-dark-200">Object Extraction</h4>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">
            Automatically extracts structured entities (meetings, decisions, facts, people, dates, topics) from
            conversations for efficient retrieval.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent" />
            <h4 className="text-sm font-semibold text-dark-200">Prefix Caching</h4>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">
            System and context prefixes are cached for reuse across conversations. 73% hit rate reduces
            redundant token processing.
          </p>
        </div>
      </div>
    </div>
  );
}
