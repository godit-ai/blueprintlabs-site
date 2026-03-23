import React from 'react';
import ObjectList from '../memory/ObjectList';
import { extractedObjects } from '../../data/mockData';
import { Brain, Calendar, Users, Lightbulb, CheckCircle, Clock, Tag } from 'lucide-react';

const typeStats = extractedObjects.reduce<Record<string, number>>((acc, obj) => {
  acc[obj.type] = (acc[obj.type] || 0) + 1;
  return acc;
}, {});

const statCards = [
  { type: 'meeting', icon: <Calendar size={16} />, color: 'text-brand-primary bg-brand-primary/15' },
  { type: 'decision', icon: <CheckCircle size={16} />, color: 'text-brand-success bg-brand-success/15' },
  { type: 'fact', icon: <Lightbulb size={16} />, color: 'text-brand-warning bg-brand-warning/15' },
  { type: 'person', icon: <Users size={16} />, color: 'text-brand-secondary bg-brand-secondary/15' },
  { type: 'date', icon: <Clock size={16} />, color: 'text-brand-accent bg-brand-accent/15' },
  { type: 'topic', icon: <Tag size={16} />, color: 'text-brand-error bg-brand-error/15' },
];

export default function MemoryTab() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Brain size={28} className="text-brand-secondary" />
          <h1 className="text-3xl font-bold text-dark-50">Object Memory</h1>
        </div>
        <p className="text-dark-400">
          Structured entities automatically extracted from conversations and stored for semantic search and reconstruction.
        </p>
      </div>

      {/* Type Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ type, icon, color }) => (
          <div key={type} className="glass-card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} mb-2`}>
              {icon}
            </div>
            <p className="text-xs text-dark-400 uppercase tracking-wider mb-0.5 capitalize">{type}</p>
            <p className="text-xl font-bold text-dark-50">{typeStats[type] || 0}</p>
          </div>
        ))}
      </div>

      {/* Object List */}
      <ObjectList />

      {/* Info */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-dark-200 mb-2">How Object Memory Works</h4>
        <div className="space-y-2 text-xs text-dark-400 leading-relaxed">
          <p>
            <strong className="text-dark-300">Extraction:</strong> PMI analyzes conversation text using NLP patterns to identify
            structured entities like meetings, decisions, facts, people, dates, and topics.
          </p>
          <p>
            <strong className="text-dark-300">Confidence Scoring:</strong> Each extracted object receives a confidence score
            (0-100%) based on pattern match quality and context validation.
          </p>
          <p>
            <strong className="text-dark-300">Semantic Storage:</strong> Objects are stored with embeddings in a vector database,
            enabling fast semantic search and intelligent reconstruction.
          </p>
          <p>
            <strong className="text-dark-300">Reconstruction:</strong> When context is needed, PMI retrieves relevant objects
            and reconstructs compressed information with 97% fidelity while using 68% fewer tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
