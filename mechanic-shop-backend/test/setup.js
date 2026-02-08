/**
 * Test setup for Firebase Emulator testing
 */

const admin = require('firebase-admin');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

// Emulator configuration
const EMULATOR_CONFIG = {
  projectId: 'mechanicshopapi',
  firestoreHost: 'localhost',
  firestorePort: 8080,
  functionsHost: 'localhost',
  functionsPort: 5001
};

// Base URL for API testing
const BASE_URL = `http://${EMULATOR_CONFIG.functionsHost}:${EMULATOR_CONFIG.functionsPort}/mechanicshopapi/us-central1/api`;

let testEnv;
let db;

/**
 * Initialize Firebase Admin SDK for emulator
 */
function initializeAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: EMULATOR_CONFIG.projectId
    });
  }

  // Set Firestore emulator host
  process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_CONFIG.firestoreHost}:${EMULATOR_CONFIG.firestorePort}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${EMULATOR_CONFIG.firestoreHost}:9099`;

  db = admin.firestore();
  return db;
}

/**
 * Clear all Firestore data
 */
async function clearFirestore() {
  if (!db) {
    db = initializeAdmin();
  }

  const collections = ['customers', 'mechanics', 'inventory', 'serviceTickets'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

/**
 * Setup before all tests
 */
async function setupTests() {
  initializeAdmin();
  await clearFirestore();
}

/**
 * Teardown after all tests
 */
async function teardownTests() {
  await clearFirestore();
  if (admin.apps.length) {
    await Promise.all(admin.apps.map(app => app.delete()));
  }
}

/**
 * Clear data after each test
 */
async function afterEachTest() {
  await clearFirestore();
}

module.exports = {
  EMULATOR_CONFIG,
  BASE_URL,
  initializeAdmin,
  clearFirestore,
  setupTests,
  teardownTests,
  afterEachTest,
  getDb: () => db || initializeAdmin()
};
