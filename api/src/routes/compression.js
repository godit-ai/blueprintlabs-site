const express = require('express');
const router = express.Router();
const pmiEngine = require('../services/pmiEngine');
const { trackUsage } = require('../utils/usageTracker');

/**
 * POST /api/compress
 * Compress text using PMI engine
 */
router.post('/', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required and must be a string'
      });
    }
    
    if (text.length > 10000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text exceeds maximum length of 10,000 characters'
      });
    }
    
    if (text.length < 50) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text must be at least 50 characters to compress meaningfully'
      });
    }
    
    // Check user tier limits
    const user = req.user;
    const canCompress = await checkUserLimits(user);
    
    if (!canCompress.allowed) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: canCompress.message,
        upgradeUrl: 'https://blueprintlabs.live/pricing'
      });
    }
    
    // Perform compression
    const result = pmiEngine.compress(text, options);
    
    // Track usage
    await trackUsage(user.id, {
      originalTokens: result.original.tokens,
      compressedTokens: result.compressed.tokens,
      tokensSaved: result.metrics.tokensSaved,
      compressionRatio: result.metrics.compressionRatio,
      quality: result.metrics.quality
    });
    
    // Return result
    res.json({
      success: true,
      data: result,
      user: {
        tier: user.tier,
        compressionsRemaining: canCompress.remaining
      }
    });
    
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compress text'
    });
  }
});

/**
 * POST /api/compress/batch
 * Compress multiple texts
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts, options = {} } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Texts must be a non-empty array'
      });
    }
    
    if (texts.length > 10) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum 10 texts per batch request'
      });
    }
    
    const results = [];
    let totalTokensSaved = 0;
    
    for (const text of texts) {
      if (typeof text === 'string' && text.length >= 50 && text.length <= 10000) {
        const result = pmiEngine.compress(text, options);
        results.push(result);
        totalTokensSaved += result.metrics.tokensSaved;
      } else {
        results.push({
          error: 'Invalid text',
          original: { text: text?.substring(0, 50) },
          skipped: true
        });
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
          avgCompression: results.filter(r => !r.skipped).reduce((acc, r) => acc + r.metrics.compressionRatio, 0) / results.filter(r => !r.skipped).length
        }
      }
    });
    
  } catch (error) {
    console.error('Batch compression error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process batch compression'
    });
  }
});

/**
 * GET /api/compress/stats
 * Get compression engine statistics
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: pmiEngine.getStats()
  });
});

/**
 * POST /api/compress/demo
 * Demo endpoint (no auth required, limited)
 */
router.post('/demo', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.length < 50 || text.length > 2000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text must be between 50 and 2000 characters for demo'
      });
    }
    
    const result = pmiEngine.compress(text, { targetRatio: 0.5 });
    
    // Remove full text from demo response (show preview only)
    const demoResult = {
      ...result,
      original: {
        ...result.original,
        text: result.original.text.substring(0, 100) + '...'
      },
      compressed: {
        ...result.compressed,
        text: result.compressed.text.substring(0, 100) + '...'
      },
      demo: true
    };
    
    res.json({
      success: true,
      data: demoResult
    });
    
  } catch (error) {
    console.error('Demo compression error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process demo compression'
    });
  }
});

// Helper functions
async function checkUserLimits(user) {
  // Placeholder for actual user limit checking
  // In production, check database for user's tier and usage
  
  const tiers = {
    free: { monthlyLimit: 100 },
    pro: { monthlyLimit: Infinity },
    team: { monthlyLimit: Infinity },
    enterprise: { monthlyLimit: Infinity }
  };
  
  const tier = tiers[user.tier] || tiers.free;
  
  // Mock implementation - replace with actual DB query
  const usedThisMonth = 0; // Get from database
  const remaining = tier.monthlyLimit === Infinity ? Infinity : tier.monthlyLimit - usedThisMonth;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      message: 'You have reached your monthly compression limit. Upgrade to Pro for unlimited compressions.',
      remaining: 0
    };
  }
  
  return {
    allowed: true,
    remaining: remaining === Infinity ? 'unlimited' : remaining
  };
}

module.exports = router;
