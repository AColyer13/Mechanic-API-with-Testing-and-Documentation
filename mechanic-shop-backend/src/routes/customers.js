/**
 * Customer Routes
 * Handles all customer-related endpoints with Firebase Authentication
 */

const express = require('express');
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
const {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getCustomerByEmail,
  getTicketsByCustomer
} = require('../models/firestoreHelper');

const router = express.Router();

/**
 * POST /customers/profile - Create profile for an existing authenticated Firebase user
 * Requires a valid Firebase ID token (verifyToken middleware)
 * Used by OAuth sign-ins (Google) to create the Firestore customer document
 */
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { first_name, last_name, phone, city, state } = req.body;

    if (!first_name || !last_name || !phone || !city || !state) {
      return res.status(400).json({ error: 'Missing required fields: first_name, last_name, phone, city, state' });
    }

    const db = admin.firestore();

    // Check if profile already exists
    const existing = await db.collection(COLLECTIONS.CUSTOMERS).doc(uid).get();
    if (existing.exists) {
      return res.status(409).json({ error: 'Profile already exists' });
    }

    const customerData = {
      first_name,
      last_name,
      email: req.user.email || null,
      phone,
      phone_verified: false,
      city,
      state,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      uid
    };

    await db.collection(COLLECTIONS.CUSTOMERS).doc(uid).set(customerData);

    return res.status(201).json({ message: 'Profile created', customer: { id: uid, ...customerData } });
  } catch (error) {
    console.error('Error creating profile for existing user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /customers - Register new customer
 * Creates user in Firebase Auth and stores profile in Firestore
 */
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, city, state } = req.body;
    
    // Validation
    if (!first_name || !last_name || !email || !password || !phone || !city || !state) {
      return res.status(400).json({
        errors: ['Missing required fields: first_name, last_name, email, password, phone, city, state']
      });
    }
    
    // Create user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: `${first_name} ${last_name}`
      });
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw authError;
    }
    
    // Store customer profile in Firestore (no password stored here)
    const customerData = {
      first_name,
      last_name,
      email,
      phone,
      phone_verified: false,
      city,
      state,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      uid: firebaseUser.uid // Link to Firebase Auth user
    };
    
    // Use Firebase UID as the document ID for easy lookup
    const db = admin.firestore();
    await db.collection(COLLECTIONS.CUSTOMERS).doc(firebaseUser.uid).set(customerData);
    
    return res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: firebaseUser.uid,
        ...customerData
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /customers/my-tickets - Get authenticated customer's tickets
 * Requires authentication
 */
router.get('/my-tickets', verifyToken, async (req, res) => {
  try {
    const customerId = req.user.customer_id;
    
    // Get all tickets for this customer
    const tickets = await getTicketsByCustomer(customerId);
    
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /customers - Get all customers
 */
router.get('/', async (req, res) => {
  try {
    const customers = await getAllDocuments(COLLECTIONS.CUSTOMERS);
    
    // Remove passwords
    customers.forEach(customer => delete customer.password);
    
    return res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /customers/:id - Get customer by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const customer = await getDocumentById(COLLECTIONS.CUSTOMERS, req.params.id, true); // Enable caching
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Remove password
    delete customer.password;
    
    return res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /customers/:id - Update customer
 * Requires authentication and ownership
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const customerId = req.params.id;
    const authenticatedId = req.user.customer_id;
    
    // Verify customer owns this account
    if (customerId !== authenticatedId) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own account' });
    }
    
    // Check if customer exists
    const existingCustomer = await getDocumentById(COLLECTIONS.CUSTOMERS, customerId);
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const { first_name, last_name, email, phone, city, state, phone_verified } = req.body;
    
    // Build update object (only include provided fields)
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (phone_verified !== undefined) updateData.phone_verified = phone_verified;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // If email is being changed, check if it's already in use
    if (email && email !== existingCustomer.email) {
      const emailInUse = await getCustomerByEmail(email);
      if (emailInUse) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    
    // Update Firestore customer document
    const updatedCustomer = await updateDocument(COLLECTIONS.CUSTOMERS, customerId, updateData);

    // If the user's name changed, mirror that change to Firebase Auth displayName
    try {
      if (updateData.first_name || updateData.last_name) {
        const newFirst = updateData.first_name || existingCustomer.first_name || '';
        const newLast = updateData.last_name || existingCustomer.last_name || '';
        const newDisplayName = `${newFirst} ${newLast}`.trim();
        if (newDisplayName) {
          try {
            await admin.auth().updateUser(customerId, { displayName: newDisplayName });
          } catch (authUpdateErr) {
            // Log and continue; Firestore profile remains source of truth for profile fields
            console.warn('Failed to update Firebase Auth displayName:', authUpdateErr);
          }
        }
      }
    } catch (err) {
      console.warn('Name update check failed:', err);
    }

    // Remove password before returning
    delete updatedCustomer.password;

    return res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /customers/:id - Delete customer
 * Requires authentication and ownership
 * Note: In Firestore, you should also delete associated tickets or handle orphaned data
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const customerId = req.params.id;
    const authenticatedId = req.user.customer_id;
    
    // Verify customer owns this account
    if (customerId !== authenticatedId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own account' });
    }
    
    // Attempt to delete customer document (ignore if it doesn't exist)
    try {
      await deleteDocument(COLLECTIONS.CUSTOMERS, customerId);
    } catch (error) {
      // Document might not exist, continue with deletion
      console.warn('Customer document not found or already deleted:', error);
    }
    
    // Delete associated service tickets (if any exist)
    try {
      const tickets = await getTicketsByCustomer(customerId);
      for (const ticket of tickets) {
        await deleteDocument(COLLECTIONS.SERVICE_TICKETS, ticket.id);
      }
    } catch (error) {
      // Tickets might not exist, continue
      console.warn('Error deleting associated tickets:', error);
    }
    
    // Delete Firebase Auth user
    try {
      await admin.auth().deleteUser(customerId);
    } catch (authError) {
      console.warn('Failed to delete Firebase Auth user:', authError);
      // Continue with response even if auth deletion fails
    }
    
    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /customers/check-email/:email - Check if email already exists
 * Used for Google Sign-In conflict detection
 * Does NOT require authentication
 */
router.get('/check-email/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    // Try to find customer by email
    try {
      const customer = await getCustomerByEmail(email);
      // Email exists
      return res.status(200).json({
        exists: true,
        message: 'Email already registered with email/password'
      });
    } catch (error) {
      // Email doesn't exist
      return res.status(200).json({
        exists: false,
        message: 'Email not registered'
      });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
