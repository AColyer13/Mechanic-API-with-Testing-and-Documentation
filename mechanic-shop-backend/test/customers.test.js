/**
 * Tests for customer endpoints using Firebase Emulators
 */

const { expect } = require('chai');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { BASE_URL, getDb, setupTests, teardownTests, afterEachTest } = require('./setup');

describe('Customer Endpoints', function() {
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
  async function createTestCustomer(email = 'test@email.com', password = 'TestPassword123') {
    const db = getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const customerRef = await db.collection('customers').add({
      first_name: 'Test',
      last_name: 'User',
      email: email,
      password: hashedPassword,
      phone: '555-1234',
      address: '123 Test St',
      created_at: new Date()
    });

    const customer = await customerRef.get();
    return { id: customer.id, ...customer.data() };
  }

  /**
   * Helper: Login and get JWT token
   */
  async function loginCustomer(email = 'test@email.com', password = 'TestPassword123') {
    const response = await axios.post(`${BASE_URL}/customers/login`, {
      email,
      password
    });
    return response.data;
  }

  // Positive Tests

  describe('POST /customers - Create Customer', () => {
    it('should create a new customer successfully', async () => {
      const response = await axios.post(`${BASE_URL}/customers/`, {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@email.com',
        password: 'SecurePass123',
        phone: '555-5678',
        address: '456 Main St'
      });

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('id');
      expect(response.data.email).to.equal('john.doe@email.com');
      expect(response.data.first_name).to.equal('John');
    });

    it('should fail with missing required fields', async () => {
      try {
        await axios.post(`${BASE_URL}/customers/`, {
          first_name: 'John'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });

    it('should fail with duplicate email', async () => {
      await createTestCustomer('duplicate@email.com');

      try {
        await axios.post(`${BASE_URL}/customers/`, {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'duplicate@email.com',
          password: 'Password123'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(409);
        expect(error.response.data.error).to.include('already exists');
      }
    });
  });

  describe('POST /customers/login - Customer Login', () => {
    it('should login successfully with valid credentials', async () => {
      await createTestCustomer();

      const response = await axios.post(`${BASE_URL}/customers/login`, {
        email: 'test@email.com',
        password: 'TestPassword123'
      });

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      expect(response.data).to.have.property('customer');
      expect(response.data.message).to.equal('Login successful');
    });

    it('should fail with invalid email', async () => {
      try {
        await axios.post(`${BASE_URL}/customers/login`, {
          email: 'nonexistent@email.com',
          password: 'Password123'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.error).to.include('Invalid');
      }
    });

    it('should fail with invalid password', async () => {
      await createTestCustomer();

      try {
        await axios.post(`${BASE_URL}/customers/login`, {
          email: 'test@email.com',
          password: 'WrongPassword'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.error).to.include('Invalid');
      }
    });
  });

  describe('GET /customers - Get All Customers', () => {
    it('should retrieve all customers', async () => {
      await createTestCustomer('customer1@email.com');
      await createTestCustomer('customer2@email.com');

      const response = await axios.get(`${BASE_URL}/customers/`);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(2);
    });

    it('should return empty array when no customers exist', async () => {
      const response = await axios.get(`${BASE_URL}/customers/`);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(0);
    });
  });

  describe('GET /customers/:id - Get Customer by ID', () => {
    it('should retrieve a specific customer', async () => {
      const customer = await createTestCustomer();

      const response = await axios.get(`${BASE_URL}/customers/${customer.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.id).to.equal(customer.id);
      expect(response.data.email).to.equal(customer.email);
    });

    it('should return 404 for non-existent customer', async () => {
      try {
        await axios.get(`${BASE_URL}/customers/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });
  });

  describe('PUT /customers/:id - Update Customer', () => {
    it('should update customer with valid token', async () => {
      const customer = await createTestCustomer();
      const loginData = await loginCustomer();

      const response = await axios.put(
        `${BASE_URL}/customers/${customer.id}`,
        {
          first_name: 'Updated',
          phone: '555-9999'
        },
        {
          headers: {
            Authorization: `Bearer ${loginData.token}`
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data.first_name).to.equal('Updated');
      expect(response.data.phone).to.equal('555-9999');
    });

    it('should fail without authentication token', async () => {
      const customer = await createTestCustomer();

      try {
        await axios.put(`${BASE_URL}/customers/${customer.id}`, {
          first_name: 'Updated'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should fail when updating different customer account', async () => {
      const customer1 = await createTestCustomer('customer1@email.com');
      await createTestCustomer('customer2@email.com', 'Pass456');

      const loginData = await loginCustomer('customer1@email.com', 'TestPassword123');

      // Get customer2's ID
      const db = getDb();
      const customer2Snapshot = await db.collection('customers')
        .where('email', '==', 'customer2@email.com')
        .get();
      const customer2Id = customer2Snapshot.docs[0].id;

      try {
        await axios.put(
          `${BASE_URL}/customers/${customer2Id}`,
          { first_name: 'Hacker' },
          {
            headers: {
              Authorization: `Bearer ${loginData.token}`
            }
          }
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(403);
        expect(error.response.data.error).to.include('only update your own');
      }
    });
  });

  describe('DELETE /customers/:id - Delete Customer', () => {
    it('should delete customer with valid token', async () => {
      const customer = await createTestCustomer();
      const loginData = await loginCustomer();

      const response = await axios.delete(
        `${BASE_URL}/customers/${customer.id}`,
        {
          headers: {
            Authorization: `Bearer ${loginData.token}`
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('deleted successfully');
    });

    it('should fail without authentication token', async () => {
      const customer = await createTestCustomer();

      try {
        await axios.delete(`${BASE_URL}/customers/${customer.id}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });

  describe('GET /customers/my-tickets - Get My Tickets', () => {
    it('should retrieve authenticated customers tickets', async () => {
      const customer = await createTestCustomer();
      const loginData = await loginCustomer();

      const response = await axios.get(
        `${BASE_URL}/customers/my-tickets`,
        {
          headers: {
            Authorization: `Bearer ${loginData.token}`
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
    });

    it('should fail without authentication token', async () => {
      try {
        await axios.get(`${BASE_URL}/customers/my-tickets`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });
});
