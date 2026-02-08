/**
 * Service Ticket Routes
 * Handles all service ticket endpoints with mechanic and inventory part management
 */

const express = require('express');
const {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  addToArrayField,
  removeFromArrayField,
  documentExists,
  getTicketsByCustomer,
  getTicketsByMechanic
} = require('../models/firestoreHelper');

const router = express.Router();

/**
 * POST /service-tickets - Create new service ticket
 */
router.post('/', async (req, res) => {
  try {
    const {
      customer_id,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_vin,
      description,
      estimated_cost,
      status
    } = req.body;
    
    // Validation
    if (!customer_id || !description) {
      return res.status(400).json({
        errors: ['Missing required fields: customer_id, description']
      });
    }
    
    // Verify customer exists
    const customerExists = await documentExists(COLLECTIONS.CUSTOMERS, customer_id);
    if (!customerExists) {
      return res.status(400).json({ error: 'Invalid customer_id' });
    }
    
    const ticketData = {
      customer_id,
      vehicle_year: vehicle_year || null,
      vehicle_make: vehicle_make || null,
      vehicle_model: vehicle_model || null,
      vehicle_vin: vehicle_vin || null,
      description,
      estimated_cost: estimated_cost || null,
      actual_cost: null,
      status: status || 'Open',
      mechanic_ids: [],
      inventory_ids: [],
      completed_at: null
    };
    
    const ticket = await createDocument(COLLECTIONS.SERVICE_TICKETS, ticketData);
    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating service ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /service-tickets - Get all service tickets
 */
router.get('/', async (req, res) => {
  try {
    const tickets = await getAllDocuments(COLLECTIONS.SERVICE_TICKETS);
    
    // TODO: Optionally populate customer, mechanic, and inventory data
    // For each ticket, fetch related data and attach
    
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching service tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /service-tickets/:id - Get service ticket by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    // TODO: Optionally populate customer, mechanic, and inventory data
    
    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching service ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /service-tickets/:id - Update service ticket
 */
router.put('/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    const existing = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!existing) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    const {
      description,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_vin,
      estimated_cost,
      actual_cost,
      status
    } = req.body;
    
    const updateData = {};
    if (description) updateData.description = description;
    if (vehicle_year) updateData.vehicle_year = vehicle_year;
    if (vehicle_make) updateData.vehicle_make = vehicle_make;
    if (vehicle_model) updateData.vehicle_model = vehicle_model;
    if (vehicle_vin) updateData.vehicle_vin = vehicle_vin;
    if (estimated_cost !== undefined) updateData.estimated_cost = estimated_cost;
    if (actual_cost !== undefined) updateData.actual_cost = actual_cost;
    if (status) {
      updateData.status = status;
      // If status is completed, set completed_at timestamp
      if (status === 'Completed' && !existing.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const updated = await updateDocument(COLLECTIONS.SERVICE_TICKETS, ticketId, updateData);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating service ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /service-tickets/:id - Delete service ticket
 */
router.delete('/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    await deleteDocument(COLLECTIONS.SERVICE_TICKETS, ticketId);
    return res.status(200).json({ message: 'Service ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting service ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /service-tickets/:ticketId/assign-mechanic/:mechanicId - Assign mechanic to ticket
 */
router.put('/:ticketId/assign-mechanic/:mechanicId', async (req, res) => {
  try {
    const { ticketId, mechanicId } = req.params;
    
    // Verify ticket exists
    const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    // Verify mechanic exists
    const mechanicExists = await documentExists(COLLECTIONS.MECHANICS, mechanicId);
    if (!mechanicExists) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    
    // Check if already assigned
    if (ticket.mechanic_ids && ticket.mechanic_ids.includes(mechanicId)) {
      return res.status(409).json({ error: 'Mechanic already assigned to this ticket' });
    }
    
    const updated = await addToArrayField(COLLECTIONS.SERVICE_TICKETS, ticketId, 'mechanic_ids', mechanicId);
    updated.message = 'Mechanic assigned successfully';
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error assigning mechanic:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /service-tickets/:ticketId/remove-mechanic/:mechanicId - Remove mechanic from ticket
 */
router.put('/:ticketId/remove-mechanic/:mechanicId', async (req, res) => {
  try {
    const { ticketId, mechanicId } = req.params;
    
    const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    // Check if mechanic is assigned
    if (!ticket.mechanic_ids || !ticket.mechanic_ids.includes(mechanicId)) {
      return res.status(400).json({ error: 'Mechanic not assigned to this ticket' });
    }
    
    const updated = await removeFromArrayField(COLLECTIONS.SERVICE_TICKETS, ticketId, 'mechanic_ids', mechanicId);
    updated.message = 'Mechanic removed successfully';
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error removing mechanic:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /service-tickets/:ticketId/add-part/:partId - Add inventory part to ticket
 */
router.put('/:ticketId/add-part/:partId', async (req, res) => {
  try {
    const { ticketId, partId } = req.params;
    
    // Verify ticket exists
  const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    // Verify inventory part exists
    const partExists = await documentExists(COLLECTIONS.INVENTORY, partId);
    if (!partExists) {
      return res.status(404).json({ error: 'Inventory part not found' });
    }
    
    // Check if already added
    if (ticket.inventory_ids && ticket.inventory_ids.includes(partId)) {
      return res.status(409).json({ error: 'Part already added to this ticket' });
    }
    
    const updated = await addToArrayField(COLLECTIONS.SERVICE_TICKETS, ticketId, 'inventory_ids', partId);
    updated.message = 'Part added successfully';
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error adding part:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /service-tickets/:ticketId/remove-part/:partId - Remove inventory part from ticket
 */
router.put('/:ticketId/remove-part/:partId', async (req, res) => {
  try {
    const { ticketId, partId } = req.params;
    
    const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    // Check if part is added
    if (!ticket.inventory_ids || !ticket.inventory_ids.includes(partId)) {
      return res.status(400).json({ error: 'Part not added to this ticket' });
    }
    
    const updated = await removeFromArrayField(COLLECTIONS.SERVICE_TICKETS, ticketId, 'inventory_ids', partId);
    updated.message = 'Part removed successfully';
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error removing part:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /service-tickets/:ticketId/parts - Add multiple parts to ticket
 */
router.post('/:ticketId/parts', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { inventory_ids } = req.body;
    
    if (!inventory_ids || !Array.isArray(inventory_ids)) {
      return res.status(400).json({ error: 'inventory_ids must be an array' });
    }
    
    const ticket = await getDocumentById(COLLECTIONS.SERVICE_TICKETS, ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    
    // Verify all parts exist
    for (const partId of inventory_ids) {
      const exists = await documentExists(COLLECTIONS.INVENTORY, partId);
      if (!exists) {
        return res.status(404).json({ error: `Inventory part ${partId} not found` });
      }
    }
    
    // Add all parts (Firestore arrayUnion will handle duplicates)
    let updated = ticket;
    for (const partId of inventory_ids) {
      updated = await addToArrayField(COLLECTIONS.SERVICE_TICKETS, ticketId, 'inventory_ids', partId);
    }
    
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error adding multiple parts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /service-tickets/customer/:customerId - Get tickets by customer
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Verify customer exists
    const customerExists = await documentExists(COLLECTIONS.CUSTOMERS, customerId);
    if (!customerExists) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const tickets = await getTicketsByCustomer(customerId);
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /service-tickets/mechanic/:mechanicId - Get tickets by mechanic
 */
router.get('/mechanic/:mechanicId', async (req, res) => {
  try {
    const { mechanicId } = req.params;
    
    // Verify mechanic exists
    const mechanicExists = await documentExists(COLLECTIONS.MECHANICS, mechanicId);
    if (!mechanicExists) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }
    
    const tickets = await getTicketsByMechanic(mechanicId);
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching mechanic tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
