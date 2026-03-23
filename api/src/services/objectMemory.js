/**
 * Object Memory System — Phase 2 of PMI Object-Based Memory Hierarchy
 *
 * Converts unstructured prose into typed, indexed objects and reconstructs
 * optimal context windows from them.
 *
 * Object types: meeting, fact, decision, person, date_event, topic
 *
 * Architecture:
 *   Prose → extract() → MemoryObject[] → ObjectStore
 *   Query → reconstruct() → optimised context string (fits token budget)
 *
 * Each object carries:  id, type, data, tokens, timestamp, provenance, tags
 */

const crypto = require('crypto');

// ─── Object Types & Extractors ────────────────────────────────────────────────

const OBJECT_TYPES = {
  meeting: {
    label: 'Meeting',
    patterns: [
      /(?:meeting|call|standup|sync|review|retro|sprint|demo|kickoff|1-on-1|one-on-one)\s+(?:with\s+)?([^.!?\n]{5,80})/gi,
      /(?:met|discussed|synced)\s+(?:with\s+)?([^.!?\n]{5,80})/gi,
      /(?:scheduled|booked|set up)\s+(?:a\s+)?(?:meeting|call)\s+([^.!?\n]{5,80})/gi
    ],
    extract(match, sentence) {
      return {
        summary: sentence.trim(),
        participants: extractNames(sentence),
        rawMatch: match[0]
      };
    }
  },
  decision: {
    label: 'Decision',
    patterns: [
      /(?:decided|agreed|resolved|committed|approved|chose|selected|went with|picked)\s+(?:to\s+)?([^.!?\n]{5,120})/gi,
      /(?:decision|verdict|conclusion|outcome):\s*([^.!?\n]{5,120})/gi
    ],
    extract(match, sentence) {
      return {
        decision: sentence.trim(),
        actors: extractNames(sentence),
        rawMatch: match[0]
      };
    }
  },
  fact: {
    label: 'Fact',
    patterns: [
      /(?:note|remember|important|key point|takeaway|fyi|heads up|update):\s*([^.!?\n]{5,200})/gi,
      /(?:turns out|it appears|confirmed|verified|discovered)\s+(?:that\s+)?([^.!?\n]{5,200})/gi
    ],
    extract(match, sentence) {
      return {
        fact: sentence.trim(),
        confidence: 'stated',
        rawMatch: match[0]
      };
    }
  },
  person: {
    label: 'Person',
    patterns: [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:is|was|will be|has been|works|leads|manages|owns|runs|handles)\s+([^.!?\n]{3,80})/g
    ],
    extract(match, sentence) {
      const commonFalsePositives = [
        'New York', 'San Francisco', 'Los Angeles', 'United States',
        'North America', 'South America', 'Last Monday', 'Next Tuesday'
      ];
      if (commonFalsePositives.includes(match[1])) return null;
      return {
        name: match[1],
        role: match[2].trim(),
        context: sentence.trim()
      };
    }
  },
  date_event: {
    label: 'Date/Event',
    patterns: [
      /(?:on|by|before|after|due|deadline)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})\s*[,:]?\s*([^.!?\n]{0,100})/gi,
      /(?:on|by|before|after|due|deadline)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[,:]?\s*([^.!?\n]{0,100})/gi,
      /(next|this|last)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|month)\s*[,:]?\s*([^.!?\n]{0,80})/gi
    ],
    extract(match, sentence) {
      return {
        dateRef: (match[1] + (match[2] ? ' ' + match[2] : '')).trim(),
        event: sentence.trim()
      };
    }
  },
  topic: {
    label: 'Topic',
    patterns: [
      /(?:regarding|about|re:|topic:|subject:)\s+([^.!?\n]{3,80})/gi,
      /(?:we need to|let's|should)\s+(?:discuss|talk about|address|revisit|review)\s+([^.!?\n]{3,80})/gi
    ],
    extract(match, sentence) {
      return {
        topic: match[1].trim(),
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  // Additional object types for broader coverage
  task: {
    label: 'Task',
    patterns: [
      /(?:todo|task|action item|follow up|follow-up):?\s*([^.!?\n]{5,120})/gi,
      /(?:need to|should|must|have to)\s+([^.!?\n]{5,120})/gi,
      /(?:assigned|delegated)\s+(?:to\s+)?([^.!?\n]{5,120})/gi
    ],
    extract(match, sentence) {
      return {
        task: match[1].trim(),
        assignee: extractNames(sentence)[0] || null,
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  question: {
    label: 'Question',
    patterns: [
      /\b(what|how|why|when|where|who|can|could|would|will)\s+([^?]{5,150}\?)/gi,
      /(?:question|q):?\s*([^.!?\n]{5,150})/gi
    ],
    extract(match, sentence) {
      return {
        question: (match[1] + ' ' + match[2]).trim(),
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  code_snippet: {
    label: 'Code',
    patterns: [
      /```[\s\S]*?```/g,
      /`[^`]+`/g,
      /(?:error|exception|bug|issue):?\s*([^.!?\n]{10,200})/gi,
      /(?:function|method|class|api|endpoint)\s+([^.!?\n]{5,100})/gi
    ],
    extract(match, sentence) {
      return {
        code: match[0],
        type: match[0].startsWith('```') ? 'block' : 'inline',
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  metric: {
    label: 'Metric',
    patterns: [
      /(\d+(?:\.\d+)?)\s*(%|percent|percentage)/gi,
      /(\$[\d,]+(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*)\s*(users|customers|revenue|sales|conversions|clicks|views)/gi,
      /(?:kpi|metric|measurement|benchmark):?\s*([^.!?\n]{5,80})/gi
    ],
    extract(match, sentence) {
      return {
        value: match[1],
        unit: match[2] || 'count',
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  requirement: {
    label: 'Requirement',
    patterns: [
      /(?:requirement|spec|specification|must|shall|need to support):?\s*([^.!?\n]{10,150})/gi,
      /(?:should|must|needs to)\s+(?:support|handle|work with|be compatible with|integrate with)\s+([^.!?\n]{10,100})/gi
    ],
    extract(match, sentence) {
      return {
        requirement: match[1].trim(),
        priority: sentence.includes('must') || sentence.includes('shall') ? 'high' : 'medium',
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  risk: {
    label: 'Risk',
    patterns: [
      /(?:risk|concern|warning|caution|watch out|be careful):?\s*([^.!?\n]{10,150})/gi,
      /(?:might|could|may)\s+(?:delay|fail|break|cause|impact|affect)\s+([^.!?\n]{10,150})/gi
    ],
    extract(match, sentence) {
      return {
        risk: match[1].trim(),
        severity: sentence.includes('critical') || sentence.includes('blocker') ? 'high' : 'medium',
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  opportunity: {
    label: 'Opportunity',
    patterns: [
      /(?:opportunity|upside|potential|could|might be able to)\s+(?:expand|grow|increase|improve|enter|launch)\s+([^.!?\n]{10,150})/gi,
      /(?:consider|explore|look into)\s+([^.!?\n]{10,100})/gi
    ],
    extract(match, sentence) {
      return {
        opportunity: match[1].trim(),
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  file_reference: {
    label: 'File',
    patterns: [
      /([\w\-]+\.(pdf|doc|docx|txt|csv|xlsx|json|js|ts|py|md|html|css))/gi,
      /(?:see|check|review|attached|in)\s+(?:the\s+)?(?:file|document|doc|spreadsheet)?\s*:?\s*([^.!?\n]{5,80})/gi
    ],
    extract(match, sentence) {
      return {
        filename: match[1] || match[0],
        type: match[2] || 'unknown',
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  },

  location: {
    label: 'Location',
    patterns: [
      /(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)/g,
      /(?:office|location|site|branch|hq|headquarters)\s+(?:in|at)?\s*:?\s*([^.!?\n]{3,50})/gi
    ],
    extract(match, sentence) {
      const commonFalsePositives = ['The', 'This', 'That', 'Next', 'Last', 'First'];
      if (commonFalsePositives.includes(match[1])) return null;
      return {
        location: match[1].trim(),
        context: sentence.trim(),
        rawMatch: match[0]
      };
    }
  }
    ],
    extract(match, sentence) {
      return {
        topic: match[1].trim(),
        context: sentence.trim()
      };
    }
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractNames(text) {
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  const stopWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
    'December', 'New', 'San', 'Los', 'North', 'South', 'East', 'West',
    'However', 'Furthermore', 'Additionally', 'Therefore', 'Note', 'Important',
    'Update', 'Meeting', 'Decision', 'Action', 'Item'
  ]);
  const names = [];
  let m;
  while ((m = namePattern.exec(text)) !== null) {
    if (!stopWords.has(m[1].split(' ')[0]) && m[1].length > 2) {
      names.push(m[1]);
    }
  }
  return [...new Set(names)];
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function estimateTokens(text) {
  return Math.ceil((typeof text === 'string' ? text : JSON.stringify(text)).length / 4);
}

// ─── MemoryObject ─────────────────────────────────────────────────────────────

class MemoryObject {
  constructor(type, data, provenance) {
    this.id = generateId();
    this.type = type;
    this.label = OBJECT_TYPES[type]?.label || type;
    this.data = data;
    this.tokens = estimateTokens(JSON.stringify(data));
    this.timestamp = new Date().toISOString();
    this.provenance = provenance; // { source, offset, length }
    this.tags = this._autoTag();
  }

  _autoTag() {
    const tags = [this.type];
    const text = JSON.stringify(this.data).toLowerCase();
    if (text.includes('urgent') || text.includes('asap') || text.includes('critical')) tags.push('urgent');
    if (text.includes('action') || text.includes('todo') || text.includes('task')) tags.push('action-item');
    if (text.includes('budget') || text.includes('cost') || text.includes('price') || text.includes('$')) tags.push('financial');
    return tags;
  }

  toCompact() {
    return `[${this.label}|${this.id.slice(0, 6)}] ${this._summarize()}`;
  }

  _summarize() {
    switch (this.type) {
      case 'meeting':
        return `${this.data.summary}${this.data.participants?.length ? ' (w/ ' + this.data.participants.join(', ') + ')' : ''}`;
      case 'decision':
        return this.data.decision;
      case 'fact':
        return this.data.fact;
      case 'person':
        return `${this.data.name}: ${this.data.role}`;
      case 'date_event':
        return `${this.data.dateRef} — ${this.data.event}`;
      case 'topic':
        return this.data.topic;
      default:
        return JSON.stringify(this.data).slice(0, 100);
    }
  }
}

// ─── ObjectStore ──────────────────────────────────────────────────────────────

class ObjectStore {
  constructor() {
    /** @type {MemoryObject[]} */
    this.objects = [];
    this.index = {
      byType: {},   // type → [id]
      byTag: {},    // tag → [id]
      byId: {}      // id → MemoryObject
    };
  }

  add(obj) {
    this.objects.push(obj);
    this.index.byId[obj.id] = obj;
    if (!this.index.byType[obj.type]) this.index.byType[obj.type] = [];
    this.index.byType[obj.type].push(obj.id);
    for (const tag of obj.tags) {
      if (!this.index.byTag[tag]) this.index.byTag[tag] = [];
      this.index.byTag[tag].push(obj.id);
    }
  }

  query({ types, tags, limit, maxTokens } = {}) {
    let candidates = this.objects;
    if (types?.length) candidates = candidates.filter(o => types.includes(o.type));
    if (tags?.length) candidates = candidates.filter(o => o.tags.some(t => tags.includes(t)));

    // Sort by recency (newest first)
    candidates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply token budget
    if (maxTokens) {
      let tokenBudget = maxTokens;
      const result = [];
      for (const obj of candidates) {
        if (obj.tokens <= tokenBudget) {
          result.push(obj);
          tokenBudget -= obj.tokens;
        }
        if (tokenBudget <= 0) break;
      }
      return result;
    }

    if (limit) candidates = candidates.slice(0, limit);
    return candidates;
  }

  getStats() {
    const typeCounts = {};
    let totalTokens = 0;
    for (const obj of this.objects) {
      typeCounts[obj.type] = (typeCounts[obj.type] || 0) + 1;
      totalTokens += obj.tokens;
    }
    return { totalObjects: this.objects.length, totalTokens, typeCounts };
  }

  clear() {
    this.objects = [];
    this.index = { byType: {}, byTag: {}, byId: {} };
  }
}

// ─── Extractor Pipeline ───────────────────────────────────────────────────────

/**
 * Extract structured objects from prose text.
 * @param {string} text - Raw prose / conversation
 * @param {Object} opts - { source: string }
 * @returns {{ objects: MemoryObject[], stats: Object }}
 */
function extract(text, opts = {}) {
  const source = opts.source || 'api';
  const objects = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const [type, config] of Object.entries(OBJECT_TYPES)) {
    for (const pattern of config.patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Find the sentence containing this match
        const matchStart = match.index;
        const sentence = sentences.find((s, i) => {
          const offset = text.indexOf(s);
          return matchStart >= offset && matchStart < offset + s.length;
        }) || match[0];

        const data = config.extract(match, sentence);
        if (data) {
          const obj = new MemoryObject(type, data, {
            source,
            offset: match.index,
            length: match[0].length
          });
          objects.push(obj);
        }
      }
    }
  }

  // Deduplicate: if two objects of the same type share >80% of their summary text, keep the longer one
  const deduped = deduplicateObjects(objects);

  const originalTokens = estimateTokens(text);
  const objectTokens = deduped.reduce((sum, o) => sum + o.tokens, 0);

  return {
    objects: deduped,
    stats: {
      originalTokens,
      objectTokens,
      compressionRatio: originalTokens > 0
        ? Math.round(((originalTokens - objectTokens) / originalTokens) * 1000) / 10
        : 0,
      objectCount: deduped.length,
      typeBreakdown: deduped.reduce((acc, o) => { acc[o.type] = (acc[o.type] || 0) + 1; return acc; }, {})
    }
  };
}

function deduplicateObjects(objects) {
  const seen = new Map(); // type+summary → obj
  const result = [];

  for (const obj of objects) {
    const summary = obj.toCompact();
    const key = obj.type;
    let dominated = false;

    for (const [existingSummary, existingObj] of seen) {
      if (existingObj.type !== key) continue;
      const overlap = stringSimilarity(summary, existingSummary);
      if (overlap > 0.8) {
        // Keep the longer (more informative) one
        if (summary.length > existingSummary.length) {
          const idx = result.indexOf(existingObj);
          if (idx >= 0) result[idx] = obj;
          seen.delete(existingSummary);
          seen.set(summary, obj);
        }
        dominated = true;
        break;
      }
    }

    if (!dominated) {
      result.push(obj);
      seen.set(summary, obj);
    }
  }

  return result;
}

function stringSimilarity(a, b) {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  // Simple containment + length ratio check
  const containment = longer.toLowerCase().includes(shorter.toLowerCase()) ? 0.5 : 0;
  const lengthRatio = shorter.length / longer.length;
  // Bigram overlap
  const bigramsA = new Set();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2).toLowerCase());
  let shared = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (bigramsA.has(b.slice(i, i + 2).toLowerCase())) shared++;
  }
  const bigramScore = (2 * shared) / (a.length - 1 + b.length - 1) || 0;
  return Math.max(containment + lengthRatio * 0.5, bigramScore);
}

// ─── Context Reconstruction ───────────────────────────────────────────────────

/**
 * Reconstruct an optimised context string from stored objects.
 *
 * @param {ObjectStore} store
 * @param {Object} opts
 *   - tokenBudget: max tokens for reconstructed context (default 2000)
 *   - types: filter by object types
 *   - tags: filter by tags
 *   - format: 'compact' | 'full' | 'structured'
 * @returns {{ context: string, tokens: number, objectsUsed: number, savings: Object }}
 */
function reconstruct(store, opts = {}) {
  const tokenBudget = opts.tokenBudget || 2000;
  const format = opts.format || 'compact';

  const objects = store.query({
    types: opts.types,
    tags: opts.tags,
    maxTokens: tokenBudget
  });

  let context;
  switch (format) {
    case 'structured':
      context = reconstructStructured(objects);
      break;
    case 'full':
      context = reconstructFull(objects);
      break;
    case 'compact':
    default:
      context = reconstructCompact(objects);
  }

  const contextTokens = estimateTokens(context);
  const storeStats = store.getStats();

  return {
    context,
    tokens: contextTokens,
    objectsUsed: objects.length,
    totalObjects: storeStats.totalObjects,
    savings: {
      originalTokens: storeStats.totalTokens,
      reconstructedTokens: contextTokens,
      reduction: storeStats.totalTokens > 0
        ? Math.round(((storeStats.totalTokens - contextTokens) / storeStats.totalTokens) * 1000) / 10
        : 0
    }
  };
}

function reconstructCompact(objects) {
  if (objects.length === 0) return '(no relevant context)';

  // Group by type
  const grouped = {};
  for (const obj of objects) {
    if (!grouped[obj.label]) grouped[obj.label] = [];
    grouped[obj.label].push(obj.toCompact());
  }

  const lines = [];
  for (const [label, items] of Object.entries(grouped)) {
    lines.push(`## ${label}s`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

function reconstructFull(objects) {
  if (objects.length === 0) return '(no relevant context)';
  return objects.map(obj => {
    return `[${obj.label} ${obj.id.slice(0, 6)}] (${obj.timestamp})\n${JSON.stringify(obj.data, null, 2)}`;
  }).join('\n\n');
}

function reconstructStructured(objects) {
  if (objects.length === 0) return JSON.stringify({ objects: [], summary: 'No relevant context' });
  return JSON.stringify({
    objectCount: objects.length,
    objects: objects.map(o => ({
      id: o.id,
      type: o.type,
      tokens: o.tokens,
      timestamp: o.timestamp,
      tags: o.tags,
      data: o.data
    }))
  }, null, 2);
}

// ─── Full Pipeline: prose → objects → optimal context ─────────────────────────

/**
 * End-to-end: take raw prose, extract objects, reconstruct optimised context.
 * This is the main API entry point for Phase 2.
 *
 * @param {string} text - Raw prose
 * @param {Object} opts
 *   - tokenBudget: max tokens for output (default 2000)
 *   - format: 'compact' | 'full' | 'structured'
 *   - source: provenance label
 * @returns {Object} Complete pipeline result
 */
function processMemory(text, opts = {}) {
  const startTime = Date.now();

  // Step 1: Extract objects
  const { objects, stats: extractionStats } = extract(text, { source: opts.source || 'api' });

  // Step 2: Store
  const store = new ObjectStore();
  for (const obj of objects) store.add(obj);

  // Step 3: Reconstruct
  const reconstruction = reconstruct(store, {
    tokenBudget: opts.tokenBudget || 2000,
    format: opts.format || 'compact',
    types: opts.types,
    tags: opts.tags
  });

  const processingTime = Date.now() - startTime;
  const originalTokens = estimateTokens(text);

  return {
    extraction: {
      objectCount: objects.length,
      objects: objects.map(o => ({
        id: o.id,
        type: o.type,
        label: o.label,
        tokens: o.tokens,
        tags: o.tags,
        summary: o.toCompact(),
        data: o.data
      })),
      stats: extractionStats
    },
    reconstruction: {
      context: reconstruction.context,
      tokens: reconstruction.tokens,
      objectsUsed: reconstruction.objectsUsed
    },
    costAnalysis: {
      originalTokens,
      naiveCost: `$${((originalTokens / 1_000_000) * 3.00).toFixed(6)}`,
      objectMemoryCost: `$${((reconstruction.tokens / 1_000_000) * 3.00).toFixed(6)}`,
      savings: {
        tokensReduced: originalTokens - reconstruction.tokens,
        percentReduction: originalTokens > 0
          ? Math.round(((originalTokens - reconstruction.tokens) / originalTokens) * 1000) / 10
          : 0,
        costSavedPerRequest: `$${(((originalTokens - reconstruction.tokens) / 1_000_000) * 3.00).toFixed(6)}`,
        monthlySavingsAt1kRPD: `$${(((originalTokens - reconstruction.tokens) / 1_000_000) * 3.00 * 1000 * 30).toFixed(2)}`
      }
    },
    processingTime: `${processingTime}ms`
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  extract,
  reconstruct,
  processMemory,
  ObjectStore,
  MemoryObject,
  OBJECT_TYPES,
  // Expose internals for testing
  _internals: {
    extractNames,
    deduplicateObjects,
    stringSimilarity,
    estimateTokens,
    generateId
  }
};
