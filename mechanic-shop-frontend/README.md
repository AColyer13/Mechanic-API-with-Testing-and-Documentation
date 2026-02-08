# Mechanic Shop Frontend

React + Vite frontend for the Mechanic Shop API.

## Features

- 🔐 Customer authentication (login/register)
- 📊 Dashboard with service ticket statistics
- 🎫 View and manage service tickets
- ✨ Create new service tickets
- 🎨 Modern, responsive UI

## Tech Stack

- React 18
- Vite
- React Router DOM
- Axios
- CSS3

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase Functions emulator running (backend API)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint (optional):
```bash
cp .env.example .env
# Edit .env to set VITE_API_URL if needed
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## API Configuration

The frontend connects to the Firebase Functions API. Default endpoint:
```
http://localhost:5001/mechanic-shop-api-functions/us-central1/api
```

To change the API endpoint, set the `VITE_API_URL` environment variable in `.env`

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── context/         # React Context (Auth)
│   └── AuthContext.jsx
├── pages/           # Page components
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Tickets.jsx
│   └── CreateTicket.jsx
├── services/        # API service layer
│   └── api.service.js
├── config/          # Configuration
│   └── api.js
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

## Available Routes

- `/` - Home page
- `/login` - Customer login
- `/register` - Customer registration
- `/dashboard` - Customer dashboard (protected)
- `/tickets` - View all tickets (protected)
- `/create-ticket` - Create new ticket (protected)

## Authentication

The app uses JWT token-based authentication. Tokens are stored in localStorage and automatically included in API requests.

## Development

### Test Credentials

Use the seeded test account:
- Email: `john.doe@email.com`
- Password: `password123`

### Hot Reload

Vite provides fast hot module replacement (HMR) during development. Changes appear instantly in the browser.

## Troubleshooting

### Cannot connect to API

Make sure the Firebase Functions emulator is running:
```bash
cd ../backend
npm run serve
```

### Port already in use

Change the Vite port in `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3000 // Change to any available port
  }
})
```

## License

ISC
