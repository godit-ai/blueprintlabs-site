import React from 'react';
import { cacheEntries } from '../../data/mockData';

export default function CacheTable() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-dark-700/50">
        <h3 className="text-sm font-semibold text-dark-200">Most Cached Prefixes</h3>
        <p className="text-xs text-dark-500 mt-1">Top 10 prefixes by hit count</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/30">
              <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Prefix</th>
              <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Hits</th>
              <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Tokens Saved</th>
              <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Size</th>
              <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Last Used</th>
            </tr>
          </thead>
          <tbody>
            {cacheEntries.map((entry, i) => {
              const maxHits = cacheEntries[0].hitCount;
              const pct = (entry.hitCount / maxHits) * 100;
              return (
                <tr key={i} className="border-b border-dark-700/20 hover:bg-dark-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-dark-500 text-xs font-mono w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm text-dark-200 font-mono truncate max-w-xs">{entry.prefix}</p>
                        <div className="mt-1 h-1 rounded-full bg-dark-700 w-32">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium text-dark-200">
                    {entry.hitCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-brand-success font-medium">
                    {entry.tokensSaved.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-dark-400">
                    {entry.size} tokens
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-500 hidden sm:table-cell">
                    {new Date(entry.lastAccessed).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
