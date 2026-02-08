/**
 * Tests for mechanic endpoints using Firebase Emulators
 */

const { expect } = require('chai');
const axios = require('axios');
const { BASE_URL, getDb, setupTests, teardownTests, afterEachTest } = require('./setup');

describe('Mechanic Endpoints', function() {
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
      hire_date: new Date('2024-01-15'),
      created_at: new Date()
    });

    const mechanic = await mechanicRef.get();
    return { id: mechanic.id, ...mechanic.data() };
  }

  // Positive Tests

  describe('POST /mechanics - Create Mechanic', () => {
    it('should create a new mechanic successfully', async () => {
      const response = await axios.post(`${BASE_URL}/mechanics/`, {
        first_name: 'Tom',
        last_name: 'Johnson',
        email: 'tom.johnson@shop.com',
        phone: '555-1111',
        specialty: 'Transmission',
        hourly_rate: 95.00,
        hire_date: '2024-02-01'
      });

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('id');
      expect(response.data.email).to.equal('tom.johnson@shop.com');
      expect(response.data.specialty).to.equal('Transmission');
    });

    it('should create mechanic with only required fields', async () => {
      const response = await axios.post(`${BASE_URL}/mechanics/`, {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@shop.com'
      });

      expect(response.status).to.equal(201);
      expect(response.data.first_name).to.equal('Jane');
    });

    it('should fail with missing required fields', async () => {
      try {
        await axios.post(`${BASE_URL}/mechanics/`, {
          first_name: 'Mike'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });

    it('should fail with duplicate email', async () => {
      await createTestMechanic('duplicate@shop.com');

      try {
        await axios.post(`${BASE_URL}/mechanics/`, {
          first_name: 'Another',
          last_name: 'Mechanic',
          email: 'duplicate@shop.com'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(409);
        expect(error.response.data.error).to.include('already exists');
      }
    });

    it('should fail with invalid email format', async () => {
      try {
        await axios.post(`${BASE_URL}/mechanics/`, {
          first_name: 'Mike',
          last_name: 'Smith',
          email: 'not-an-email'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('errors');
      }
    });
  });

  describe('GET /mechanics - Get All Mechanics', () => {
    it('should retrieve all mechanics', async () => {
      await createTestMechanic('mechanic1@shop.com');
      await createTestMechanic('mechanic2@shop.com');

      const response = await axios.get(`${BASE_URL}/mechanics/`);

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(2);
    });
  });

  describe('GET /mechanics/:id - Get Mechanic by ID', () => {
    it('should retrieve a specific mechanic', async () => {
      const mechanic = await createTestMechanic();

      const response = await axios.get(`${BASE_URL}/mechanics/${mechanic.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.id).to.equal(mechanic.id);
      expect(response.data.email).to.equal(mechanic.email);
      expect(response.data.specialty).to.equal('Engine Repair');
    });

    it('should return 404 for non-existent mechanic', async () => {
      try {
        await axios.get(`${BASE_URL}/mechanics/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });
  });

  describe('PUT /mechanics/:id - Update Mechanic', () => {
    it('should update mechanic successfully', async () => {
      const mechanic = await createTestMechanic();

      const response = await axios.put(`${BASE_URL}/mechanics/${mechanic.id}`, {
        specialty: 'Brake Specialist',
        hourly_rate: 90.00
      });

      expect(response.status).to.equal(200);
      expect(response.data.specialty).to.equal('Brake Specialist');
      expect(response.data.hourly_rate).to.equal(90.00);
    });

    it('should return 404 for non-existent mechanic', async () => {
      try {
        await axios.put(`${BASE_URL}/mechanics/nonexistent123`, {
          specialty: 'New Specialty'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });

    it('should fail when updating to duplicate email', async () => {
      const mechanic1 = await createTestMechanic('mechanic1@shop.com');
      const mechanic2 = await createTestMechanic('mechanic2@shop.com');

      try {
        await axios.put(`${BASE_URL}/mechanics/${mechanic2.id}`, {
          email: 'mechanic1@shop.com'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(409);
        expect(error.response.data.error).to.include('already exists');
      }
    });

    it('should fail with invalid data', async () => {
      const mechanic = await createTestMechanic();

      try {
        await axios.put(`${BASE_URL}/mechanics/${mechanic.id}`, {
          hourly_rate: 'not-a-number'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('DELETE /mechanics/:id - Delete Mechanic', () => {
    it('should delete mechanic successfully', async () => {
      const mechanic = await createTestMechanic();

      const response = await axios.delete(`${BASE_URL}/mechanics/${mechanic.id}`);

      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('deleted successfully');
    });

    it('should return 404 for non-existent mechanic', async () => {
      try {
        await axios.delete(`${BASE_URL}/mechanics/nonexistent123`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.error).to.include('not found');
      }
    });
  });
});
