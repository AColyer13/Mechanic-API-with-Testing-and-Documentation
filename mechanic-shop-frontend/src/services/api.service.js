/**
 * API Service
 * Centralized API calls using Axios with Firebase Authentication
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting ID token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - Firebase will handle re-login
      console.warn('Authentication error, user may need to re-login');
    }
    return Promise.reject(error);
  }
);

// Customer API calls
export const customerAPI = {
  register: (data) => api.post('/customers', data),
  // No login endpoint - Firebase Auth handles this
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getMyTickets: () => api.get('/customers/my-tickets'),
  checkEmailExists: (email) => api.get(`/customers/check-email/${email}`),
};

// Mechanic API calls
export const mechanicAPI = {
  getAll: () => api.get('/mechanics'),
  getById: (id) => api.get(`/mechanics/${id}`),
  create: (data) => api.post('/mechanics', data),
  update: (id, data) => api.put(`/mechanics/${id}`, data),
  delete: (id) => api.delete(`/mechanics/${id}`),
};

// Inventory API calls
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// Service Ticket API calls
export const serviceTicketAPI = {
  getAll: () => api.get('/service-tickets'),
  getById: (id) => api.get(`/service-tickets/${id}`),
  create: (data) => api.post('/service-tickets', data),
  update: (id, data) => api.put(`/service-tickets/${id}`, data),
  delete: (id) => api.delete(`/service-tickets/${id}`),
  getByCustomer: (customerId) => api.get(`/service-tickets/customer/${customerId}`),
  getByMechanic: (mechanicId) => api.get(`/service-tickets/mechanic/${mechanicId}`),
  assignMechanic: (ticketId, mechanicId) => api.put(`/service-tickets/${ticketId}/assign-mechanic/${mechanicId}`),
  removeMechanic: (ticketId, mechanicId) => api.put(`/service-tickets/${ticketId}/remove-mechanic/${mechanicId}`),
  addPart: (ticketId, partId) => api.put(`/service-tickets/${ticketId}/add-part/${partId}`),
  removePart: (ticketId, partId) => api.put(`/service-tickets/${ticketId}/remove-part/${partId}`),
};

export default api;
