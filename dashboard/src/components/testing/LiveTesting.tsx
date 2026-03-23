import React, { useState } from 'react';
import { usePMI } from '../../hooks/usePMI';
import { sampleTexts } from '../../data/mockData';
import type { ObjectType } from '../../types';
import {
  Zap, RotateCcw, ArrowRight, Loader2,
  Calendar, Users, Lightbulb, CheckCircle, Clock, Tag,
} from 'lucide-react';

const typeIcons: Record<ObjectType, React.ReactNode> = {
  meeting: <Calendar size={12} />,
  decision: <CheckCircle size={12} />,
  fact: <Lightbulb size={12} />,
  person: <Users size={12} />,
  date: <Clock size={12} />,
  topic: <Tag size={12} />,
};

const typeColors: Record<ObjectType, string> = {
  meeting: 'text-brand-primary bg-brand-primary/15',
  decision: 'text-brand-success bg-brand-success/15',
  fact: 'text-brand-warning bg-brand-warning/15',
  person: 'text-brand-secondary bg-brand-secondary/15',
  date: 'text-brand-accent bg-brand-accent/15',
  topic: 'text-brand-error bg-brand-error/15',
};

export default function LiveTesting() {
  const [input, setInput] = useState('');
  const { compress, result, isProcessing, reset } = usePMI();

  const handleCompress = () => {
    if (input.trim()) compress(input);
  };

  const loadSample = (i: number) => {
    setInput(sampleTexts[i]);
    reset();
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-dark-200">Input Text</h3>
          <div className="flex gap-2">
            {sampleTexts.map((_, i) => (
              <button
                key={i}
                onClick={() => loadSample(i)}
                className="text-xs px-2.5 py-1 rounded bg-dark-700 text-dark-400 hover:text-dark-200 hover:bg-dark-600 transition-all"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste or type text to analyze with PMI compression..."
          className="input-dark w-full h-36 resize-none font-mono text-sm"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-dark-500">
            {input.split(/\s+/).filter(Boolean).length} words · ~{Math.round(input.split(/\s+/).filter(Boolean).length * 1.3)} tokens
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setInput(''); reset(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-dark-700 text-dark-400 hover:text-dark-200 transition-all"
            >
              <RotateCcw size={14} /> Clear
            </button>
            <button
              onClick={handleCompress}
              disabled={!input.trim() || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-primary to-brand-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-brand-primary/25"
            >
              {isProcessing ? (
                <><Loader2 size={14} className="animate-spin" /> Processing...</>
              ) : (
                <><Zap size={14} /> Compress</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-dark-400 mb-0.5">Original</p>
              <p className="text-lg font-bold text-dark-200">{result.originalTokens.toLocaleString()}</p>
              <p className="text-[10px] text-dark-500">tokens</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-dark-400 mb-0.5">Compressed</p>
              <p className="text-lg font-bold text-brand-primary">{result.compressedTokens.toLocaleString()}</p>
              <p className="text-[10px] text-dark-500">tokens</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-dark-400 mb-0.5">Ratio</p>
              <p className="text-lg font-bold text-brand-secondary">{result.ratio}x</p>
              <p className="text-[10px] text-dark-500">compression</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-dark-400 mb-0.5">Savings</p>
              <p className="text-lg font-bold text-brand-success">{result.savings}%</p>
              <p className="text-[10px] text-dark-500">reduction</p>
            </div>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Original</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-500">{result.originalTokens} tokens</span>
              </div>
              <p className="text-sm text-dark-300 leading-relaxed font-mono whitespace-pre-wrap">{result.original}</p>
            </div>
            <div className="glass-card p-5 border-brand-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Compressed</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/15 text-brand-primary">{result.compressedTokens} tokens</span>
                <ArrowRight size={12} className="text-dark-600" />
                <span className="text-[10px] text-brand-success font-medium">-{result.savings}%</span>
              </div>
              <p className="text-sm text-dark-300 leading-relaxed font-mono whitespace-pre-wrap">{result.compressed}</p>
            </div>
          </div>

          {/* Extracted Objects */}
          <div className="glass-card p-5">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">
              Extracted Objects ({result.objects.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.objects.map(obj => (
                <div key={obj.id} className="flex items-start gap-2.5 p-3 rounded-lg bg-dark-800/50 border border-dark-700/30">
                  <span className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${typeColors[obj.type]}`}>
                    {typeIcons[obj.type]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold uppercase ${typeColors[obj.type].split(' ')[0]}`}>
                        {obj.type}
                      </span>
                      <span className="text-dark-600 text-[10px]">{(obj.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-dark-300 leading-relaxed">{obj.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
