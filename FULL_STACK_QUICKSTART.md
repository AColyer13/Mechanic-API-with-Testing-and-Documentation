# Mechanic Shop - Full Stack Quick Start Guide

This guide will help you run both the frontend and backend together.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)

## Running the Full Stack Application

### 1. Start the Backend (Firebase Functions Emulator)

In one terminal:
```bash
cd backend
npm run serve
```

This will start:
- Firebase Functions: `http://localhost:5001`
- Firestore Emulator: `http://localhost:8080`
- API Endpoint: `http://localhost:5001/mechanic-shop-api-functions/us-central1/api`

### 2. Start the Frontend (React + Vite)

In another terminal:
```bash
cd mechanic-shop-frontend
npm run dev
```

This will start the React app at: `http://localhost:5173`

### 3. Access the Application

Open your browser and navigate to: **http://localhost:5173**

## Test Account Credentials

Use these credentials to log in immediately:

- **Email**: `john.doe@email.com`
- **Password**: `password123`

## Application Features

### For Customers

1. **Register/Login**: Create a new account or log in with existing credentials
2. **Dashboard**: View statistics of your service tickets
3. **My Tickets**: See all your service tickets with status filtering
4. **Create Ticket**: Submit a new service request

### Available Pages

- `/` - Home page with feature overview
- `/login` - Customer login
- `/register` - Customer registration
- `/dashboard` - Customer dashboard (requires authentication)
- `/tickets` - View all your tickets (requires authentication)
- `/create-ticket` - Create new service ticket (requires authentication)

## API Endpoints Used by Frontend

The frontend automatically connects to these backend endpoints:

- `POST /customers` - Register new customer
- `POST /customers/login` - Customer authentication
- `GET /customers/my-tickets` - Get authenticated customer's tickets
- `GET /service-tickets/customer/:id` - Get tickets by customer
- `POST /service-tickets` - Create new ticket
- `GET /service-tickets` - Get all tickets
- `PUT /service-tickets/:id` - Update ticket
- `DELETE /service-tickets/:id` - Delete ticket

## Project Structure

```
.
├── backend/                          # Firebase Functions API
│   ├── src/
│   │   ├── routes/                   # API route handlers
│   │   │   ├── customers.js
│   │   │   ├── mechanics.js
│   │   │   ├── inventory.js
│   │   │   └── serviceTickets.js
│   │   ├── models/
│   │   │   └── firestoreHelper.js   # Database abstraction
│   │   └── middleware/
│   │       └── auth.js               # JWT authentication
│   └── test/                         # Integration tests
│
└── mechanic-shop-frontend/           # React frontend
    ├── src/
    │   ├── components/               # Reusable components
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/                  # React Context (Auth)
    │   │   └── AuthContext.jsx
    │   ├── pages/                    # Page components
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Tickets.jsx
    │   │   └── CreateTicket.jsx
    │   ├── services/                 # API service layer
    │   │   └── api.service.js
    │   └── config/                   # Configuration
    │       └── api.js
    └── .env                          # Environment variables
```

## Development Workflow

### Making Changes

1. **Backend Changes**: 
   - Edit files in `backend/src/`
   - Firebase emulator will hot-reload automatically
   - Run tests: `cd backend && npm test`

2. **Frontend Changes**:
   - Edit files in `mechanic-shop-frontend/src/`
   - Vite provides instant hot module replacement (HMR)
   - Changes appear immediately in the browser

### Testing

**Backend Tests** (All 74 tests passing ✅):
```bash
cd backend
npm test
```

**Frontend** (Manual Testing):
1. Open http://localhost:5173
2. Register a new account
3. Log in
4. Create a service ticket
5. View tickets in dashboard and tickets page

## Troubleshooting

### Backend won't start
- Check if ports 5001, 8080, 4000 are available
- Kill existing emulator processes:
  ```powershell
  Get-Process -Name "node" | Where-Object {$_.Path -like "*firebase*"} | Stop-Process -Force
  ```

### Frontend can't connect to API
- Verify backend is running on port 5001
- Check `.env` file has correct API URL
- Check browser console for CORS errors

### Authentication not working
- Clear localStorage in browser DevTools
- Check backend JWT token generation
- Verify customer exists in Firestore emulator

## Environment Variables

### Backend
No environment variables needed for emulator

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001/mechanic-shop-api-functions/us-central1/api
```

## Next Steps

1. **Deploy to Production**:
   ```bash
   cd backend
   firebase deploy --only functions
   ```

2. **Build Frontend for Production**:
   ```bash
   cd mechanic-shop-frontend
   npm run build
   # Deploy the dist/ folder to your hosting provider
   ```

3. **Update Frontend API URL**:
   - Change `VITE_API_URL` in `.env` to your production Firebase Functions URL
   - Example: `https://us-central1-your-project.cloudfunctions.net/api`

## Support

For issues or questions:
- Check the logs in both terminal windows
- Review the browser console for frontend errors
- Check Firebase emulator UI: http://localhost:4000 (if running)

## Technology Stack

**Backend**:
- Node.js 22
- Express.js
- Firebase Functions
- Firestore
- JWT for authentication
- Mocha + Chai for testing

**Frontend**:
- React 18
- Vite 7
- React Router DOM 7
- Axios for API calls
- CSS3 for styling

---

**Status**: ✅ Backend: 74/74 tests passing | ✅ Frontend: Running on port 5173

Enjoy building with Mechanic Shop! 🔧
