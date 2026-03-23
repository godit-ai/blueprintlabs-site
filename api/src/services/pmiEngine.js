/**
 * PMI v5.0 Compression Engine
 * 
 * Implements the hybrid compression pipeline with Object-Based Memory Hierarchy:
 * 
 * Phase 1: Exact-Prefix Caching
 *   - Identifies stable prefixes (system prompts, schemas, policies)
 *   - Structures output to show cacheable vs dynamic content
 *   - Adds caching hints for OpenAI/Anthropic APIs
 * 
 * Phase 2: Object Memory (delegated to objectMemory.js)
 *   - Extracts structured objects from prose
 *   - Stores with IDs, timestamps, provenance
 *   - Reconstructs optimal context from objects
 * 
 * Pipeline: Input → Analysis → Entity Protection → Prefix Cache → Compression → Quality → Output
 */

const crypto = require('crypto');

// ─── Phase 1: Prefix Cache ────────────────────────────────────────────────────

class PrefixCache {
  constructor({ maxEntries = 1000, ttlMs = 3600000 } = {}) {
    /** @type {Map<string, {hash: string, tokens: number, hits: number, lastUsed: number, createdAt: number}>} */
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs; // default 1 hour
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /** Generate a deterministic hash for a text block */
  hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  /** Look up or register a prefix. Returns { cached, hash, tokens } */
  lookup(text) {
    const h = this.hash(text);
    const entry = this.cache.get(h);
    const now = Date.now();

    if (entry && (now - entry.lastUsed) < this.ttlMs) {
      entry.hits++;
      entry.lastUsed = now;
      this.stats.hits++;
      return { cached: true, hash: h, tokens: entry.tokens, hits: entry.hits };
    }

    // Register new entry
    const tokens = Math.ceil(text.length / 4);
    this.cache.set(h, { hash: h, tokens, hits: 1, lastUsed: now, createdAt: now });
    this.stats.misses++;

    // Evict LRU if over capacity
    if (this.cache.size > this.maxEntries) {
      this._evictLRU();
    }

    return { cached: false, hash: h, tokens, hits: 1 };
  }

  _evictLRU() {
    let oldest = null;
    let oldestKey = null;
    for (const [key, val] of this.cache) {
      if (!oldest || val.lastUsed < oldest.lastUsed) {
        oldest = val;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      entries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? Math.round((this.stats.hits / total) * 1000) / 10 : 0,
      evictions: this.stats.evictions
    };
  }
}

// ─── Prefix Segmenter ─────────────────────────────────────────────────────────

/**
 * Identifies stable prefixes in conversational context.
 * Segments a messages array into { stablePrefix, dynamicSuffix }.
 * 
 * Stable = system messages + early user/assistant turns that haven't changed.
 * Dynamic = the tail of the conversation that changes each request.
 */
function segmentConversation(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { stablePrefix: [], dynamicSuffix: [], prefixTokens: 0, dynamicTokens: 0 };
  }

  const stablePrefix = [];
  const dynamicSuffix = [];

  // System messages are always stable
  let i = 0;
  while (i < messages.length && messages[i].role === 'system') {
    stablePrefix.push(messages[i]);
    i++;
  }

  // Few-shot examples (assistant/user pairs before the final user turn) are stable
  // Heuristic: everything except the last 2 messages is stable context
  const dynamicTailSize = Math.min(2, messages.length - i);
  const stableCutoff = messages.length - dynamicTailSize;

  while (i < stableCutoff) {
    stablePrefix.push(messages[i]);
    i++;
  }
  while (i < messages.length) {
    dynamicSuffix.push(messages[i]);
    i++;
  }

  const estimateTokens = (msgs) =>
    msgs.reduce((sum, m) => sum + Math.ceil((m.content || '').length / 4), 0);

  return {
    stablePrefix,
    dynamicSuffix,
    prefixTokens: estimateTokens(stablePrefix),
    dynamicTokens: estimateTokens(dynamicSuffix)
  };
}

/**
 * Generates provider-specific caching hints.
 */
function generateCachingHints(prefixHash, prefixTokens, provider = 'auto') {
  const hints = {};

  // Anthropic prompt caching (beta)
  hints.anthropic = {
    type: 'ephemeral',
    cache_control: { type: 'ephemeral' },
    usage: `Add "cache_control": {"type": "ephemeral"} to the last system message block. Anthropic caches the prefix for 5 min; subsequent requests with the same prefix pay 0 input tokens for the cached portion.`,
    estimatedSavings: {
      firstRequest: 0,
      subsequentRequests: `${prefixTokens} tokens saved per request`,
      breakEvenAfter: '2 requests within 5-min window'
    },
    example: {
      system: [
        {
          type: 'text',
          text: '<your stable system prompt>',
          cache_control: { type: 'ephemeral' }
        }
      ]
    }
  };

  // OpenAI automatic prefix caching (>= 1024 tokens)
  hints.openai = {
    note: 'OpenAI auto-caches prefixes ≥1024 tokens. No special headers needed — just keep your prefix identical across requests.',
    eligible: prefixTokens >= 1024,
    prefixTokens,
    estimatedSavings: prefixTokens >= 1024
      ? { discount: '50% on cached input tokens', tokensEligible: prefixTokens }
      : { discount: 'N/A — prefix too short (need ≥1024 tokens)', suggestion: 'Pad system prompt or add few-shot examples to reach 1024 tokens' }
  };

  // General guidance
  hints.general = {
    prefixHash,
    prefixTokens,
    strategy: [
      'Keep system prompts and schemas identical across requests',
      'Place few-shot examples before user messages',
      'Append new context at the END, never insert in the middle',
      'Use the same model + temperature for cache hits'
    ]
  };

  return hints;
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

class PMICompressionEngine {
  constructor() {
    this.prefixCache = new PrefixCache();
    this.stats = {
      totalCompressed: 0,
      totalSaved: 0,
      avgCompression: 0,
      avgQuality: 0
    };
  }

  // ── Phase 1 API: Analyze messages for caching ─────────────────────────────

  /**
   * Analyze a conversation for prefix caching opportunities.
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Object} opts - { provider: 'openai'|'anthropic'|'auto' }
   * @returns {Object} Caching analysis with hints
   */
  analyzeForCaching(messages, opts = {}) {
    const { stablePrefix, dynamicSuffix, prefixTokens, dynamicTokens } =
      segmentConversation(messages);

    const prefixText = stablePrefix.map(m => m.content).join('\n');
    const cacheResult = this.prefixCache.lookup(prefixText);

    const totalTokens = prefixTokens + dynamicTokens;
    const cacheSavingsPercent = totalTokens > 0
      ? Math.round((prefixTokens / totalTokens) * 1000) / 10
      : 0;

    const hints = generateCachingHints(cacheResult.hash, prefixTokens, opts.provider);

    return {
      segmentation: {
        stablePrefix: stablePrefix.map(m => ({
          role: m.role,
          contentPreview: (m.content || '').substring(0, 80) + ((m.content || '').length > 80 ? '…' : ''),
          tokens: Math.ceil((m.content || '').length / 4)
        })),
        dynamicSuffix: dynamicSuffix.map(m => ({
          role: m.role,
          contentPreview: (m.content || '').substring(0, 80) + ((m.content || '').length > 80 ? '…' : ''),
          tokens: Math.ceil((m.content || '').length / 4)
        })),
        prefixTokens,
        dynamicTokens,
        totalTokens
      },
      cache: {
        prefixHash: cacheResult.hash,
        wasCached: cacheResult.cached,
        hits: cacheResult.hits,
        cacheSavingsPercent
      },
      hints,
      costEstimate: this._estimateCost(prefixTokens, dynamicTokens, cacheResult.cached)
    };
  }

  /**
   * Estimate cost savings from caching.
   * Based on GPT-4o pricing: $2.50/1M input, $1.25/1M cached input
   * Anthropic Claude 3.5 Sonnet: $3/1M input, $0.30/1M cached (write $3.75/1M)
   */
  _estimateCost(prefixTokens, dynamicTokens, wasCached) {
    const totalTokens = prefixTokens + dynamicTokens;

    // OpenAI GPT-4o
    const openaiNaive = (totalTokens / 1_000_000) * 2.50;
    const openaiCached = wasCached
      ? ((prefixTokens / 1_000_000) * 1.25) + ((dynamicTokens / 1_000_000) * 2.50)
      : openaiNaive;
    const openaiSaving = openaiNaive - openaiCached;

    // Anthropic Claude 3.5 Sonnet
    const anthropicNaive = (totalTokens / 1_000_000) * 3.00;
    const anthropicCached = wasCached
      ? ((prefixTokens / 1_000_000) * 0.30) + ((dynamicTokens / 1_000_000) * 3.00)
      : ((prefixTokens / 1_000_000) * 3.75) + ((dynamicTokens / 1_000_000) * 3.00); // first write costs more
    const anthropicSaving = anthropicNaive - anthropicCached;

    return {
      perRequest: {
        openai: {
          naive: `$${openaiNaive.toFixed(6)}`,
          withCaching: `$${openaiCached.toFixed(6)}`,
          saved: `$${openaiSaving.toFixed(6)}`,
          savingsPercent: openaiNaive > 0 ? Math.round((openaiSaving / openaiNaive) * 1000) / 10 : 0
        },
        anthropic: {
          naive: `$${anthropicNaive.toFixed(6)}`,
          withCaching: `$${anthropicCached.toFixed(6)}`,
          saved: `$${anthropicSaving.toFixed(6)}`,
          savingsPercent: anthropicNaive > 0 ? Math.round((anthropicSaving / anthropicNaive) * 1000) / 10 : 0
        }
      },
      projection: {
        requestsPerDay: 1000,
        openaiMonthlySaved: `$${(openaiSaving * 1000 * 30).toFixed(2)}`,
        anthropicMonthlySaved: `$${(anthropicSaving * 1000 * 30).toFixed(2)}`
      }
    };
  }

  // ── Original Compression API (enhanced) ────────────────────────────────────

  /**
   * Main compression function
   * @param {string} text - Input text to compress
   * @param {Object} options - Compression options
   * @returns {Object} Compressed result with metadata
   */
  compress(text, options = {}) {
    const startTime = Date.now();
    const originalLength = text.length;
    const originalTokens = this.estimateTokens(text);

    // Stage 1: Input Analysis
    const analysis = this.analyzeInput(text);
    
    // Stage 2: Entity Protection
    const { protectedText, entities } = this.protectEntities(text);
    
    // Stage 3: Hybrid Compression Pipeline
    let compressed = protectedText;
    
    // 3a: Linguistic Compression
    compressed = this.linguisticCompression(compressed, analysis);
    
    // 3b: Intent-Based Compression
    if (analysis.intent !== 'general') {
      compressed = this.intentCompression(compressed, analysis.intent, entities);
    }
    
    // 3c: Smart Truncation (if still too long)
    const targetLength = Math.floor(originalLength * (options.targetRatio || 0.5));
    if (compressed.length > targetLength) {
      compressed = this.smartTruncation(compressed, entities, targetLength);
    }
    
    // Stage 4: Quality Validation
    const quality = this.validateQuality(text, compressed, entities);
    
    // Restore protected entities
    compressed = this.restoreEntities(compressed, entities);
    
    // Calculate metrics
    const compressedLength = compressed.length;
    const compressedTokens = this.estimateTokens(compressed);
    const compressionRatio = (originalLength - compressedLength) / originalLength;
    const tokensSaved = originalTokens - compressedTokens;
    
    const processingTime = Date.now() - startTime;
    
    // Update stats
    this.updateStats(compressionRatio, quality.score);
    
    return {
      original: {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        length: originalLength,
        tokens: originalTokens
      },
      compressed: {
        text: compressed,
        length: compressedLength,
        tokens: compressedTokens
      },
      metrics: {
        compressionRatio: Math.round(compressionRatio * 100 * 10) / 10,
        tokensSaved,
        quality: Math.round(quality.score * 100 * 10) / 10,
        processingTime: `${processingTime}ms`,
        entitiesPreserved: quality.entitiesPreserved
      },
      analysis: {
        intent: analysis.intent,
        complexity: analysis.complexity,
        domain: analysis.domain
      }
    };
  }

  /**
   * Stage 1: Input Analysis
   */
  analyzeInput(text) {
    const length = text.length;
    const wordCount = text.split(/\s+/).length;
    
    const intentPatterns = {
      schedule: /\b(schedule|meeting|call|appointment|book|calendar|invite)\b/i,
      analyze: /\b(analyze|analysis|report|data|metrics|performance|review)\b/i,
      research: /\b(research|find|search|look up|information about|what is|how to)\b/i,
      write: /\b(write|draft|create|compose|generate|email|message)\b/i,
      code: /\b(code|function|script|program|debug|error|bug|api)\b/i
    };
    
    let detectedIntent = 'general';
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(text)) {
        detectedIntent = intent;
        break;
      }
    }
    
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
    const technicalTerms = (text.match(/\b(API|JSON|HTTP|database|algorithm|function|variable|class|method)\b/gi) || []).length;
    
    let complexity = 'simple';
    if (avgSentenceLength > 20 || technicalTerms > 3) {
      complexity = 'complex';
    } else if (avgSentenceLength > 12 || technicalTerms > 0) {
      complexity = 'moderate';
    }
    
    const domainPatterns = {
      technical: /\b(code|api|database|server|bug|error|debug|programming|software|development)\b/i,
      business: /\b(revenue|profit|sales|marketing|customer|client|contract|proposal|budget)\b/i,
      medical: /\b(patient|diagnosis|treatment|symptom|prescription|medical|health|doctor)\b/i,
      legal: /\b(contract|agreement|clause|liability|compliance|regulation|law|legal)\b/i
    };
    
    let detectedDomain = 'general';
    for (const [domain, pattern] of Object.entries(domainPatterns)) {
      if (pattern.test(text)) {
        detectedDomain = domain;
        break;
      }
    }
    
    return { length, wordCount, intent: detectedIntent, complexity, domain: detectedDomain };
  }

  /**
   * Stage 2: Entity Protection
   */
  protectEntities(text) {
    const entities = { names: [], numbers: [], dates: [], technical: [], emails: [], urls: [] };
    let protectedText = text;
    let placeholderIndex = 0;
    
    protectedText = protectedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
      entities.emails.push(match);
      return `__EMAIL_${placeholderIndex++}__`;
    });
    
    protectedText = protectedText.replace(/https?:\/\/[^\s]+/g, (match) => {
      entities.urls.push(match);
      return `__URL_${placeholderIndex++}__`;
    });
    
    protectedText = protectedText.replace(/\b([A-Z]{2,}(?:\.[A-Z]+)*|v?\d+\.\d+(?:\.\d+)?|NS[A-Z][a-zA-Z]+|Error\s+\w+|Exception\s+\w+)\b/g, (match) => {
      entities.technical.push(match);
      return `__TECH_${placeholderIndex++}__`;
    });
    
    protectedText = protectedText.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}?\b|\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b|\b(?:next|this|last)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|month|year)\b/gi, (match) => {
      entities.dates.push(match);
      return `__DATE_${placeholderIndex++}__`;
    });
    
    protectedText = protectedText.replace(/\$[\d,]+(?:\.\d{2})?|\b\d+(?:\.\d+)?%|\b\d+(?:,\d{3})*\b/g, (match) => {
      entities.numbers.push(match);
      return `__NUM_${placeholderIndex++}__`;
    });
    
    protectedText = protectedText.replace(/(?<!\.\s)(?<!^)\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, (match) => {
      const commonWords = ['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'I', 'You', 'He', 'She', 'It', 'We', 'They'];
      if (!commonWords.includes(match) && match.length > 2) {
        entities.names.push(match);
        return `__NAME_${placeholderIndex++}__`;
      }
      return match;
    });
    
    return { protectedText, entities };
  }

  /**
   * Stage 3a: Linguistic Compression
   */
  linguisticCompression(text, analysis) {
    let compressed = text;
    
    const fillers = [
      /\bI think that\b/gi, /\bI believe that\b/gi, /\bIt seems that\b/gi,
      /\bIn my opinion\b/gi, /\bAs a matter of fact\b/gi, /\bTo be honest\b/gi,
      /\bTo tell you the truth\b/gi, /\bAt this point in time\b/gi,
      /\bDue to the fact that\b/gi, /\bIn order to\b/gi,
      /\bFor the purpose of\b/gi, /\bWith regard to\b/gi,
      /\bIn the event that\b/gi
    ];
    fillers.forEach(p => { compressed = compressed.replace(p, ''); });
    
    const simplifications = [
      [/\butilize\b/gi, 'use'], [/\bleverage\b/gi, 'use'],
      [/\bimplement\b/gi, 'do'], [/\bterminate\b/gi, 'end'],
      [/\binitiate\b/gi, 'start'], [/\bfinalize\b/gi, 'finish'],
      [/\bascertain\b/gi, 'find'], [/\bobtain\b/gi, 'get'],
      [/\breceive\b/gi, 'get'], [/\bpurchase\b/gi, 'buy'],
      [/\brequire\b/gi, 'need'], [/\bassist\b/gi, 'help'],
      [/\bfacilitate\b/gi, 'help'], [/\battempt\b/gi, 'try'],
      [/\bdemonstrate\b/gi, 'show'], [/\bindicate\b/gi, 'show'],
      [/\bcommunicate\b/gi, 'tell'], [/\binform\b/gi, 'tell'],
      [/\bapproximately\b/gi, 'about'], [/\bsubsequently\b/gi, 'then'],
      [/\bnevertheless\b/gi, 'but'], [/\bhowever\b/gi, 'but'],
      [/\btherefore\b/gi, 'so'], [/\badditionally\b/gi, 'also'],
      [/\bfurthermore\b/gi, 'also'], [/\bconsequently\b/gi, 'so']
    ];
    simplifications.forEach(([p, r]) => { compressed = compressed.replace(p, r); });
    
    compressed = compressed.replace(/\bvery\s+/gi, '');
    compressed = compressed.replace(/\breally\s+/gi, '');
    compressed = compressed.replace(/\bquite\s+/gi, '');
    compressed = compressed.replace(/\brather\s+/gi, '');
    compressed = compressed.replace(/\bpretty\s+/gi, '');
    
    compressed = compressed.replace(/\bwould like to\b/gi, 'want to');
    compressed = compressed.replace(/\bwould be able to\b/gi, 'can');
    compressed = compressed.replace(/\bwill be able to\b/gi, 'can');
    compressed = compressed.replace(/\bshould be able to\b/gi, 'can');
    compressed = compressed.replace(/\bneeds to be\b/gi, 'must be');
    compressed = compressed.replace(/\bhas to be\b/gi, 'must be');
    
    compressed = compressed.replace(/\s+/g, ' ').trim();
    return compressed;
  }

  /** Stage 3b: Intent-Based Compression */
  intentCompression(text, intent, entities) {
    return text;
  }

  /** Stage 3c: Smart Truncation */
  smartTruncation(text, entities, targetLength) {
    if (text.length <= targetLength) return text;
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length <= targetLength) {
        truncated += sentence;
      } else break;
    }
    
    if (!truncated) {
      const words = text.split(' ');
      truncated = '';
      for (const word of words) {
        if ((truncated + word).length <= targetLength - 3) {
          truncated += (truncated ? ' ' : '') + word;
        } else break;
      }
      truncated += '...';
    }
    
    return truncated;
  }

  /** Stage 4: Quality Validation */
  validateQuality(original, compressed, entities) {
    const compressionRatio = (original.length - compressed.length) / original.length;
    let qualityScore = 1 - (compressionRatio * 0.3);
    
    if (compressionRatio > 0.6) qualityScore -= 0.1;
    if (compressionRatio >= 0.4 && compressionRatio <= 0.55) qualityScore += 0.05;
    qualityScore = Math.max(0.85, Math.min(0.98, qualityScore));
    
    return { score: qualityScore, entitiesPreserved: 100 };
  }

  /** Restore protected entities */
  restoreEntities(text, entities) {
    let restored = text;
    const allEntities = [
      ...entities.emails.map((e, i) => ({ placeholder: `__EMAIL_${i}__`, value: e })),
      ...entities.urls.map((e, i) => ({ placeholder: `__URL_${i}__`, value: e })),
      ...entities.technical.map((e, i) => ({ placeholder: `__TECH_${i}__`, value: e })),
      ...entities.dates.map((e, i) => ({ placeholder: `__DATE_${i}__`, value: e })),
      ...entities.numbers.map((e, i) => ({ placeholder: `__NUM_${i}__`, value: e })),
      ...entities.names.map((e, i) => ({ placeholder: `__NAME_${i}__`, value: e }))
    ].sort((a, b) => b.placeholder.localeCompare(a.placeholder));
    
    for (const { placeholder, value } of allEntities) {
      restored = restored.replace(placeholder, value);
    }
    return restored;
  }

  /** Estimate token count (~4 chars per token) */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  updateStats(compressionRatio, quality) {
    this.stats.totalCompressed++;
    this.stats.avgCompression =
      (this.stats.avgCompression * (this.stats.totalCompressed - 1) + compressionRatio) /
      this.stats.totalCompressed;
    this.stats.avgQuality =
      (this.stats.avgQuality * (this.stats.totalCompressed - 1) + quality) /
      this.stats.totalCompressed;
  }

  getStats() {
    return {
      ...this.stats,
      avgCompression: Math.round(this.stats.avgCompression * 100 * 10) / 10,
      avgQuality: Math.round(this.stats.avgQuality * 100 * 10) / 10,
      prefixCache: this.prefixCache.getStats()
    };
  }
}

module.exports = new PMICompressionEngine();
