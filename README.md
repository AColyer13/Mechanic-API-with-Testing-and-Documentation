
# Mechanic Shop API

https://mechanicshopapi.web.app/

A full‑featured **RESTful API** for managing a mechanic shop, available in two versions:
1. **Flask (Python)** - Original version with MySQL
2. **Firebase Cloud Functions (Node.js)** - New serverless version with Firestore

Supports complete CRUD for **Customers**, **Mechanics**, **Service Tickets**, and **Inventory Parts**, with JWT authentication, and comprehensive automated tests.

### Live Links
- **Flask API (Render)**: https://mechanic-api-copy-with-testing-and.onrender.com
- **Firebase API**: https://us-central1-mechanicshopapi.cloudfunctions.net/api
- **Frontend Web App**: https://acolyer13.github.io/Mechanic-Website/
- **Interactive Docs (Swagger UI)**: https://mechanic-api-copy-with-testing-and.onrender.com/api/docs
- **Firebase Emulator UI**: http://localhost:4000 (when running locally)

---

## Quick Start

### 1. Web App – No Coding Required (Recommended for regular users)
→ https://acolyer13.github.io/Mechanic-Website/  
Full shop management with customer login.

### 2. Swagger UI – Test Directly in Browser (Recommended for developers)
→ https://mechanic-api-copy-with-testing-and.onrender.com/api/docs  
Interactive documentation with “Try it out” for every endpoint.

### 3. Direct API Calls
**Base URL**: `https://mechanic-api-copy-with-testing-and.onrender.com`

| Resource        | Endpoint             |
|-----------------|----------------------|
| Customers       | `/customers`         |
| Mechanics       | `/mechanics`         |
| Service Tickets | `/service-tickets`   |
| Inventory       | `/inventory`         |

### 4. Other Tools
- **Postman** → Import `Mechanic API.postman_collection.json` (40+ requests with auto‑token). In Postman, click "Import" and select the file to get started. The collection will automatically handle login and token usage for you.
- **cURL** → Examples below
- **Python CLI Client** → `python client.py` (already points to live API)

---

## Core Features

### Relationships
- Customers → Service Tickets (One‑to‑Many)
- Mechanics ↔ Service Tickets (Many‑to‑Many)
- Inventory Parts ↔ Service Tickets (Many‑to‑Many)

### Security & Authentication
- JWT login (`POST /customers/login`)
- Protected routes require `Authorization: Bearer <token>`
- Customers can only access/modify their own data
- Passwords hashed with **bcrypt**
- Tokens expire after 24 hours (HS256)

### Performance & Protection
- **Rate limiting** (Flask‑Limiter)  
  - Customer & Mechanic creation: **10/min**  
  - Inventory creation: **20/min**  
  - Global default: **200/day, 50/hour**
- **Caching** (5‑minute TTL) on all list endpoints – auto‑cleared on write operations
- Input validation with Marshmallow schemas

### Data Integrity (Cascades)
- Delete customer → deletes all their tickets
- Delete ticket → removes mechanic & part associations
- Delete mechanic/part → only removes the link (tickets remain)

---

## API Endpoints

### Customers (`/customers`)

| Method | Endpoint                | Description                     | Auth |
|--------|-------------------------|---------------------------------|------|
| POST   | `/customers/`           | Register                        | No   |
| POST   | `/customers/login`      | Login → JWT token               | No   |
| GET    | `/customers/`           | List all (cached)               | No   |
| GET    | `/customers/<id>`       | Get one                         | No   |
| GET    | `/customers/my-tickets` | Own tickets                     | Yes  |
| PUT    | `/customers/<id>`       | Update own account              | Yes  |
| DELETE | `/customers/<id>`       | Delete own account              | Yes  |


### Mechanics (`/mechanics`)

| Method | Endpoint                | Description              | Auth |
|--------|-------------------------|--------------------------|------|
| POST   | `/mechanics/`           | Create mechanic          | No   |
| GET    | `/mechanics/`           | List all (cached)        | No   |
| GET    | `/mechanics/<id>`       | Get one                  | No   |
| PUT    | `/mechanics/<id>`       | Update mechanic          | No   |
| DELETE | `/mechanics/<id>`       | Delete mechanic          | No   |

### Inventory (`/inventory`)

**Required fields for creating an inventory item:**
- `name` (string, required)
- `quantity` (integer, required)
- `price` (float, required)
- `description` (string, optional)

| Method | Endpoint                | Description              | Auth |
|--------|-------------------------|--------------------------|------|
| POST   | `/inventory/`           | Create inventory item    | No   |
| GET    | `/inventory/`           | List all (cached)        | No   |
| GET    | `/inventory/<id>`       | Get one                  | No   |
| PUT    | `/inventory/<id>`       | Update inventory item    | No   |
| DELETE | `/inventory/<id>`       | Delete inventory item    | No   |

### Service Tickets (`/service-tickets`)

| Method | Endpoint                                          | Description                     |
|--------|---------------------------------------------------|---------------------------------|
| POST   | `/service-tickets/`                               | Create ticket                   |
| GET    | `/service-tickets/`                               | List all with customer, mechanic, and inventory parts info |
| GET    | `/service-tickets/<id>`                           | Get one with customer, mechanic, and inventory parts info |
| PUT    | `/service-tickets/<id>`                           | Update                          |
| DELETE | `/service-tickets/<id>`                           | Delete                          |
| PUT    | `/service-tickets/<id>/assign-mechanic/<mid>`     | Assign mechanic                 |
| PUT    | `/service-tickets/<id>/remove-mechanic/<mid>`     | Remove mechanic                 |
| PUT    | `/service-tickets/<id>/add-part/<pid>`            | Add part                        |
| POST   | `/service-tickets/<id>/parts`                     | Add multiple parts              |
| PUT    | `/service-tickets/<id>/remove-part/<pid>`         | Remove part                     |

---


## Example Requests (Live API)

### Customers
### Mechanics
```bash
# Create mechanic
curl -X POST https://mechanic-api-copy-with-testing-and.onrender.com/mechanics/ \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Jane","last_name":"Smith","email":"jane@shop.com","phone":"555-5678","specialty":"Engine Repair","hourly_rate":85.00,"hire_date":"2023-01-15"}'
```

### Inventory
```bash
# Create inventory item
curl -X POST https://mechanic-api-copy-with-testing-and.onrender.com/inventory/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Oil Filter","quantity":10,"price":12.99,"description":"Premium oil filter"}'
```

### Service Tickets
```bash
# Create service ticket
curl -X POST https://mechanic-api-copy-with-testing-and.onrender.com/service-tickets/ \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"vehicle_year":2020,"vehicle_make":"Toyota","vehicle_model":"Camry","description":"Oil change needed","estimated_cost":100.00,"status":"Open"}'
```
## Error Handling

The API uses standard HTTP status codes to indicate success or failure:

- **400 Bad Request**: Missing or invalid data (e.g., required fields not provided, wrong data type)
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource does not exist (e.g., wrong ID)
- **409 Conflict**: Resource conflict (e.g., adding a part that is already linked)
- **500 Internal Server Error**: Unexpected server error

Error responses are returned as JSON with an `error` or `errors` field describing the problem.

```bash
# Register
curl -X POST https://mechanic-api-copy-with-testing-and.onrender.com/customers/ \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","email":"john@example.com","password":"secret123","phone":"555-1234"}'

# Login
curl -X POST https://mechanic-api-copy-with-testing-and.onrender.com/customers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'

# Use token (replace <token>)
curl -X GET https://mechanic-api-copy-with-testing-and.onrender.com/customers/my-tickets \
  -H "Authorization: Bearer <token>"
```
More examples are in the Postman collection.

---

## Tech Stack

| Layer         | Technology                                 |
|---------------|---------------------------------------------|
| Framework     | Flask 3.0 (Python) / Express (Node.js)      |
| Database      | MySQL + SQLAlchemy / Firestore              |
| Auth          | JWT (python‑jose / jsonwebtoken) + bcrypt   |
| Validation    | Marshmallow / Express validators            |
| Rate Limiting | Flask‑Limiter                               |
| Caching       | Flask‑Caching (5‑min TTL)                   |
| Testing       | unittest (90+ tests) / Mocha+Chai (55+ tests) |
| Documentation | Flask‑Rebar → Swagger UI                    |
| Deployment    | Render (Flask) / Firebase (Cloud Functions) |
| CI/CD         | GitHub Actions / Firebase Emulators         |

## Testing & CI/CD

### Flask (Python) Tests
- 90+ unit tests (in‑memory SQLite, no production impact)
- Covers authentication, validation, relationships, errors
- GitHub Actions pipeline runs on every push/PR:
  - Build
  - Test
  - Deploy to Render only on push to main

**Run locally:**

```bash
python -m unittest discover tests
```

### Firebase Emulator Tests
- 55+ integration tests using Firebase Emulators
- Tests actual Cloud Functions with Firestore
- Complete endpoint coverage with real HTTP requests
- Automatic data cleanup between tests

**Run locally:**

```bash
# Terminal 1: Start emulators
cd backend
npm run serve

# Terminal 2: Run tests
cd backend
npm test
```

**📖 See [FIREBASE_TESTING_MIGRATION.md](FIREBASE_TESTING_MIGRATION.md) for complete Firebase testing documentation**

---

## Firebase Deployment

The API is also deployed as Firebase Cloud Functions with Firestore database.

### Quick Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy --only "functions,firestore"
```

**Firebase Project:** `mechanicshopapi`  
**Live URL:** https://us-central1-mechanicshopapi.cloudfunctions.net/api

### Firebase Structure

```
backend/
├── index.js                    # Cloud Functions entry point
├── src/
│   ├── routes/
│   │   ├── customers.js
│   │   ├── mechanics.js
│   │   ├── inventory.js
│   │   └── serviceTickets.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   └── models/
│       └── firestoreHelper.js  # Firestore utilities
├── test/                       # Firebase emulator tests
│   ├── setup.js
│   ├── customers.test.js
│   ├── mechanics.test.js
│   ├── inventory.test.js
│   └── serviceTickets.test.js
└── package.json

firebase.json                   # Firebase configuration
firestore.rules                 # Firestore security rules
firestore.indexes.json          # Firestore indexes
```

### Postman Collection

The Postman collection has been updated to work with both APIs:
- **Flask API**: Use `http://127.0.0.1:5000` for local or Render URL for production
- **Firebase API**: Use `https://us-central1-mechanicshopapi.cloudfunctions.net/api`

Import `Mechanic API.postman_collection.json` (configured for Firebase by default)

## Project Structure

```
project-root/
├── application/
│   ├── __init__.py              # create_app() factory
│   ├── extensions.py            # db, cache, limiter, JWT
│   ├── models.py                # SQLAlchemy models
│   ├── blueprints/
│   │   ├── customer/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── customerSchemas.py
│   │   ├── mechanic/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   ├── service_ticket/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   ├── inventory/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   └── ...
│   └── static/
│       └── swagger.yaml         # OpenAPI docs
├── instance/
│   └── ...                      # Instance config, e.g., SQLite DB
├── tests/
│   ├── __init__.py
│   ├── base_test.py
│   ├── test_customers.py
│   ├── test_inventory.py
│   ├── test_mechanics.py
│   ├── test_service_tickets.py
│   └── ...                      # 90+ tests
├── client.py                    # Interactive CLI client (uses live API)
├── Mechanic API.postman_collection.json
├── config.py                    # App config
├── requirements.txt             # Python dependencies
├── .github/
│   └── workflows/
│       └── ci.yaml              # GitHub Actions CI/CD pipeline
└── README.md
```

## Repository & Deployment

- **GitHub:** https://github.com/AColyer13/Mechanic-API---Copy-with-Testing-and-Documentation
- **Hosting:** Render (24/7, HTTPS, persistent MySQL)
- **Auto‑deployment:** on push to main

## Authentication

All endpoints marked with **Auth: Yes** require a valid JWT token, which you can obtain by logging in via `POST /customers/login`. Pass the token in the `Authorization: Bearer <token>` header.

## Local Development & Environment Setup

1. Clone the repository and install dependencies from `requirements.txt`.
2. Set up environment variables as needed (e.g., `DATABASE_URL`, `SECRET_KEY`). You can use a `.env` file or set them in your shell.
3. Run database migrations if needed.
4. Start the Flask app.

**Run tests locally:**

```bash
python -m unittest discover tests
```
