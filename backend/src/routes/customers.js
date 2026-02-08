/**
 * Customer Routes
 * Handles all customer-related endpoints including authentication
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, verifyToken } = require('../middleware/auth');
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
 */
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, address } = req.body;
    
    // Validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: first_name, last_name, email, password'
      });
    }
    
    // Check if email already exists
    const existingCustomer = await getCustomerByEmail(email);
    if (existingCustomer) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create customer
    const customerData = {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null
    };
    
    const customer = await createDocument(COLLECTIONS.CUSTOMERS, customerData);
    
    // Remove password from response
    delete customer.password;
    
    return res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /customers/login - Customer login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find customer by email
    const customer = await getCustomerByEmail(email);
    if (!customer) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, customer.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = generateToken(customer.id, customer.email);
    
    // Remove password from response
    delete customer.password;
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      customer
    });
  } catch (error) {
    console.error('Error during login:', error);
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
 * GET /customers/my-tickets - Get tickets for logged-in customer
 * Requires authentication
 */
router.get('/my-tickets', verifyToken, async (req, res) => {
  try {
    const customerId = req.user.customer_id;
    const tickets = await getTicketsByCustomer(customerId);
    
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
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
        return res.status(409).json({ error: 'Email already in use' });
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

module.exports = router;
