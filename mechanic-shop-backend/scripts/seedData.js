/**
 * Seed Data Script for Firestore
 * Populates the database with sample data for development/testing
 * 
 * Usage:
 * - For production: firebase deploy --only functions,firestore (then run this)
 * - For local: Start emulators, then run: node scripts/seedData.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if running against emulator
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('🔧 Using Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
    admin.initializeApp({ projectId: 'mechanicshopapi' });
  } else {
    console.log('☁️  Using Production Firestore');
    admin.initializeApp();
  }
}

const db = admin.firestore();

// Sample data
const SAMPLE_DATA = {
  customers: [
    {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      password: 'password123', // Will be hashed
      phone: '555-0101',
      address: '123 Main St, Springfield, IL 62701'
    },
    {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      password: 'password456',
      phone: '555-0102',
      address: '456 Oak Ave, Springfield, IL 62702'
    },
    {
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@email.com',
      password: 'password789',
      phone: '555-0103',
      address: '789 Pine Rd, Springfield, IL 62703'
    }
  ],
  
  mechanics: [
    {
      first_name: 'Mike',
      last_name: 'Wilson',
      email: 'mike.wilson@mechanicshop.com',
      phone: '555-1001',
      specialty: 'Engine Repair',
      hourly_rate: 85.00,
      hire_date: new Date('2020-01-15')
    },
    {
      first_name: 'Sarah',
      last_name: 'Martinez',
      email: 'sarah.martinez@mechanicshop.com',
      phone: '555-1002',
      specialty: 'Transmission',
      hourly_rate: 95.00,
      hire_date: new Date('2019-06-01')
    },
    {
      first_name: 'Tom',
      last_name: 'Anderson',
      email: 'tom.anderson@mechanicshop.com',
      phone: '555-1003',
      specialty: 'Electrical Systems',
      hourly_rate: 90.00,
      hire_date: new Date('2021-03-10')
    },
    {
      first_name: 'Lisa',
      last_name: 'Chen',
      email: 'lisa.chen@mechanicshop.com',
      phone: '555-1004',
      specialty: 'Brake Systems',
      hourly_rate: 80.00,
      hire_date: new Date('2022-01-20')
    }
  ],
  
  inventory: [
    { name: 'Oil Filter', price: 12.99 },
    { name: 'Air Filter', price: 15.99 },
    { name: 'Spark Plugs (Set of 4)', price: 24.99 },
    { name: 'Brake Pads (Front)', price: 89.99 },
    { name: 'Brake Pads (Rear)', price: 79.99 },
    { name: 'Wiper Blades (Pair)', price: 19.99 },
    { name: 'Engine Oil (5qt)', price: 29.99 },
    { name: 'Transmission Fluid', price: 34.99 },
    { name: 'Coolant', price: 18.99 },
    { name: 'Battery', price: 129.99 },
    { name: 'Serpentine Belt', price: 39.99 },
    { name: 'Timing Belt', price: 149.99 }
  ]
};

/**
 * Clear all collections
 */
async function clearCollections() {
  console.log('🗑️  Clearing existing data...');
  
  const collections = ['customers', 'mechanics', 'inventory', 'serviceTickets'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`   ✓ Cleared ${collection}`);
  }
}

/**
 * Seed customers
 */
async function seedCustomers() {
  console.log('\n👥 Seeding customers...');
  const customerIds = [];
  
  for (const customer of SAMPLE_DATA.customers) {
    const hashedPassword = await bcrypt.hash(customer.password, 10);
    const docRef = await db.collection('customers').add({
      ...customer,
      password: hashedPassword,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    customerIds.push(docRef.id);
    console.log(`   ✓ Created customer: ${customer.first_name} ${customer.last_name} (${docRef.id})`);
  }
  
  return customerIds;
}

/**
 * Seed mechanics
 */
async function seedMechanics() {
  console.log('\n🔧 Seeding mechanics...');
  const mechanicIds = [];
  
  for (const mechanic of SAMPLE_DATA.mechanics) {
    const docRef = await db.collection('mechanics').add({
      ...mechanic,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    mechanicIds.push(docRef.id);
    console.log(`   ✓ Created mechanic: ${mechanic.first_name} ${mechanic.last_name} (${docRef.id})`);
  }
  
  return mechanicIds;
}

/**
 * Seed inventory
 */
async function seedInventory() {
  console.log('\n📦 Seeding inventory...');
  const inventoryIds = [];
  
  for (const item of SAMPLE_DATA.inventory) {
    const docRef = await db.collection('inventory').add({
      ...item,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    inventoryIds.push(docRef.id);
    console.log(`   ✓ Created inventory: ${item.name} ($${item.price})`);
  }
  
  return inventoryIds;
}

/**
 * Seed service tickets
 */
async function seedServiceTickets(customerIds, mechanicIds, inventoryIds) {
  console.log('\n🎫 Seeding service tickets...');
  
  const tickets = [
    {
      customer_id: customerIds[0],
      vehicle_year: 2020,
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      vehicle_vin: '1HGBH41JXMN109186',
      description: 'Oil change and tire rotation needed',
      estimated_cost: 89.99,
      actual_cost: null,
      status: 'Open',
      mechanic_ids: [mechanicIds[0]],
      inventory_ids: [inventoryIds[0], inventoryIds[6]] // Oil Filter + Engine Oil
    },
    {
      customer_id: customerIds[0],
      vehicle_year: 2020,
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      vehicle_vin: '1HGBH41JXMN109186',
      description: 'Brake inspection - customer reports squeaking noise',
      estimated_cost: 250.00,
      actual_cost: null,
      status: 'In Progress',
      mechanic_ids: [mechanicIds[3]],
      inventory_ids: [inventoryIds[3]] // Brake Pads Front
    },
    {
      customer_id: customerIds[1],
      vehicle_year: 2018,
      vehicle_make: 'Honda',
      vehicle_model: 'Accord',
      vehicle_vin: '1HGCV1F30JA123456',
      description: 'Check engine light on - needs diagnostic',
      estimated_cost: 150.00,
      actual_cost: 142.50,
      status: 'Completed',
      mechanic_ids: [mechanicIds[0], mechanicIds[2]],
      inventory_ids: [inventoryIds[2]], // Spark Plugs
      completed_at: new Date('2024-01-15T14:30:00Z')
    },
    {
      customer_id: customerIds[1],
      vehicle_year: 2018,
      vehicle_make: 'Honda',
      vehicle_model: 'Accord',
      vehicle_vin: '1HGCV1F30JA123456',
      description: 'Transmission fluid change',
      estimated_cost: 180.00,
      actual_cost: null,
      status: 'Open',
      mechanic_ids: [mechanicIds[1]],
      inventory_ids: [inventoryIds[7]] // Transmission Fluid
    },
    {
      customer_id: customerIds[2],
      vehicle_year: 2022,
      vehicle_make: 'Ford',
      vehicle_model: 'F-150',
      vehicle_vin: '1FTFW1E50MFA12345',
      description: 'Battery replacement - won\'t start in cold weather',
      estimated_cost: 200.00,
      actual_cost: 189.99,
      status: 'Completed',
      mechanic_ids: [mechanicIds[2]],
      inventory_ids: [inventoryIds[9]], // Battery
      completed_at: new Date('2024-01-20T10:15:00Z')
    }
  ];
  
  for (const ticket of tickets) {
    const docRef = await db.collection('serviceTickets').add({
      ...ticket,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`   ✓ Created ticket: ${ticket.description.substring(0, 50)}... (${docRef.id})`);
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('=' .repeat(60));
    
    // Clear existing data
    await clearCollections();
    
    // Seed data in order
    const customerIds = await seedCustomers();
    const mechanicIds = await seedMechanics();
    const inventoryIds = await seedInventory();
    await seedServiceTickets(customerIds, mechanicIds, inventoryIds);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`   • ${SAMPLE_DATA.customers.length} customers`);
    console.log(`   • ${SAMPLE_DATA.mechanics.length} mechanics`);
    console.log(`   • ${SAMPLE_DATA.inventory.length} inventory items`);
    console.log(`   • 5 service tickets\n`);
    
    console.log('Test Credentials:');
    console.log('   Email: john.doe@email.com');
    console.log('   Password: password123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, clearCollections };
