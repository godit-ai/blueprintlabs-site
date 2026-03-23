import React from 'react';
import type { ObjectType, ExtractedObject } from '../../types';
import { useObjectMemory } from '../../hooks/usePMI';
import {
  Calendar, Users, Lightbulb, CheckCircle, Clock, Tag, Search,
} from 'lucide-react';

const typeConfig: Record<ObjectType, { icon: React.ReactNode; color: string; bg: string }> = {
  meeting: { icon: <Calendar size={14} />, color: 'text-brand-primary', bg: 'bg-brand-primary/15' },
  decision: { icon: <CheckCircle size={14} />, color: 'text-brand-success', bg: 'bg-brand-success/15' },
  fact: { icon: <Lightbulb size={14} />, color: 'text-brand-warning', bg: 'bg-brand-warning/15' },
  person: { icon: <Users size={14} />, color: 'text-brand-secondary', bg: 'bg-brand-secondary/15' },
  date: { icon: <Clock size={14} />, color: 'text-brand-accent', bg: 'bg-brand-accent/15' },
  topic: { icon: <Tag size={14} />, color: 'text-brand-error', bg: 'bg-brand-error/15' },
};

const allTypes: (ObjectType | 'all')[] = ['all', 'meeting', 'decision', 'fact', 'person', 'date', 'topic'];

function ObjectCard({ obj }: { obj: ExtractedObject }) {
  const cfg = typeConfig[obj.type];
  return (
    <div className="glass-card-hover p-4 group">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
              {obj.type}
            </span>
            <span className="text-dark-600 text-xs">•</span>
            <span className="text-dark-500 text-xs">{(obj.confidence * 100).toFixed(0)}% confidence</span>
          </div>
          <p className="text-sm text-dark-200 leading-relaxed">{obj.content}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {obj.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-400 font-medium">
                {tag}
              </span>
            ))}
            <span className="text-dark-600 text-[10px] ml-auto">
              {new Date(obj.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ObjectList() {
  const { objects, filter, setFilter, search, setSearch, total } = useObjectMemory();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            type="text"
            placeholder="Search objects, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-dark w-full pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === type
                  ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                  : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-dark-500">
        Showing {objects.length} of {total} objects
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {objects.map(obj => (
          <ObjectCard key={obj.id} obj={obj} />
        ))}
      </div>

      {objects.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-dark-400">No objects match your search.</p>
        </div>
      )}
    </div>
  );
}
