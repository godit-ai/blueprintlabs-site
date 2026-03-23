import React from 'react';
import CacheHitChart from '../charts/CacheHitChart';
import CacheTable from '../cards/CacheTable';
import { prefixCacheStats } from '../../data/mockData';
import { Database, TrendingUp, Clock, Zap } from 'lucide-react';

export default function CacheTab() {
  const hitRate = (prefixCacheStats.hitRate * 100).toFixed(1);
  const avgSavingsPerHit = Math.round(prefixCacheStats.totalSavings / prefixCacheStats.totalHits);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Database size={28} className="text-brand-accent" />
          <h1 className="text-3xl font-bold text-dark-50">Prefix Cache</h1>
        </div>
        <p className="text-dark-400">
          Monitor cache performance and identify the most frequently reused system and context prefixes.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-primary/15 text-brand-primary">
              <TrendingUp size={20} />
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-success font-medium">+18.2%</p>
            </div>
          </div>
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Hit Rate</p>
          <p className="text-2xl font-bold text-dark-50">{hitRate}%</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-success/15 text-brand-success">
              <Zap size={20} />
            </div>
          </div>
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Total Hits</p>
          <p className="text-2xl font-bold text-dark-50">{prefixCacheStats.totalHits.toLocaleString()}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-secondary/15 text-brand-secondary">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Cache Misses</p>
          <p className="text-2xl font-bold text-dark-50">{prefixCacheStats.totalMisses.toLocaleString()}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-accent/15 text-brand-accent">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Avg Per Hit</p>
          <p className="text-2xl font-bold text-dark-50">{avgSavingsPerHit}</p>
          <p className="text-dark-500 text-xs mt-0.5">tokens saved</p>
        </div>
      </div>

      {/* Chart and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CacheHitChart />
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-dark-200 mb-3">Cache Performance Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </div>
              <div>
                <p className="text-sm text-dark-200 font-medium mb-0.5">High Reuse Rate</p>
                <p className="text-xs text-dark-400">
                  System prompts account for 89% of cache hits. Consistent instruction formatting maximizes reuse.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-secondary/15 text-brand-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </div>
              <div>
                <p className="text-sm text-dark-200 font-medium mb-0.5">Context Efficiency</p>
                <p className="text-xs text-dark-400">
                  Top 10 prefixes represent 62% of all hits. Optimizing frequently-used contexts yields exponential savings.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-success/15 text-brand-success flex items-center justify-center flex-shrink-0 text-xs font-bold">
                3
              </div>
              <div>
                <p className="text-sm text-dark-200 font-medium mb-0.5">Cost Impact</p>
                <p className="text-xs text-dark-400">
                  Prefix caching reduces API costs by an average of $68 per 1000 requests compared to non-cached calls.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center flex-shrink-0 text-xs font-bold">
                4
              </div>
              <div>
                <p className="text-sm text-dark-200 font-medium mb-0.5">Optimization Opportunity</p>
                <p className="text-xs text-dark-400">
                  Implementing tiered LRU eviction for low-hit entries could improve cache efficiency by 8-12%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Table */}
      <CacheTable />

      {/* Technical Details */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-dark-200 mb-2">Cache Mechanics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-dark-400 leading-relaxed">
          <div>
            <p className="mb-2">
              <strong className="text-dark-300">Storage:</strong> Prefixes are hashed and stored with metadata including
              token count, hit frequency, and last access time.
            </p>
            <p>
              <strong className="text-dark-300">Lookup:</strong> On each API request, the system prompt and initial context
              are hashed and checked against the cache before processing.
            </p>
          </div>
          <div>
            <p className="mb-2">
              <strong className="text-dark-300">Eviction:</strong> Cache entries with fewer than 5 hits over 7 days are
              automatically evicted using a modified LRU algorithm.
            </p>
            <p>
              <strong className="text-dark-300">Warming:</strong> High-priority prefixes (system prompts, common contexts)
              are pre-cached during deployment to maximize immediate hit rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
