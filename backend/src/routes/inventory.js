/**
 * Inventory Routes
 * Handles all inventory part endpoints
 */

const express = require('express');
const {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
} = require('../models/firestoreHelper');

const router = express.Router();

/**
 * POST /inventory - Create new inventory part
 */
router.post('/', async (req, res) => {
  try {
    const { name, price } = req.body;
    
    // Validation
    if (!name || price === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name, price'
      });
    }
    
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }
    
    const partData = {
      name,
      price
    };
    
    const part = await createDocument(COLLECTIONS.INVENTORY, partData);
    return res.status(201).json(part);
  } catch (error) {
    console.error('Error creating inventory part:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /inventory - Get all inventory parts
 */
router.get('/', async (req, res) => {
  try {
    const inventory = await getAllDocuments(COLLECTIONS.INVENTORY);
    return res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /inventory/:id - Get inventory part by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const part = await getDocumentById(COLLECTIONS.INVENTORY, req.params.id);
    
    if (!part) {
      return res.status(404).json({ error: 'Inventory part not found' });
    }
    
    return res.status(200).json(part);
  } catch (error) {
    console.error('Error fetching inventory part:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /inventory/:id - Update inventory part
 */
router.put('/:id', async (req, res) => {
  try {
    const partId = req.params.id;
    
    const existing = await getDocumentById(COLLECTIONS.INVENTORY, partId);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory part not found' });
    }
    
    const { name, price } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }
      updateData.price = price;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const updated = await updateDocument(COLLECTIONS.INVENTORY, partId, updateData);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating inventory part:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /inventory/:id - Delete inventory part
 */
router.delete('/:id', async (req, res) => {
  try {
    const partId = req.params.id;
    
    const part = await getDocumentById(COLLECTIONS.INVENTORY, partId);
    if (!part) {
      return res.status(404).json({ error: 'Inventory part not found' });
    }
    
    // TODO: Optional - Check if part is used in any service tickets
    // If so, either prevent deletion or remove from tickets
    
    await deleteDocument(COLLECTIONS.INVENTORY, partId);
    return res.status(200).json({ message: 'Inventory part deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory part:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
