/**
 * Authentication Middleware
 * Handles JWT token verification for protected routes
 */

const jwt = require('jsonwebtoken');

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const TOKEN_EXPIRATION = '24h';

/**
 * Generate JWT token for customer
 */
function generateToken(customerId, email) {
  return jwt.sign(
    {
      customer_id: customerId,
      email: email
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
}

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Verify customer owns the resource
 */
function verifyCustomerOwnership(req, res, next) {
  const requestedCustomerId = req.params.customerId || req.params.id;
  const authenticatedCustomerId = req.user.customer_id;
  
  if (requestedCustomerId !== authenticatedCustomerId) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own resources' });
  }
  
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  verifyCustomerOwnership,
  JWT_SECRET
};
