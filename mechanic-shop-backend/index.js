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

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://mechanicshopapi.web.app', // Firebase Hosting
      'https://mechanicshopapi.firebaseapp.com', // Firebase Hosting alternate
      'https://valleyforgeautomotive.org', // Custom domain
      'http://valleyforgeautomotive.org', // Custom domain (HTTP)
      'https://acolyer13.github.io',
      'https://mechanic-api-copy-with-testing-and.onrender.com'
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development' || (origin && origin.includes('localhost'))) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Still allow but log for monitoring
      console.log('CORS request from:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
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

// Scheduled function to auto-delete unverified accounts after 3 days
exports.autoDeleteUnverifiedAccounts = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const admin = require('firebase-admin');
    const { getFirestore } = require('firebase-admin/firestore');
    
    // Initialize Firestore if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    
    const db = getFirestore();
    const auth = admin.auth();
    
    try {
      console.log('Starting auto-deletion of unverified accounts...');
      
      // Get all customers
      const customersSnapshot = await db.collection('customers').get();
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days in milliseconds
      
      let deletedCount = 0;
      
      for (const doc of customersSnapshot.docs) {
        const customer = doc.data();
        const customerId = doc.id;
        
        // Check if account is unverified and older than 3 days
        if (!customer.email_verified && customer.created_at && customer.created_at.toDate() < threeDaysAgo) {
          try {
            // Delete customer document
            await db.collection('customers').doc(customerId).delete();
            
            // Delete associated service tickets
            const ticketsSnapshot = await db.collection('service_tickets')
              .where('customer_id', '==', customerId)
              .get();
            
            for (const ticketDoc of ticketsSnapshot.docs) {
              await db.collection('service_tickets').doc(ticketDoc.id).delete();
            }
            
            // Delete Firebase Auth user
            try {
              await auth.deleteUser(customerId);
            } catch (authError) {
              console.warn(`Failed to delete Firebase Auth user ${customerId}:`, authError);
            }
            
            deletedCount++;
            console.log(`Deleted unverified account: ${customer.email} (${customerId})`);
          } catch (error) {
            console.error(`Failed to delete account ${customerId}:`, error);
          }
        }
      }
      
      console.log(`Auto-deletion completed. Deleted ${deletedCount} unverified accounts.`);
      return null;
    } catch (error) {
      console.error('Error in auto-delete function:', error);
      throw error;
    }
  });

// Optional: Individual function exports for testing
// exports.createCustomer = functions.https.onRequest((req, res) => {
//   // Individual function logic
// });
