/**
 * Firestore Helper Functions
 * Provides utility functions for Firestore operations
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configure for emulator if FIRESTORE_EMULATOR_HOST is set
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  db.settings({
    host: `${host}:${port}`,
    ssl: false
  });
  console.log(`🔧 Firestore configured for emulator: ${host}:${port}`);
}

// Simple in-memory cache for customer data (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Collection names
const COLLECTIONS = {
  CUSTOMERS: 'customers',
  MECHANICS: 'mechanics',
  SERVICE_TICKETS: 'serviceTickets',
  INVENTORY: 'inventory'
};

/**
 * Get all documents from a collection
 */
async function getAllDocuments(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single document by ID with optional caching for customers
 */
async function getDocumentById(collectionName, docId, useCache = false) {
  // Check cache for customers
  if (useCache && collectionName === COLLECTIONS.CUSTOMERS) {
    const cacheKey = `${collectionName}:${docId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const doc = await db.collection(collectionName).doc(docId).get();
  if (!doc.exists) {
    return null;
  }
  
  const data = { id: doc.id, ...doc.data() };
  
  // Cache customer data
  if (useCache && collectionName === COLLECTIONS.CUSTOMERS) {
    const cacheKey = `${collectionName}:${docId}`;
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  return data;
}

/**
 * Create a new document
 */
async function createDocument(collectionName, data) {
  const docRef = await db.collection(collectionName).add({
    ...data,
    created_at: admin.firestore.FieldValue?.serverTimestamp() || new Date().toISOString()
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

/**
 * Update a document
 */
async function updateDocument(collectionName, docId, data) {
  await db.collection(collectionName).doc(docId).update(data);
  return getDocumentById(collectionName, docId);
}

/**
 * Delete a document
 */
async function deleteDocument(collectionName, docId) {
  await db.collection(collectionName).doc(docId).delete();
  return true;
}

/**
 * Query documents with filters
 */
async function queryDocuments(collectionName, filters = []) {
  let query = db.collection(collectionName);
  
  filters.forEach(filter => {
    query = query.where(filter.field, filter.operator, filter.value);
  });
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Add item to array field
 */
async function addToArrayField(collectionName, docId, fieldName, value) {
  // Get the document first
  const doc = await getDocumentById(collectionName, docId);
  if (!doc) {
    throw new Error('Document not found');
  }
  
  // Get current array or initialize empty array
  const currentArray = doc[fieldName] || [];
  
  // Check if value already exists (to mimic arrayUnion behavior)
  if (!currentArray.includes(value)) {
    currentArray.push(value);
    
    // Update document with new array
    await db.collection(collectionName).doc(docId).update({
      [fieldName]: currentArray
    });
  }
  
  return getDocumentById(collectionName, docId);
}

/**
 * Remove item from array field
 */
async function removeFromArrayField(collectionName, docId, fieldName, value) {
  // Get the document first
  const doc = await getDocumentById(collectionName, docId);
  if (!doc) {
    throw new Error('Document not found');
  }
  
  // Get current array or initialize empty array
  const currentArray = doc[fieldName] || [];
  
  // Filter out the value (to mimic arrayRemove behavior)
  const newArray = currentArray.filter(item => item !== value);
  
  // Update document with new array
  await db.collection(collectionName).doc(docId).update({
    [fieldName]: newArray
  });
  
  return getDocumentById(collectionName, docId);
}

/**
 * Check if document exists
 */
async function documentExists(collectionName, docId) {
  const doc = await db.collection(collectionName).doc(docId).get();
  return doc.exists;
}

/**
 * Get customer by email
 */
async function getCustomerByEmail(email) {
  const docs = await queryDocuments(COLLECTIONS.CUSTOMERS, [
    { field: 'email', operator: '==', value: email }
  ]);
  return docs.length > 0 ? docs[0] : null;
}

/**
 * Get mechanic by email
 */
async function getMechanicByEmail(email) {
  const docs = await queryDocuments(COLLECTIONS.MECHANICS, [
    { field: 'email', operator: '==', value: email }
  ]);
  return docs.length > 0 ? docs[0] : null;
}

/**
 * Get service tickets for a customer
 */
async function getTicketsByCustomer(customerId) {
  return queryDocuments(COLLECTIONS.SERVICE_TICKETS, [
    { field: 'customer_id', operator: '==', value: customerId }
  ]);
}

/**
 * Get service tickets assigned to a mechanic
 */
async function getTicketsByMechanic(mechanicId) {
  return queryDocuments(COLLECTIONS.SERVICE_TICKETS, [
    { field: 'mechanic_ids', operator: 'array-contains', value: mechanicId }
  ]);
}

module.exports = {
  db,
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  addToArrayField,
  removeFromArrayField,
  documentExists,
  getCustomerByEmail,
  getMechanicByEmail,
  getTicketsByCustomer,
  getTicketsByMechanic
};
