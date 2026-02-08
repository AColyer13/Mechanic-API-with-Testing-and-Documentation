/**
 * Firebase Cloud Functions - Mechanic Shop API
 * Main entry point for all Cloud Functions
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

// Import route handlers
const customersRouter = require('./src/routes/customers');
const mechanicsRouter = require('./src/routes/mechanics');
const inventoryRouter = require('./src/routes/inventory');
const serviceTicketsRouter = require('./src/routes/serviceTickets');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true })); // Allow all origins (configure for production)
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Mechanic Shop API - Firebase Cloud Functions',
    documentation: '/api-docs',
    endpoints: {
      customers: '/customers',
      mechanics: '/mechanics',
      inventory: '/inventory',
      serviceTickets: '/service-tickets'
    },
    version: '2.0.0',
    platform: 'Firebase Cloud Functions'
  });
});

// Register route handlers
app.use('/customers', customersRouter);
app.use('/mechanics', mechanicsRouter);
app.use('/inventory', inventoryRouter);
app.use('/service-tickets', serviceTicketsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /customers',
      'GET /customers',
      'POST /customers/login',
      '... and more (see documentation)'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export the Express app as a Firebase Cloud Function
// This makes your entire API available at: https://REGION-PROJECT_ID.cloudfunctions.net/api
exports.api = functions.https.onRequest(app);

// Optional: Individual function exports for testing
// exports.createCustomer = functions.https.onRequest((req, res) => {
//   // Individual function logic
// });
