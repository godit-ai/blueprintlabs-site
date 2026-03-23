/**
 * Usage Routes - Stub implementation
 */
const express = require('express');
const router = express.Router();

// GET /api/usage
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user.id,
      period: 'month',
      totalRequests: 0,
      totalTokensSaved: 0,
      totalCostSaved: 0,
      tier: req.user.tier
    }
  });
});

module.exports = router;
