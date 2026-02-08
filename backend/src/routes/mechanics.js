/**
 * Mechanic Routes
 * Handles all mechanic-related endpoints
 * Pattern: Follow customers.js structure
 */

const express = require('express');
const {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getMechanicByEmail,
  queryDocuments
} = require('../models/firestoreHelper');

const router = express.Router();

/**
 * POST /mechanics - Create new mechanic
 */
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialty, hourly_rate, hire_date } = req.body;
    
    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: 'Missing required fields: first_name, last_name, email'
      });
    }
    
    // Check if email already exists
    const existing = await getMechanicByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const mechanicData = {
      first_name,
      last_name,
      email,
      phone: phone || null,
      specialty: specialty || null,
      hourly_rate: hourly_rate || null,
      hire_date: hire_date || null
    };
    
    const mechanic = await createDocument(COLLECTIONS.MECHANICS, mechanicData);
    return res.status(201).json(mechanic);
  } catch (error) {
    console.error('Error creating mechanic:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /mechanics - Get all mechanics
 */
router.get('/', async (req, res) => {
  try {
    const mechanics = await getAllDocuments(COLLECTIONS.MECHANICS);
    return res.status(200).json(mechanics);
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /mechanics/:id - Get mechanic by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const mechanic = await getDocumentById(COLLECTIONS.MECHANICS, req.params.id);
    
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    
    return res.status(200).json(mechanic);
  } catch (error) {
    console.error('Error fetching mechanic:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /mechanics/:id - Update mechanic
 */
router.put('/:id', async (req, res) => {
  try {
    const mechanicId = req.params.id;
    
    const existing = await getDocumentById(COLLECTIONS.MECHANICS, mechanicId);
    if (!existing) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    
    const { first_name, last_name, email, phone, specialty, hourly_rate } = req.body;
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Check email uniqueness if changing
    if (email && email !== existing.email) {
      const emailInUse = await getMechanicByEmail(email);
      if (emailInUse) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }
    
    const updated = await updateDocument(COLLECTIONS.MECHANICS, mechanicId, updateData);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating mechanic:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /mechanics/:id - Delete mechanic
 */
router.delete('/:id', async (req, res) => {
  try {
    const mechanicId = req.params.id;
    
    const mechanic = await getDocumentById(COLLECTIONS.MECHANICS, mechanicId);
    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    
    await deleteDocument(COLLECTIONS.MECHANICS, mechanicId);
    
    // TODO: Remove mechanic from all service tickets
    // Query tickets where mechanic_ids array contains this mechanic
    // Update each ticket to remove this mechanic ID from the array
    
    return res.status(200).json({ message: 'Mechanic deleted successfully' });
  } catch (error) {
    console.error('Error deleting mechanic:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
