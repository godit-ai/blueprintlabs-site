/**
 * Authentication Middleware - Stub implementation
 */

function authenticateToken(req, res, next) {
  // Stub: Allow all requests with demo user
  req.user = {
    id: 'demo-user',
    email: 'demo@example.com',
    tier: 'pro'
  };
  next();
}

module.exports = {
  authenticateToken
};
