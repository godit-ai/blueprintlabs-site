import { useState, useCallback } from 'react';
import type { CompressionResult, ExtractedObject, ObjectType } from '../types';
import { extractedObjects as mockObjects } from '../data/mockData';

// Simulates PMI compression - replace with real API call
function simulateCompression(text: string): CompressionResult {
  const words = text.split(/\s+/);
  const originalTokens = Math.round(words.length * 1.3);
  const ratio = 2.5 + Math.random() * 1.5;
  const compressedTokens = Math.round(originalTokens / ratio);

  // Extract mock objects from text
  const objects: ExtractedObject[] = [];
  const patterns: { regex: RegExp; type: ObjectType }[] = [
    { regex: /(?:meeting|standup|session|review)\b.*?[.!]/gi, type: 'meeting' },
    { regex: /(?:decided|agreed|approved|decision)\b.*?[.!]/gi, type: 'decision' },
    { regex: /(?:\d+(?:\.\d+)?[xX%]|(?:reduced|improved|increased)\b).*?[.!]/gi, type: 'fact' },
    { regex: /(?:[A-Z][a-z]+\s(?:Chen|Rodriguez|Park|Smith|Johnson))/g, type: 'person' },
    { regex: /(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|(?:Monday|Tuesday|Wednesday|Thursday|Friday)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi, type: 'date' },
    { regex: /(?:GraphQL|Kubernetes|PMI|caching|compression|optimization|migration)\b/gi, type: 'topic' },
  ];

  patterns.forEach(({ regex, type }) => {
    const matches = text.match(regex);
    if (matches) {
      matches.slice(0, 3).forEach((match, i) => {
        objects.push({
          id: `ext-${type}-${i}`,
          type,
          content: match.trim(),
          confidence: 0.85 + Math.random() * 0.14,
          source: 'user-input',
          timestamp: new Date().toISOString(),
          tags: [type],
        });
      });
    }
  });

  // Generate compressed version
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const compressed = sentences
    .map(s => {
      const trimmed = s.trim();
      if (trimmed.length > 80) {
        return trimmed.substring(0, 60).trim() + '... [compressed]';
      }
      return trimmed;
    })
    .filter((_, i) => i % 2 === 0 || Math.random() > 0.3)
    .join('. ') + '.';

  return {
    original: text,
    compressed,
    objects: objects.length > 0 ? objects : [
      {
        id: 'ext-topic-0',
        type: 'topic',
        content: 'General content (no specific entities detected)',
        confidence: 0.6,
        source: 'user-input',
        timestamp: new Date().toISOString(),
        tags: ['general'],
      },
    ],
    originalTokens,
    compressedTokens,
    ratio: Number(ratio.toFixed(2)),
    savings: Number(((1 - 1 / ratio) * 100).toFixed(1)),
  };
}

export function usePMI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const compress = useCallback(async (text: string) => {
    setIsProcessing(true);
    // Simulate API latency
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    const res = simulateCompression(text);
    setResult(res);
    setIsProcessing(false);
    return res;
  }, []);

  const reset = useCallback(() => setResult(null), []);

  return { compress, result, isProcessing, reset };
}

export function useObjectMemory() {
  const [filter, setFilter] = useState<ObjectType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = mockObjects.filter(obj => {
    const matchesType = filter === 'all' || obj.type === filter;
    const matchesSearch = !search || 
      obj.content.toLowerCase().includes(search.toLowerCase()) ||
      obj.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return { objects: filtered, filter, setFilter, search, setSearch, total: mockObjects.length };
}
