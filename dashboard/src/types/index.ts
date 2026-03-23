export type ObjectType = 'meeting' | 'decision' | 'fact' | 'person' | 'date' | 'topic';

export interface ExtractedObject {
  id: string;
  type: ObjectType;
  content: string;
  confidence: number;
  source: string;
  timestamp: string;
  tags: string[];
}

export interface CompressionResult {
  original: string;
  compressed: string;
  objects: ExtractedObject[];
  originalTokens: number;
  compressedTokens: number;
  ratio: number;
  savings: number;
}

export interface UsageStats {
  totalTokensSaved: number;
  totalApiCalls: number;
  avgCompressionRatio: number;
  costSavings: number;
  cacheHitRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  compressionRatio: number;
  tokensSaved: number;
  apiCalls: number;
  costSavings: number;
}

export interface CacheEntry {
  prefix: string;
  hitCount: number;
  lastAccessed: string;
  tokensSaved: number;
  size: number;
}

export interface PrefixCacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalSavings: number;
  entries: CacheEntry[];
}

export type TabId = 'overview' | 'memory' | 'cache' | 'testing';
