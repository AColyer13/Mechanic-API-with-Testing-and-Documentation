# Frontend Integration Guide

This guide shows you how to integrate your frontend application with the Mechanic Shop Firebase API.

## API Base URLs

### Production (Firebase)
```
https://us-central1-mechanicshopapi.cloudfunctions.net/api
```

### Local Development (Emulator)
```
http://localhost:5001/mechanicshopapi/us-central1/api
```

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in your frontend project:

```env
# Production
VITE_API_URL=https://us-central1-mechanicshopapi.cloudfunctions.net/api

# or for Development
VITE_API_URL=http://localhost:5001/mechanicshopapi/us-central1/api
```

### 2. API Service Configuration

Create an API service file (e.g., `src/services/api.js`):

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://us-central1-mechanicshopapi.cloudfunctions.net/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('customer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## API Methods

### Customer Operations

```javascript
// src/services/customerService.js
import api from './api';

export const customerService = {
  // Register new customer
  register: async (customerData) => {
    const response = await api.post('/customers/', customerData);
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/customers/login', { email, password });
    
    // Store token and customer data
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('customer', JSON.stringify(response.data.customer));
    }
    
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('customer');
  },

  // Get all customers (admin view)
  getAll: async () => {
    const response = await api.get('/customers/');
    return response.data;
  },

  // Get customer by ID
  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Get my tickets (authenticated)
  getMyTickets: async () => {
    const response = await api.get('/customers/my-tickets');
    return response.data;
  },

  // Update customer (authenticated)
  update: async (id, updateData) => {
    const response = await api.put(`/customers/${id}`, updateData);
    return response.data;
  },

  // Delete customer (authenticated)
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};
```

### Mechanic Operations

```javascript
// src/services/mechanicService.js
import api from './api';

export const mechanicService = {
  // Create mechanic
  create: async (mechanicData) => {
    const response = await api.post('/mechanics/', mechanicData);
    return response.data;
  },

  // Get all mechanics
  getAll: async () => {
    const response = await api.get('/mechanics/');
    return response.data;
  },

  // Get mechanic by ID
  getById: async (id) => {
    const response = await api.get(`/mechanics/${id}`);
    return response.data;
  },

  // Update mechanic
  update: async (id, updateData) => {
    const response = await api.put(`/mechanics/${id}`, updateData);
    return response.data;
  },

  // Delete mechanic
  delete: async (id) => {
    const response = await api.delete(`/mechanics/${id}`);
    return response.data;
  }
};
```

### Inventory Operations

```javascript
// src/services/inventoryService.js
import api from './api';

export const inventoryService = {
  // Create inventory item
  create: async (itemData) => {
    const response = await api.post('/inventory/', itemData);
    return response.data;
  },

  // Get all inventory
  getAll: async () => {
    const response = await api.get('/inventory/');
    return response.data;
  },

  // Get inventory item by ID
  getById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Update inventory item
  update: async (id, updateData) => {
    const response = await api.put(`/inventory/${id}`, updateData);
    return response.data;
  },

  // Delete inventory item
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  }
};
```

### Service Ticket Operations

```javascript
// src/services/serviceTicketService.js
import api from './api';

export const serviceTicketService = {
  // Create service ticket
  create: async (ticketData) => {
    const response = await api.post('/service-tickets/', ticketData);
    return response.data;
  },

  // Get all service tickets
  getAll: async () => {
    const response = await api.get('/service-tickets/');
    return response.data;
  },

  // Get service ticket by ID
  getById: async (id) => {
    const response = await api.get(`/service-tickets/${id}`);
    return response.data;
  },

  // Update service ticket
  update: async (id, updateData) => {
    const response = await api.put(`/service-tickets/${id}`, updateData);
    return response.data;
  },

  // Delete service ticket
  delete: async (id) => {
    const response = await api.delete(`/service-tickets/${id}`);
    return response.data;
  },

  // Assign mechanic to ticket
  assignMechanic: async (ticketId, mechanicId) => {
    const response = await api.put(
      `/service-tickets/${ticketId}/assign-mechanic/${mechanicId}`
    );
    return response.data;
  },

  // Remove mechanic from ticket
  removeMechanic: async (ticketId, mechanicId) => {
    const response = await api.put(
      `/service-tickets/${ticketId}/remove-mechanic/${mechanicId}`
    );
    return response.data;
  },

  // Add part to ticket
  addPart: async (ticketId, partId) => {
    const response = await api.put(
      `/service-tickets/${ticketId}/add-part/${partId}`
    );
    return response.data;
  },

  // Remove part from ticket
  removePart: async (ticketId, partId) => {
    const response = await api.put(
      `/service-tickets/${ticketId}/remove-part/${partId}`
    );
    return response.data;
  },

  // Add multiple parts to ticket
  addMultipleParts: async (ticketId, inventoryIds) => {
    const response = await api.post(
      `/service-tickets/${ticketId}/parts`,
      { inventory_ids: inventoryIds }
    );
    return response.data;
  },

  // Get tickets by customer
  getByCustomer: async (customerId) => {
    const response = await api.get(`/service-tickets/customer/${customerId}`);
    return response.data;
  },

  // Get tickets by mechanic
  getByMechanic: async (mechanicId) => {
    const response = await api.get(`/service-tickets/mechanic/${mechanicId}`);
    return response.data;
  }
};
```

## React Component Examples

### Login Component

```jsx
// src/components/Login.jsx
import { useState } from 'react';
import { customerService } from '../services/customerService';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await customerService.login(email, password);
      console.log('Login successful:', result);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Customer Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;
```

### Service Tickets List Component

```jsx
// src/components/ServiceTicketsList.jsx
import { useState, useEffect } from 'react';
import { serviceTicketService } from '../services/serviceTicketService';

function ServiceTicketsList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await serviceTicketService.getAll();
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tickets-list">
      <h2>Service Tickets</h2>
      {tickets.length === 0 ? (
        <p>No service tickets found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer ID</th>
              <th>Vehicle</th>
              <th>Description</th>
              <th>Status</th>
              <th>Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.customer_id}</td>
                <td>
                  {ticket.vehicle_year} {ticket.vehicle_make} {ticket.vehicle_model}
                </td>
                <td>{ticket.description}</td>
                <td>
                  <span className={`status-${ticket.status.toLowerCase()}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>${ticket.estimated_cost?.toFixed(2) || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ServiceTicketsList;
```

### Create Service Ticket Component

```jsx
// src/components/CreateServiceTicket.jsx
import { useState, useEffect } from 'react';
import { serviceTicketService } from '../services/serviceTicketService';
import { mechanicService } from '../services/mechanicService';

function CreateServiceTicket({ customerId }) {
  const [formData, setFormData] = useState({
    customer_id: customerId,
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_vin: '',
    description: '',
    estimated_cost: '',
    status: 'Open'
  });
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMechanics();
  }, []);

  const loadMechanics = async () => {
    try {
      const data = await mechanicService.getAll();
      setMechanics(data);
    } catch (err) {
      console.error('Failed to load mechanics:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Convert estimated_cost to number
      const ticketData = {
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
      };

      const result = await serviceTicketService.create(ticketData);
      console.log('Ticket created:', result);
      setSuccess(true);
      
      // Reset form
      setFormData({
        customer_id: customerId,
        vehicle_year: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_vin: '',
        description: '',
        estimated_cost: '',
        status: 'Open'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket">
      <h2>Create Service Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Vehicle Year:</label>
          <input
            type="number"
            name="vehicle_year"
            value={formData.vehicle_year}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Vehicle Make:</label>
          <input
            type="text"
            name="vehicle_make"
            value={formData.vehicle_make}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Vehicle Model:</label>
          <input
            type="text"
            name="vehicle_model"
            value={formData.vehicle_model}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>VIN:</label>
          <input
            type="text"
            name="vehicle_vin"
            value={formData.vehicle_vin}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Description: *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />
        </div>
        <div>
          <label>Estimated Cost:</label>
          <input
            type="number"
            name="estimated_cost"
            value={formData.estimated_cost}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">Service ticket created successfully!</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
}

export default CreateServiceTicket;
```

## Error Handling

Always wrap API calls in try-catch blocks and handle errors appropriately:

```javascript
try {
  const result = await customerService.login(email, password);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.error);
    setError(error.response.data.error);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
    setError('Server is not responding');
  } else {
    // Other errors
    console.error('Error:', error.message);
    setError('An unexpected error occurred');
  }
}
```

## Authentication Flow

1. **Login**: User submits credentials → API returns JWT token
2. **Store Token**: Save token in localStorage
3. **Include Token**: Axios interceptor adds token to all requests
4. **Handle Expiry**: Interceptor catches 401 errors and redirects to login

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)
- `https://acolyer13.github.io` (Your GitHub Pages frontend)
- All localhost variations

## Testing the Integration

### 1. Test API Connection

```javascript
// Test if API is reachable
api.get('/')
  .then(response => console.log('API Response:', response.data))
  .catch(error => console.error('API Error:', error));
```

### 2. Test Authentication

```javascript
// Test login
customerService.login('john.doe@email.com', 'password123')
  .then(response => console.log('Login successful:', response))
  .catch(error => console.error('Login failed:', error));
```

## Next Steps

1. **Install dependencies** in your frontend:
   ```bash
   npm install axios
   ```

2. **Copy the service files** to your frontend project

3. **Update the frontend GitHub repo** to use these new endpoints:
   - Replace old API URLs with Firebase URLs
   - Update authentication flow to use JWT tokens
   - Test all CRUD operations

4. **Deploy**: Once tested locally, deploy your updated frontend to GitHub Pages

## Useful Links

- **Firebase API**: https://us-central1-mechanicshopapi.cloudfunctions.net/api
- **Frontend Repo**: https://github.com/AColyer13/Mechanic-Website
- **API Documentation**: See FIREBASE_TESTING_MIGRATION.md
