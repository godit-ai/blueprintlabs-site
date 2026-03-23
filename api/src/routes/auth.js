/**
 * Authentication Routes - Stub implementation
 */
const express = require('express');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({
    success: true,
    token: 'demo-token',
    user: {
      id: 'demo-user',
      email: 'demo@example.com',
      tier: 'pro'
    }
  });
});

// POST /api/auth/register  
router.post('/register', (req, res) => {
  res.json({
    success: true,
    token: 'demo-token',
    user: {
      id: 'demo-user',
      email: req.body.email || 'demo@example.com',
      tier: 'free'
    }
  });
});

module.exports = router;
