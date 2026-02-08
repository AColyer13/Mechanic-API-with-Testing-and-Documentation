/**
 * Tests for inventory endpoints using Firebase Emulators
 */

const { expect } = require('chai');
const axios = require('axios');
const { BASE_URL, getDb, setupTests, teardownTests, afterEachTest } = require('./setup');

describe('Inventory Endpoints', function() {
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
   * Helper: Create a test inventory part in Firestore
   */
  async function createTestInventory(name = 'Oil Filter', price = 12.99) {
    const db = getDb();
    
    const inventoryRef = await db.collection('inventory').add({
      name: name,
      price: price,
      created_at: new Date()
    });

    const inventory = await inventoryRef.get();
    return { id: inventory.id, ...inventory.data() };
  }

  // Positive Tests

  describe('POST /inventory - Create Inventory Part', () => {
    it('should create a new inventory part successfully', async () => {
      const response = await axios.post(`${BASE_URL}/inventory/`, {
        name: 'Brake Pads',
        price: 45.99
      });

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('id');
      expect(response.data.name).to.equal('Brake Pads');
      expect(response.data.price).to.equal(45.99);
    });

    it('should create inventory with minimal price', async () => {
      const response = await axios.post(`${BASE_URL}/inventory/`, {
        name: 'Washer Fluid',
        price: 0.99
      });

      expect(response.status).to.equal(201);
      expect(response.data.price).to.equal(0.99);
    });

    it('should fail with missing name', async () => {
      try {
        await axios.post(`${BASE_URL}/inventory/`, {
          price: 12.99
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });

    it('should fail with missing price', async () => {
      try {
        await axios.post(`${BASE_URL}/inventory/`, {
          name: 'Oil Filter'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });

    it('should fail with invalid price', async () => {
      try {
        await axios.post(`${BASE_URL}/inventory/`, {
          name: 'Oil Filter',
          price: 'not-a-number'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });

    it('should fail with empty name', async () => {
      try {
        await axios.post(`${BASE_URL}/inventory/`, {
          name: '',
          price: 12.99
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('GET /inventory - Get All Inventory', () => {
    it('should retrieve all inventory parts', async () => {
      await createTestInventory('Oil Filter', 12.99);
      await createTestInventory('Air Filter', 15.99);
      await createTestInventory('Spark Plugs', 8.99);

      const response = await axios.get(`${BASE_URL}/inventory/`);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(3);
    });

    it('should return empty array when no inventory exists', async () => {
      const response = await axios.get(`${BASE_URL}/inventory/`);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(0);
    });
  });

  describe('GET /inventory/:id - Get Inventory by ID', () => {
    it('should retrieve a specific inventory part', async () => {
      const inventory = await createTestInventory('Transmission Fluid', 29.99);

      const response = await axios.get(`${BASE_URL}/inventory/${inventory.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.id).to.equal(inventory.id);
      expect(response.data.name).to.equal('Transmission Fluid');
      expect(response.data.price).to.equal(29.99);
    });

    it('should return 404 for non-existent inventory part', async () => {
      try {
        await axios.get(`${BASE_URL}/inventory/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });
  });

  describe('PUT /inventory/:id - Update Inventory', () => {
    it('should update inventory part successfully', async () => {
      const inventory = await createTestInventory();

      const response = await axios.put(`${BASE_URL}/inventory/${inventory.id}`, {
        name: 'Premium Oil Filter',
        price: 15.99
      });

      expect(response.status).to.equal(200);
      expect(response.data.name).to.equal('Premium Oil Filter');
      expect(response.data.price).to.equal(15.99);
    });

    it('should update only some fields', async () => {
      const inventory = await createTestInventory('Oil Filter', 12.99);

      const response = await axios.put(`${BASE_URL}/inventory/${inventory.id}`, {
        price: 14.99
      });

      expect(response.status).to.equal(200);
      expect(response.data.name).to.equal('Oil Filter');
      expect(response.data.price).to.equal(14.99);
    });

    it('should return 404 for non-existent inventory part', async () => {
      try {
        await axios.put(`${BASE_URL}/inventory/nonexistent123`, {
          name: 'Updated Name',
          price: 20.00
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });

    it('should fail with invalid data', async () => {
      const inventory = await createTestInventory();

      try {
        await axios.put(`${BASE_URL}/inventory/${inventory.id}`, {
          price: 'invalid-price'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should fail with empty name', async () => {
      const inventory = await createTestInventory();

      try {
        await axios.put(`${BASE_URL}/inventory/${inventory.id}`, {
          name: ''
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('DELETE /inventory/:id - Delete Inventory', () => {
    it('should delete inventory part successfully', async () => {
      const inventory = await createTestInventory();

      const response = await axios.delete(`${BASE_URL}/inventory/${inventory.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('deleted successfully');
    });

    it('should return 404 for non-existent inventory part', async () => {
      try {
        await axios.delete(`${BASE_URL}/inventory/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });
  });
});
