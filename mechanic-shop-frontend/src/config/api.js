/**
 * API Configuration
 * Central configuration for API endpoints
 */

// Use environment variable or default to local emulator
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/mechanic-shop-api-functions/us-central1/api';

export const API_ENDPOINTS = {
  // Customer endpoints
  CUSTOMERS: '/customers',
  CUSTOMER_LOGIN: '/customers/login',
  CUSTOMER_TICKETS: '/customers/my-tickets',
  
  // Mechanic endpoints
  MECHANICS: '/mechanics',
  
  // Inventory endpoints
  INVENTORY: '/inventory',
  
  // Service Ticket endpoints
  SERVICE_TICKETS: '/service-tickets',
  SERVICE_TICKETS_CUSTOMER: (customerId) => `/service-tickets/customer/${customerId}`,
  SERVICE_TICKETS_MECHANIC: (mechanicId) => `/service-tickets/mechanic/${mechanicId}`,
  ASSIGN_MECHANIC: (ticketId, mechanicId) => `/service-tickets/${ticketId}/assign-mechanic/${mechanicId}`,
  REMOVE_MECHANIC: (ticketId, mechanicId) => `/service-tickets/${ticketId}/remove-mechanic/${mechanicId}`,
  ADD_PART: (ticketId, partId) => `/service-tickets/${ticketId}/add-part/${partId}`,
  REMOVE_PART: (ticketId, partId) => `/service-tickets/${ticketId}/remove-part/${partId}`,
};
