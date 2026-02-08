/**
 * Tests for service ticket endpoints using Firebase Emulators
 */

const { expect } = require('chai');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { BASE_URL, getDb, setupTests, teardownTests, afterEachTest } = require('./setup');

describe('Service Ticket Endpoints', function() {
  this.timeout(10000);

  before(async () => {
    await setupTests();
  });

  after(async () => {
    await teardownTests();
  });

  afterEach(async () => {
    await afterEachTest();
  });

  /**
   * Helper: Create a test customer in Firestore
   */
  async function createTestCustomer(email = 'customer@email.com') {
    const db = getDb();
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const customerRef = await db.collection('customers').add({
      first_name: 'Test',
      last_name: 'Customer',
      email: email,
      password: hashedPassword,
      phone: '555-1234',
      created_at: new Date()
    });

    const customer = await customerRef.get();
    return { id: customer.id, ...customer.data() };
  }

  /**
   * Helper: Create a test mechanic in Firestore
   */
  async function createTestMechanic(email = 'mechanic@shop.com') {
    const db = getDb();
    
    const mechanicRef = await db.collection('mechanics').add({
      first_name: 'Mike',
      last_name: 'Smith',
      email: email,
      phone: '555-9876',
      specialty: 'Engine Repair',
      hourly_rate: 85.50,
      created_at: new Date()
    });

    const mechanic = await mechanicRef.get();
    return { id: mechanic.id, ...mechanic.data() };
  }

  /**
   * Helper: Create a test inventory part in Firestore
   */
  async function createTestInventory(name = 'Oil Filter') {
    const db = getDb();
    
    const inventoryRef = await db.collection('inventory').add({
      name: name,
      price: 12.99,
      created_at: new Date()
    });

    const inventory = await inventoryRef.get();
    return { id: inventory.id, ...inventory.data() };
  }

  /**
   * Helper: Create a test service ticket in Firestore
   */
  async function createTestTicket(customerId) {
    const db = getDb();
    
    const ticketRef = await db.collection('serviceTickets').add({
      customer_id: customerId,
      vehicle_year: 2020,
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      vehicle_vin: '1HGBH41JXMN109186',
      description: 'Oil change needed',
      estimated_cost: 150.00,
      status: 'Open',
      mechanic_ids: [],
      inventory_ids: [],
      created_at: new Date()
    });

    const ticket = await ticketRef.get();
    return { id: ticket.id, ...ticket.data() };
  }

  // Positive Tests

  describe('POST /service-tickets - Create Service Ticket', () => {
    it('should create a new service ticket successfully', async () => {
      const customer = await createTestCustomer();

      const response = await axios.post(`${BASE_URL}/service-tickets/`, {
        customer_id: customer.id,
        vehicle_year: 2021,
        vehicle_make: 'Honda',
        vehicle_model: 'Accord',
        vehicle_vin: '1HGCV1F30JA123456',
        description: 'Brake inspection and repair',
        estimated_cost: 300.00,
        status: 'Open'
      });

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('id');
      expect(response.data.customer_id).to.equal(customer.id);
      expect(response.data.vehicle_make).to.equal('Honda');
    });

    it('should fail with missing required fields', async () => {
      try {
        await axios.post(`${BASE_URL}/service-tickets/`, {
          vehicle_make: 'Honda'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });

    it('should fail with invalid customer', async () => {
      try {
        await axios.post(`${BASE_URL}/service-tickets/`, {
          customer_id: 'nonexistent123',
          description: 'Test service',
          status: 'Open'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('GET /service-tickets - Get All Service Tickets', () => {
    it('should retrieve all service tickets', async () => {
      const customer = await createTestCustomer();
      await createTestTicket(customer.id);
      await createTestTicket(customer.id);

      const response = await axios.get(`${BASE_URL}/service-tickets/`);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(2);
    });
  });

  describe('GET /service-tickets/:id - Get Service Ticket by ID', () => {
    it('should retrieve a specific service ticket', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);

      const response = await axios.get(`${BASE_URL}/service-tickets/${ticket.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.id).to.equal(ticket.id);
      expect(response.data.description).to.equal('Oil change needed');
    });

    it('should return 404 for non-existent ticket', async () => {
      try {
        await axios.get(`${BASE_URL}/service-tickets/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('PUT /service-tickets/:id - Update Service Ticket', () => {
    it('should update service ticket successfully', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);

      const response = await axios.put(`${BASE_URL}/service-tickets/${ticket.id}`, {
        description: 'Oil change and tire rotation',
        actual_cost: 145.50,
        status: 'In Progress'
      });

      expect(response.status).to.equal(200);
      expect(response.data.description).to.equal('Oil change and tire rotation');
      expect(response.data.status).to.equal('In Progress');
    });

    it('should set completed_at when status is Completed', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);

      const response = await axios.put(`${BASE_URL}/service-tickets/${ticket.id}`, {
        status: 'Completed',
        actual_cost: 150.00
      });

      expect(response.status).to.equal(200);
      expect(response.data.status).to.equal('Completed');
      expect(response.data).to.have.property('completed_at');
    });

    it('should return 404 for non-existent ticket', async () => {
      try {
        await axios.put(`${BASE_URL}/service-tickets/nonexistent123`, {
          description: 'Updated'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('DELETE /service-tickets/:id - Delete Service Ticket', () => {
    it('should delete service ticket successfully', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);

      const response = await axios.delete(`${BASE_URL}/service-tickets/${ticket.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('deleted successfully');
    });

    it('should return 404 for non-existent ticket', async () => {
      try {
        await axios.delete(`${BASE_URL}/service-tickets/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('PUT /service-tickets/:id/assign-mechanic/:mechanicId - Assign Mechanic', () => {
    it('should assign mechanic to ticket successfully', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const mechanic = await createTestMechanic();

      const response = await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/assign-mechanic/${mechanic.id}`
      );

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('assigned');
    });

    it('should fail with non-existent ticket', async () => {
      const mechanic = await createTestMechanic();

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/nonexistent123/assign-mechanic/${mechanic.id}`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should fail with non-existent mechanic', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/${ticket.id}/assign-mechanic/nonexistent123`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('PUT /service-tickets/:id/remove-mechanic/:mechanicId - Remove Mechanic', () => {
    it('should remove mechanic from ticket successfully', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const mechanic = await createTestMechanic();

      // First assign the mechanic
      await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/assign-mechanic/${mechanic.id}`
      );

      // Then remove
      const response = await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/remove-mechanic/${mechanic.id}`
      );

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('removed');
    });

    it('should fail when mechanic is not assigned', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const mechanic = await createTestMechanic();

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/${ticket.id}/remove-mechanic/${mechanic.id}`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('GET /service-tickets/customer/:customerId - Get Tickets by Customer', () => {
    it('should retrieve all tickets for a customer', async () => {
      const customer = await createTestCustomer();
      await createTestTicket(customer.id);
      await createTestTicket(customer.id);

      const response = await axios.get(
        `${BASE_URL}/service-tickets/customer/${customer.id}`
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(2);
    });

    it('should return 404 for non-existent customer', async () => {
      try {
        await axios.get(`${BASE_URL}/service-tickets/customer/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('GET /service-tickets/mechanic/:mechanicId - Get Tickets by Mechanic', () => {
    it('should retrieve all tickets for a mechanic', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const mechanic = await createTestMechanic();

      // Assign mechanic to ticket
      await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/assign-mechanic/${mechanic.id}`
      );

      const response = await axios.get(
        `${BASE_URL}/service-tickets/mechanic/${mechanic.id}`
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(1);
    });

    it('should return 404 for non-existent mechanic', async () => {
      try {
        await axios.get(`${BASE_URL}/service-tickets/mechanic/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('PUT /service-tickets/:id/add-part/:inventoryId - Add Part to Ticket', () => {
    it('should add inventory part to ticket successfully', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const inventory = await createTestInventory();

      const response = await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/add-part/${inventory.id}`
      );

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('added');
    });

    it('should fail with non-existent ticket', async () => {
      const inventory = await createTestInventory();

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/nonexistent123/add-part/${inventory.id}`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should fail with non-existent part', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/${ticket.id}/add-part/nonexistent123`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('PUT /service-tickets/:id/remove-part/:inventoryId - Remove Part from Ticket', () => {
    it('should remove inventory part from ticket successfully', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const inventory = await createTestInventory();

      // First add the part
      await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/add-part/${inventory.id}`
      );

      // Then remove
      const response = await axios.put(
        `${BASE_URL}/service-tickets/${ticket.id}/remove-part/${inventory.id}`
      );

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('removed');
    });

    it('should fail when part is not added', async () => {
      const customer = await createTestCustomer();
      const ticket = await createTestTicket(customer.id);
      const inventory = await createTestInventory();

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/${ticket.id}/remove-part/${inventory.id}`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should fail with non-existent ticket', async () => {
      const inventory = await createTestInventory();

      try {
        await axios.put(
          `${BASE_URL}/service-tickets/nonexistent123/remove-part/${inventory.id}`
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });
});
