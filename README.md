# Mechanic Shop API

A full‑featured **RESTful API** for managing a mechanic shop, built with **Flask** using the Application Factory pattern.

Supports complete CRUD for **Customers**, **Mechanics**, **Service Tickets**, and **Inventory Parts**, with JWT authentication, rate limiting, caching, and 90+ automated tests.

### Live Links
- **Backend API**: https://mechanic-api-copy-with-testing-and.onrender.com
- **Frontend Web App**: https://acolyer13.github.io/Mechanic-Website/
- **Interactive Docs (Swagger UI)**: https://mechanic-api-copy-with-testing-and.onrender.com/api/docs

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
| GET    | `/service-tickets/`                               | List all                        |
| GET    | `/service-tickets/<id>`                           | Get one                         |
| PUT    | `/service-tickets/<id>`                           | Update                          |
| DELETE | `/service-tickets/<id>`                           | Delete                          |
| PUT    | `/service-tickets/<id>/assign-mechanic/<mid>`     | Assign mechanic                 |
| PUT    | `/service-tickets/<id>/remove-mechanic/<mid>`     | Remove mechanic                 |
| PUT    | `/service-tickets/<id>/add-part/<pid>`            | Add part                        |
| GET    | `/service-tickets/mechanic/<mid>`                 | Mechanic's tickets              |

---

## Example cURL Commands (Live API)

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
| Framework     | Flask 3.0 + Application Factory             |
| Database      | MySQL + SQLAlchemy + Flask‑Migrate          |
| Auth          | JWT (python‑jose) + bcrypt                  |
| Validation    | Marshmallow                                 |
| Rate Limiting | Flask‑Limiter                               |
| Caching       | Flask‑Caching (5‑min TTL)                   |
| Testing       | unittest (90+ tests)                        |
| Documentation | Flask‑Rebar → Swagger UI                    |
| Deployment    | Render (auto‑deploy from main)              |
| CI/CD         | GitHub Actions (build → test → deploy)      |

## Testing & CI/CD

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
