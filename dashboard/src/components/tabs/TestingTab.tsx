import React from 'react';
import LiveTesting from '../testing/LiveTesting';
import { FlaskConical, Code, Sparkles } from 'lucide-react';

export default function TestingTab() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical size={28} className="text-brand-warning" />
          <h1 className="text-3xl font-bold text-dark-50">Live Testing</h1>
        </div>
        <p className="text-dark-400">
          Test PMI compression in real-time. Input text to see compression results, extracted objects, and token savings.
        </p>
      </div>

      {/* Feature Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Code size={16} className="text-brand-primary" />
            <h4 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Real-time Analysis</h4>
          </div>
          <p className="text-xs text-dark-400">
            See instant compression results with before/after comparison and detailed token metrics.
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-brand-secondary" />
            <h4 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Object Extraction</h4>
          </div>
          <p className="text-xs text-dark-400">
            View automatically extracted entities: meetings, decisions, facts, people, dates, and topics.
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={16} className="text-brand-success" />
            <h4 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Sample Data</h4>
          </div>
          <p className="text-xs text-dark-400">
            Use pre-loaded sample texts to quickly explore PMI capabilities and compression ratios.
          </p>
        </div>
      </div>

      {/* Live Testing Component */}
      <LiveTesting />

      {/* API Integration Guide */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
          <Code size={16} className="text-brand-accent" />
          API Integration
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-dark-300 font-medium mb-1">Endpoint</p>
            <code className="block text-xs bg-dark-800 text-brand-accent px-3 py-2 rounded border border-dark-700 font-mono">
              POST https://api.blueprintlabs.co/v1/pmi/compress
            </code>
          </div>
          <div>
            <p className="text-xs text-dark-300 font-medium mb-1">Request Body</p>
            <pre className="text-xs bg-dark-800 text-dark-300 px-3 py-2 rounded border border-dark-700 font-mono overflow-x-auto">
{`{
  "text": "Your input text...",
  "options": {
    "extractObjects": true,
    "targetRatio": 3.0,
    "preserveFidelity": 0.97
  }
}`}
            </pre>
          </div>
          <div>
            <p className="text-xs text-dark-300 font-medium mb-1">Response</p>
            <pre className="text-xs bg-dark-800 text-dark-300 px-3 py-2 rounded border border-dark-700 font-mono overflow-x-auto">
{`{
  "compressed": "Compressed text...",
  "originalTokens": 450,
  "compressedTokens": 140,
  "ratio": 3.21,
  "objects": [...],
  "fidelity": 0.98
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
