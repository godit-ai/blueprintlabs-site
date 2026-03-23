const express = require('express');
const router = express.Router();
const pmiEngine = require('../services/pmiEngine');
const objectMemory = require('../services/objectMemory');
const { trackUsage } = require('../utils/usageTracker');

// ─── POST /api/compress ───────────────────────────────────────────────────────
// Original text compression endpoint
router.post('/', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'Text is required and must be a string' });
    }
    if (text.length > 10000) {
      return res.status(400).json({ error: 'Bad Request', message: 'Text exceeds maximum length of 10,000 characters' });
    }
    if (text.length < 50) {
      return res.status(400).json({ error: 'Bad Request', message: 'Text must be at least 50 characters to compress meaningfully' });
    }
    
    const user = req.user;
    const canCompress = await checkUserLimits(user);
    if (!canCompress.allowed) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: canCompress.message,
        upgradeUrl: 'https://blueprintlabs.live/pricing'
      });
    }
    
    const result = pmiEngine.compress(text, options);
    
    await trackUsage(user.id, {
      originalTokens: result.original.tokens,
      compressedTokens: result.compressed.tokens,
      tokensSaved: result.metrics.tokensSaved,
      compressionRatio: result.metrics.compressionRatio,
      quality: result.metrics.quality
    });
    
    res.json({
      success: true,
      data: result,
      user: { tier: user.tier, compressionsRemaining: canCompress.remaining }
    });
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to compress text' });
  }
});

// ─── POST /api/compress/cache-analyze ─────────────────────────────────────────
// Phase 1: Analyze a conversation for prefix caching opportunities
router.post('/cache-analyze', async (req, res) => {
  try {
    const { messages, provider } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'messages must be a non-empty array of {role, content} objects'
      });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || typeof msg.content !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Each message must have role (string) and content (string)'
        });
      }
    }

    const result = pmiEngine.analyzeForCaching(messages, { provider });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Cache analysis error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to analyze for caching' });
  }
});

// ─── POST /api/compress/objects ───────────────────────────────────────────────
// Phase 2: Extract structured objects from prose
router.post('/objects', async (req, res) => {
  try {
    const { text, tokenBudget, format, types, tags, source } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'text is required and must be a string' });
    }
    if (text.length > 50000) {
      return res.status(400).json({ error: 'Bad Request', message: 'Text exceeds maximum length of 50,000 characters' });
    }
    if (text.length < 20) {
      return res.status(400).json({ error: 'Bad Request', message: 'Text must be at least 20 characters' });
    }

    const result = objectMemory.processMemory(text, {
      tokenBudget: tokenBudget || 2000,
      format: format || 'compact',
      types,
      tags,
      source: source || 'api'
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Object memory error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process object memory' });
  }
});

// ─── POST /api/compress/objects/extract ───────────────────────────────────────
// Phase 2: Extract only (no reconstruction) — useful for inspection
router.post('/objects/extract', async (req, res) => {
  try {
    const { text, source } = req.body;

    if (!text || typeof text !== 'string' || text.length < 20) {
      return res.status(400).json({ error: 'Bad Request', message: 'text must be a string ≥20 chars' });
    }

    const { objects, stats } = objectMemory.extract(text, { source: source || 'api' });

    res.json({
      success: true,
      data: {
        objects: objects.map(o => ({
          id: o.id,
          type: o.type,
          label: o.label,
          tokens: o.tokens,
          tags: o.tags,
          timestamp: o.timestamp,
          summary: o.toCompact(),
          data: o.data
        })),
        stats
      }
    });
  } catch (error) {
    console.error('Object extraction error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to extract objects' });
  }
});

// ─── POST /api/compress/pipeline ──────────────────────────────────────────────
// Combined Phase 1 + Phase 2: Full optimization pipeline
// Accepts messages array, returns caching analysis + object extraction + reconstruction
router.post('/pipeline', async (req, res) => {
  try {
    const { messages, tokenBudget, format, provider } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'messages must be a non-empty array of {role, content} objects'
      });
    }

    // Phase 1: Caching analysis
    const cachingResult = pmiEngine.analyzeForCaching(messages, { provider });

    // Phase 2: Object memory on the full conversation text
    const fullText = messages.map(m => `[${m.role}]: ${m.content}`).join('\n');
    const memoryResult = objectMemory.processMemory(fullText, {
      tokenBudget: tokenBudget || 2000,
      format: format || 'compact',
      source: 'pipeline'
    });

    // Combined cost analysis
    const originalTokens = cachingResult.segmentation.totalTokens;
    const cachedTokens = cachingResult.segmentation.dynamicTokens; // only dynamic portion billed at full rate
    const objectTokens = memoryResult.reconstruction.tokens;

    const naiveCostPer1M = 3.00; // Claude 3.5 Sonnet input price
    const naiveCost = (originalTokens / 1_000_000) * naiveCostPer1M;

    // Best case: cache prefix + use object memory for dynamic part
    const bestCaseCost = ((cachingResult.segmentation.prefixTokens / 1_000_000) * 0.30) +
                         ((objectTokens / 1_000_000) * naiveCostPer1M);
    const totalSavings = naiveCost - bestCaseCost;

    res.json({
      success: true,
      data: {
        phase1_caching: cachingResult,
        phase2_objectMemory: memoryResult,
        combined: {
          originalTokens,
          optimizedTokens: cachingResult.segmentation.prefixTokens + objectTokens,
          naiveCostPerRequest: `$${naiveCost.toFixed(6)}`,
          optimizedCostPerRequest: `$${bestCaseCost.toFixed(6)}`,
          savingsPerRequest: `$${totalSavings.toFixed(6)}`,
          savingsPercent: naiveCost > 0 ? Math.round((totalSavings / naiveCost) * 1000) / 10 : 0,
          monthlyAt1kRPD: {
            naive: `$${(naiveCost * 1000 * 30).toFixed(2)}`,
            optimized: `$${(bestCaseCost * 1000 * 30).toFixed(2)}`,
            saved: `$${(totalSavings * 1000 * 30).toFixed(2)}`
          }
        }
      }
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to run pipeline' });
  }
});

// ─── POST /api/compress/batch ─────────────────────────────────────────────────
router.post('/batch', async (req, res) => {
  try {
    const { texts, options = {} } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Texts must be a non-empty array' });
    }
    if (texts.length > 10) {
      return res.status(400).json({ error: 'Bad Request', message: 'Maximum 10 texts per batch request' });
    }
    
    const results = [];
    let totalTokensSaved = 0;
    
    for (const text of texts) {
      if (typeof text === 'string' && text.length >= 50 && text.length <= 10000) {
        const result = pmiEngine.compress(text, options);
        results.push(result);
        totalTokensSaved += result.metrics.tokensSaved;
      } else {
        results.push({ error: 'Invalid text', original: { text: text?.substring(0, 50) }, skipped: true });
      }
    }
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          totalProcessed: results.filter(r => !r.skipped).length,
          totalSkipped: results.filter(r => r.skipped).length,
          totalTokensSaved,
          avgCompression: results.filter(r => !r.skipped).reduce((acc, r) => acc + r.metrics.compressionRatio, 0) / results.filter(r => !r.skipped).length || 0
        }
      }
    });
  } catch (error) {
    console.error('Batch compression error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process batch compression' });
  }
});

// ─── GET /api/compress/stats ──────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  res.json({ success: true, data: pmiEngine.getStats() });
});

// ─── POST /api/compress/demo ──────────────────────────────────────────────────
router.post('/demo', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.length < 50 || text.length > 2000) {
      return res.status(400).json({ error: 'Bad Request', message: 'Text must be between 50 and 2000 characters for demo' });
    }
    
    const result = pmiEngine.compress(text, { targetRatio: 0.5 });
    
    const demoResult = {
      ...result,
      original: { ...result.original, text: result.original.text.substring(0, 100) + '...' },
      compressed: { ...result.compressed, text: result.compressed.text.substring(0, 100) + '...' },
      demo: true
    };
    
    res.json({ success: true, data: demoResult });
  } catch (error) {
    console.error('Demo compression error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process demo compression' });
  }
});

// ─── POST /api/compress/demo/objects ──────────────────────────────────────────
// Demo endpoint for object memory (no auth, limited input)
router.post('/demo/objects', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.length < 50 || text.length > 3000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text must be between 50 and 3000 characters for demo'
      });
    }

    const result = objectMemory.processMemory(text, {
      tokenBudget: 500,
      format: 'compact',
      source: 'demo'
    });

    // Truncate reconstruction for demo
    if (result.reconstruction.context.length > 500) {
      result.reconstruction.context = result.reconstruction.context.substring(0, 500) + '\n...';
    }
    result.demo = true;

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Demo object memory error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process demo' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function checkUserLimits(user) {
  const tiers = {
    free: { monthlyLimit: 100 },
    pro: { monthlyLimit: Infinity },
    team: { monthlyLimit: Infinity },
    enterprise: { monthlyLimit: Infinity }
  };
  
  const tier = tiers[user?.tier] || tiers.free;
  const usedThisMonth = 0;
  const remaining = tier.monthlyLimit === Infinity ? Infinity : tier.monthlyLimit - usedThisMonth;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      message: 'You have reached your monthly compression limit. Upgrade to Pro for unlimited compressions.',
      remaining: 0
    };
  }
  
  return { allowed: true, remaining: remaining === Infinity ? 'unlimited' : remaining };
}

module.exports = router;
