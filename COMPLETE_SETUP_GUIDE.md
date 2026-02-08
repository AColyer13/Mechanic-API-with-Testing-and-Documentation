# 🎯 Complete Setup Guide: Firebase API + Frontend Integration

## Overview

Your Mechanic Shop API is now fully set up with:
- ✅ Firebase Cloud Functions (Node.js/Express)
- ✅ Firestore Database
- ✅ JWT Authentication
- ✅ CORS configured for frontend access
- ✅ Data seeding capability
- ✅ 55+ integration tests

---

## 🚀 Step-by-Step Workflow

### 1️⃣ Populate Firestore with Sample Data

#### Local Development (Emulator):

```bash
# Terminal 1: Start Firebase Emulators
cd backend
npm run serve
```

Wait for: `✔  All emulators ready!`

```bash
# Terminal 2: Seed the database
cd backend
npm run seed:emulator
```

**Result**: Database now has 3 customers, 4 mechanics, 12 inventory items, and 5 service tickets!

**View Data**: http://localhost:4000 (Firestore Emulator UI)

#### Production (Live Firebase):

```bash
cd backend
npm run seed
```

⚠️ **Warning**: This clears all existing production data!

---

### 2️⃣ Test the API Endpoints

#### Test Health Check:
```bash
curl http://localhost:5001/mechanicshopapi/us-central1/api/health
```

#### Test Customer Login:
```bash
curl -X POST http://localhost:5001/mechanicshopapi/us-central1/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@email.com","password":"password123"}'
```

**You'll get back**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "customer": {
    "id": "abc123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@email.com",
    ...
  }
}
```

#### Test Protected Endpoint (My Tickets):
```bash
# Save token from login response
TOKEN="your-jwt-token-here"

curl http://localhost:5001/mechanicshopapi/us-central1/api/customers/my-tickets \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3️⃣ Connect Your Frontend

Your frontend needs to make HTTP requests to the Firebase API.

#### API URLs:

**Production (Firebase)**:
```
https://us-central1-mechanicshopapi.cloudfunctions.net/api
```

**Local Development (Emulator)**:
```
http://localhost:5001/mechanicshopapi/us-central1/api
```

#### Frontend Setup Steps:

1. **Create environment variables** in your frontend project:
   ```env
   # .env
   VITE_API_URL=https://us-central1-mechanicshopapi.cloudfunctions.net/api
   ```

2. **Create API service** (see [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) for complete code):
   ```javascript
   // src/services/api.js
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
     headers: { 'Content-Type': 'application/json' }
   });
   
   // Add auth token to requests
   api.interceptors.request.use(config => {
     const token = localStorage.getItem('authToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   
   export default api;
   ```

3. **Create service files** for each resource:
   - `customerService.js` - Login, register, get tickets
   - `mechanicService.js` - CRUD operations for mechanics
   - `inventoryService.js` - CRUD operations for inventory
   - `serviceTicketService.js` - Ticket management, assign mechanics, add parts

   📖 **Complete code examples**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

4. **Update your existing frontend** (Mechanic-Website repo):
   - Replace API base URLs with Firebase URL
   - Update authentication to use JWT tokens
   - Test all features

---

## 📁 Project Structure

```
Mechanic-API-Copy-with-Testing-and-Documentation/
├── backend/                          # Firebase Cloud Functions
│   ├── index.js                     # Main entry point (CORS configured)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── customers.js         # Customer endpoints (login, register, etc.)
│   │   │   ├── mechanics.js         # Mechanic CRUD
│   │   │   ├── inventory.js         # Inventory CRUD
│   │   │   └── serviceTickets.js    # Ticket management
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification
│   │   └── models/
│   │       └── firestoreHelper.js   # Firestore database helpers
│   ├── scripts/
│   │   └── seedData.js              # Database seeding script
│   ├── test/                        # 55+ integration tests
│   │   ├── setup.js
│   │   ├── customers.test.js
│   │   ├── mechanics.test.js
│   │   ├── inventory.test.js
│   │   └── serviceTickets.test.js
│   └── package.json
├── firebase.json                    # Firebase configuration
├── firestore.rules                  # Security rules
├── firestore.indexes.json           # Database indexes
├── DATABASE_SEEDING.md             # This guide
├── FRONTEND_INTEGRATION.md         # Complete frontend integration guide
├── FIREBASE_TESTING_MIGRATION.md   # Testing documentation
└── README.md                       # Main documentation
```

---

## 🔐 Sample Test Credentials

After seeding, use these credentials:

```
Email: john.doe@email.com
Password: password123
```

Additional test accounts:
- `jane.smith@email.com` / `password456`
- `bob.johnson@email.com` / `password789`

---

## 🎯 Complete Workflow Example

### Scenario: Frontend User Creates a Service Ticket

1. **User logs in** (Frontend calls `/customers/login`):
   ```javascript
   const response = await customerService.login(email, password);
   localStorage.setItem('authToken', response.token);
   ```

2. **Frontend fetches available mechanics**:
   ```javascript
   const mechanics = await mechanicService.getAll();
   // Display in dropdown
   ```

3. **User creates ticket** (Frontend calls `/service-tickets/`):
   ```javascript
   const ticket = await serviceTicketService.create({
     customer_id: currentCustomer.id,
     vehicle_year: 2020,
     vehicle_make: 'Toyota',
     vehicle_model: 'Camry',
     description: 'Oil change needed',
     estimated_cost: 89.99,
     status: 'Open'
   });
   ```

4. **Admin assigns mechanic** (Frontend calls `/service-tickets/:id/assign-mechanic/:mechanicId`):
   ```javascript
   await serviceTicketService.assignMechanic(ticket.id, selectedMechanic.id);
   ```

5. **Admin adds parts** (Frontend calls `/service-tickets/:id/add-part/:partId`):
   ```javascript
   await serviceTicketService.addPart(ticket.id, oilFilterId);
   await serviceTicketService.addPart(ticket.id, engineOilId);
   ```

6. **Mechanic completes work** (Frontend calls `/service-tickets/:id` PUT):
   ```javascript
   await serviceTicketService.update(ticket.id, {
     status: 'Completed',
     actual_cost: 89.99
   });
   ```

---

## 🧪 Testing Everything Works

### Run Integration Tests:
```bash
# Terminal 1: Start emulators
cd backend
npm run serve

# Terminal 2: Run tests
cd backend
npm test
```

**Expected output**: 55+ tests passing ✅

### Test with Postman:
1. Import `Mechanic API.postman_collection.json`
2. Collection is already configured for Firebase API
3. Test the "Login Customer" request
4. Token is automatically saved for subsequent requests

---

## 🌐 CORS Configuration

Your API is configured to accept requests from:
- ✅ `http://localhost:3000` (React dev server)
- ✅ `http://localhost:5173` (Vite dev server)
- ✅ `https://acolyer13.github.io` (Your GitHub Pages site)
- ✅ All localhost variations for development

**Location**: [backend/index.js](backend/index.js#L18-L42)

To add more origins, edit the `allowedOrigins` array.

---

## 📚 Available Endpoints

### Customers
- `POST /customers/` - Register
- `POST /customers/login` - Login (returns JWT)
- `GET /customers/` - Get all
- `GET /customers/:id` - Get one
- `GET /customers/my-tickets` - Get my tickets (requires auth)
- `PUT /customers/:id` - Update (requires auth)
- `DELETE /customers/:id` - Delete (requires auth)

### Mechanics
- `POST /mechanics/` - Create
- `GET /mechanics/` - Get all
- `GET /mechanics/:id` - Get one
- `PUT /mechanics/:id` - Update
- `DELETE /mechanics/:id` - Delete

### Inventory
- `POST /inventory/` - Create
- `GET /inventory/` - Get all
- `GET /inventory/:id` - Get one
- `PUT /inventory/:id` - Update
- `DELETE /inventory/:id` - Delete

### Service Tickets
- `POST /service-tickets/` - Create
- `GET /service-tickets/` - Get all
- `GET /service-tickets/:id` - Get one
- `PUT /service-tickets/:id` - Update
- `DELETE /service-tickets/:id` - Delete
- `PUT /service-tickets/:id/assign-mechanic/:mechanicId` - Assign mechanic
- `PUT /service-tickets/:id/remove-mechanic/:mechanicId` - Remove mechanic
- `PUT /service-tickets/:id/add-part/:partId` - Add part
- `PUT /service-tickets/:id/remove-part/:partId` - Remove part
- `POST /service-tickets/:id/parts` - Add multiple parts
- `GET /service-tickets/customer/:customerId` - Get by customer
- `GET /service-tickets/mechanic/:mechanicId` - Get by mechanic

---

## 🔗 Quick Links

- **Firebase API (Production)**: https://us-central1-mechanicshopapi.cloudfunctions.net/api
- **Emulator UI**: http://localhost:4000
- **Frontend Repo**: https://github.com/AColyer13/Mechanic-Website
- **Postman Collection**: [Mechanic API.postman_collection.json](Mechanic%20API.postman_collection.json)

---

## 🆘 Common Issues & Solutions

### Issue: Frontend can't connect to API
**Solution**: Check CORS configuration in `backend/index.js`

### Issue: "Token expired" errors
**Solution**: Tokens last 24 hours. User needs to login again.

### Issue: Emulator data disappears
**Solution**: Emulator data is temporary. Re-seed with `npm run seed:emulator`

### Issue: Tests failing
**Solution**: Make sure emulators are running first (`npm run serve`)

---

## 🎉 Success Checklist

- ✅ Firebase emulators running
- ✅ Database seeded with sample data
- ✅ Can view data in Emulator UI (http://localhost:4000)
- ✅ Login endpoint returns JWT token
- ✅ Protected endpoints work with token
- ✅ All 55+ tests passing
- ✅ Frontend can connect to API
- ✅ CORS working (no blocked requests)

---

## 📖 Further Reading

1. **[DATABASE_SEEDING.md](DATABASE_SEEDING.md)** - Database seeding guide
2. **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** - Complete frontend integration
3. **[FIREBASE_TESTING_MIGRATION.md](FIREBASE_TESTING_MIGRATION.md)** - Testing guide
4. **[README.md](README.md)** - Main documentation

---

**🚀 You're all set! Your API is ready to connect to your frontend.**
