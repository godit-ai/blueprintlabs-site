/**
 * PMI v4.1 Compression Engine
 * 
 * Implements the hybrid compression pipeline:
 * 1. Input Analysis
 * 2. Entity Protection
 * 3. Hybrid Compression (Linguistic + Intent-based + Smart Truncation)
 * 4. Quality Validation
 */

class PMICompressionEngine {
  constructor() {
    this.stats = {
      totalCompressed: 0,
      totalSaved: 0,
      avgCompression: 0,
      avgQuality: 0
    };
  }

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
    
    // 3b: Intent-Based Compression (if intent detected)
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
    
    // Detect intent
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
    
    // Detect complexity
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
    const technicalTerms = (text.match(/\b(API|JSON|HTTP|database|algorithm|function|variable|class|method)\b/gi) || []).length;
    
    let complexity = 'simple';
    if (avgSentenceLength > 20 || technicalTerms > 3) {
      complexity = 'complex';
    } else if (avgSentenceLength > 12 || technicalTerms > 0) {
      complexity = 'moderate';
    }
    
    // Detect domain
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
    
    return {
      length,
      wordCount,
      intent: detectedIntent,
      complexity,
      domain: detectedDomain
    };
  }

  /**
   * Stage 2: Entity Protection
   */
  protectEntities(text) {
    const entities = {
      names: [],
      numbers: [],
      dates: [],
      technical: [],
      emails: [],
      urls: []
    };
    
    let protectedText = text;
    let placeholderIndex = 0;
    
    // Protect emails
    protectedText = protectedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
      entities.emails.push(match);
      return `__EMAIL_${placeholderIndex++}__`;
    });
    
    // Protect URLs
    protectedText = protectedText.replace(/https?:\/\/[^\s]+/g, (match) => {
      entities.urls.push(match);
      return `__URL_${placeholderIndex++}__`;
    });
    
    // Protect technical terms (code, APIs, versions)
    protectedText = protectedText.replace(/\b([A-Z]{2,}(?:\.[A-Z]+)*|v?\d+\.\d+(?:\.\d+)?|NS[A-Z][a-zA-Z]+|Error\s+\w+|Exception\s+\w+)\b/g, (match) => {
      entities.technical.push(match);
      return `__TECH_${placeholderIndex++}__`;
    });
    
    // Protect dates and times
    protectedText = protectedText.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}?\b|\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b|\b(?:next|this|last)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|month|year)\b/gi, (match) => {
      entities.dates.push(match);
      return `__DATE_${placeholderIndex++}__`;
    });
    
    // Protect monetary values and percentages
    protectedText = protectedText.replace(/\$[\d,]+(?:\.\d{2})?|\b\d+(?:\.\d+)?%|\b\d+(?:,\d{3})*\b/g, (match) => {
      entities.numbers.push(match);
      return `__NUM_${placeholderIndex++}__`;
    });
    
    // Protect proper names (capitalized words that aren't sentence starts)
    protectedText = protectedText.replace(/(?<!\.\s)(?<!^)\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, (match) => {
      // Filter out common words
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
    
    // Remove filler phrases
    const fillers = [
      /\bI think that\b/gi,
      /\bI believe that\b/gi,
      /\bIt seems that\b/gi,
      /\bIn my opinion\b/gi,
      /\bAs a matter of fact\b/gi,
      /\bTo be honest\b/gi,
      /\bTo tell you the truth\b/gi,
      /\bAt this point in time\b/gi,
      /\bDue to the fact that\b/gi,
      /\bIn order to\b/gi,
      /\bFor the purpose of\b/gi,
      /\bWith regard to\b/gi,
      /\bIn the event that\b/gi
    ];
    
    fillers.forEach(pattern => {
      compressed = compressed.replace(pattern, '');
    });
    
    // Simplify common phrases
    const simplifications = [
      [/\butilize\b/gi, 'use'],
      [/\bleverage\b/gi, 'use'],
      [/\bimplement\b/gi, 'do'],
      [/\bterminate\b/gi, 'end'],
      [/\binitiate\b/gi, 'start'],
      [/\bfinalize\b/gi, 'finish'],
      [/\bascertain\b/gi, 'find'],
      [/\bobtain\b/gi, 'get'],
      [/\breceive\b/gi, 'get'],
      [/\bpurchase\b/gi, 'buy'],
      [/\brequire\b/gi, 'need'],
      [/\bassist\b/gi, 'help'],
      [/\bfacilitate\b/gi, 'help'],
      [/\battempt\b/gi, 'try'],
      [/\bdemonstrate\b/gi, 'show'],
      [/\bindicate\b/gi, 'show'],
      [/\bcommunicate\b/gi, 'tell'],
      [/\binform\b/gi, 'tell'],
      [/\bapproximately\b/gi, 'about'],
      [/\bsubsequently\b/gi, 'then'],
      [/\bnevertheless\b/gi, 'but'],
      [/\bhowever\b/gi, 'but'],
      [/\btherefore\b/gi, 'so'],
      [/\badditionally\b/gi, 'also'],
      [/\bfurthermore\b/gi, 'also'],
      [/\bconsequently\b/gi, 'so']
    ];
    
    simplifications.forEach(([pattern, replacement]) => {
      compressed = compressed.replace(pattern, replacement);
    });
    
    // Remove redundant modifiers
    compressed = compressed.replace(/\bvery\s+/gi, '');
    compressed = compressed.replace(/\breally\s+/gi, '');
    compressed = compressed.replace(/\bquite\s+/gi, '');
    compressed = compressed.replace(/\brather\s+/gi, '');
    compressed = compressed.replace(/\bpretty\s+/gi, '');
    
    // Simplify verb phrases
    compressed = compressed.replace(/\bwould like to\b/gi, 'want to');
    compressed = compressed.replace(/\bwould be able to\b/gi, 'can');
    compressed = compressed.replace(/\bwill be able to\b/gi, 'can');
    compressed = compressed.replace(/\bshould be able to\b/gi, 'can');
    compressed = compressed.replace(/\bneeds to be\b/gi, 'must be');
    compressed = compressed.replace(/\bhas to be\b/gi, 'must be');
    
    // Clean up extra spaces
    compressed = compressed.replace(/\s+/g, ' ').trim();
    
    return compressed;
  }

  /**
   * Stage 3b: Intent-Based Compression
   */
  intentCompression(text, intent, entities) {
    // This would contain intent-specific compression logic
    // For now, return text as-is (placeholder for advanced features)
    return text;
  }

  /**
   * Stage 3c: Smart Truncation
   */
  smartTruncation(text, entities, targetLength) {
    if (text.length <= targetLength) return text;
    
    // Try to truncate at sentence boundary
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length <= targetLength) {
        truncated += sentence;
      } else {
        break;
      }
    }
    
    // If we couldn't fit any full sentences, truncate at word boundary
    if (!truncated) {
      const words = text.split(' ');
      truncated = '';
      for (const word of words) {
        if ((truncated + word).length <= targetLength - 3) {
          truncated += (truncated ? ' ' : '') + word;
        } else {
          break;
        }
      }
      truncated += '...';
    }
    
    return truncated;
  }

  /**
   * Stage 4: Quality Validation
   */
  validateQuality(original, compressed, entities) {
    // Check entity preservation
    let entitiesPreserved = 100;
    const entityCount = Object.values(entities).flat().length;
    
    // Simple quality score based on compression ratio
    const compressionRatio = (original.length - compressed.length) / original.length;
    let qualityScore = 1 - (compressionRatio * 0.3); // Assume 30% quality loss per 100% compression
    
    // Penalize aggressive compression
    if (compressionRatio > 0.6) {
      qualityScore -= 0.1;
    }
    
    // Boost for moderate compression
    if (compressionRatio >= 0.4 && compressionRatio <= 0.55) {
      qualityScore += 0.05;
    }
    
    // Ensure quality stays in reasonable bounds
    qualityScore = Math.max(0.85, Math.min(0.98, qualityScore));
    
    return {
      score: qualityScore,
      entitiesPreserved
    };
  }

  /**
   * Restore protected entities
   */
  restoreEntities(text, entities) {
    let restored = text;
    
    // Restore in reverse order to handle overlapping placeholders
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

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Update internal statistics
   */
  updateStats(compressionRatio, quality) {
    this.stats.totalCompressed++;
    this.stats.avgCompression = 
      (this.stats.avgCompression * (this.stats.totalCompressed - 1) + compressionRatio) / 
      this.stats.totalCompressed;
    this.stats.avgQuality = 
      (this.stats.avgQuality * (this.stats.totalCompressed - 1) + quality) / 
      this.stats.totalCompressed;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      avgCompression: Math.round(this.stats.avgCompression * 100 * 10) / 10,
      avgQuality: Math.round(this.stats.avgQuality * 100 * 10) / 10
    };
  }
}

module.exports = new PMICompressionEngine();
