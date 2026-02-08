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
 * POST /customers - Register new customer
 * Creates user in Firebase Auth and stores profile in Firestore
 */
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, address } = req.body;
    
    // Validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        errors: ['Missing required fields: first_name, last_name, email, password']
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
      phone: phone || null,
      address: address || null,
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
    const customer = await getDocumentById(COLLECTIONS.CUSTOMERS, req.params.id);
    
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
    
    const { first_name, last_name, email, phone, address } = req.body;
    
    // Build update object (only include provided fields)
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    
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
    
    const updatedCustomer = await updateDocument(COLLECTIONS.CUSTOMERS, customerId, updateData);
    
    // Remove password
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
    
    // Check if customer exists
    const customer = await getDocumentById(COLLECTIONS.CUSTOMERS, customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Delete customer
    await deleteDocument(COLLECTIONS.CUSTOMERS, customerId);
    
    // TODO: Optional - Also delete all service tickets for this customer
    const tickets = await getTicketsByCustomer(customerId);
    for (const ticket of tickets) {
      await deleteDocument(COLLECTIONS.SERVICE_TICKETS, ticket.id);
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
