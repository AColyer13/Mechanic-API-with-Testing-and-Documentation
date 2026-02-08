/**
 * Authentication Middleware
 * Handles Firebase Authentication token verification for protected routes
 */

const admin = require('firebase-admin');

/**
 * Verify Firebase ID token middleware
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      customer_id: decodedToken.uid // Use Firebase UID as customer_id
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.code === 'auth/id-token-expired') {
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
  verifyToken,
  verifyCustomerOwnership
};
