# Quick Start: Populating Firestore Database

This guide shows you how to quickly populate your Firestore database with sample data.

## 🚀 Quick Start

### Option 1: Seed Local Emulator (Recommended for Development)

1. **Start Firebase Emulators**:
   ```bash
   cd backend
   npm run serve
   ```
   Wait for: `✔  All emulators ready!`

2. **In another terminal, seed the database**:
   ```bash
   cd backend
   npm run seed:emulator
   ```

3. **View the data**:
   - Open Firestore Emulator UI: http://localhost:4000

### Option 2: Seed Production Database

⚠️ **Warning**: This will clear all existing data in production!

1. **Make sure you're logged into Firebase**:
   ```bash
   firebase login
   ```

2. **Seed production database**:
   ```bash
   cd backend
   npm run seed
   ```

## 📊 What Gets Added

The seed script populates your database with:

### Customers (3)
- **John Doe** - `john.doe@email.com` / `password123`
- **Jane Smith** - `jane.smith@email.com` / `password456`
- **Bob Johnson** - `bob.johnson@email.com` / `password789`

### Mechanics (4)
- **Mike Wilson** - Engine Repair specialist ($85/hr)
- **Sarah Martinez** - Transmission specialist ($95/hr)
- **Tom Anderson** - Electrical Systems specialist ($90/hr)
- **Lisa Chen** - Brake Systems specialist ($80/hr)

### Inventory (12 parts)
- Oil Filter, Air Filter, Spark Plugs
- Brake Pads (Front & Rear)
- Wiper Blades, Engine Oil, Transmission Fluid
- Coolant, Battery, Serpentine Belt, Timing Belt

### Service Tickets (5)
- Various realistic service scenarios
- Mix of Open, In Progress, and Completed statuses
- With assigned mechanics and parts

## 🧪 Test the Data

### Test Login
```bash
# Using curl
curl -X POST http://localhost:5001/mechanicshopapi/us-central1/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@email.com","password":"password123"}'
```

### View All Customers
```bash
curl http://localhost:5001/mechanicshopapi/us-central1/api/customers/
```

### View Service Tickets
```bash
curl http://localhost:5001/mechanicshopapi/us-central1/api/service-tickets/
```

## 🔄 Re-seeding

To clear and re-seed:

```bash
cd backend
npm run seed:emulator
```

The script automatically:
1. ✅ Clears all existing data
2. ✅ Creates fresh sample data
3. ✅ Outputs summary

## 📝 Sample Data Details

### Test Credentials
```
Email: john.doe@email.com
Password: password123
```

Use these credentials to:
- Test customer login
- Test protected endpoints
- Test "my tickets" functionality

### Service Ticket Scenarios

1. **Open Ticket**: Oil change for John's 2020 Toyota Camry
2. **In Progress**: Brake inspection with squeaking noise
3. **Completed**: Check engine light diagnostic (resolved)
4. **Open**: Transmission fluid change for Honda Accord
5. **Completed**: Battery replacement for Ford F-150

## 🐛 Troubleshooting

### Error: "FIRESTORE_EMULATOR_HOST not set"
**Solution**: Make sure emulators are running first:
```bash
npm run serve
```

### Error: "Permission denied"
**For production**: Make sure you're logged in and have permission:
```bash
firebase login
```

### Data not showing up in Emulator UI
**Solution**: Refresh the Emulator UI page at http://localhost:4000

### Want to add more data?
Edit `backend/scripts/seedData.js` and add to the `SAMPLE_DATA` object.

## 🎯 Next Steps

After seeding:

1. **Test the API endpoints** using Postman or curl
2. **Connect your frontend** using the credentials above
3. **Verify data** in Firestore Emulator UI (http://localhost:4000)
4. **Run tests** to validate everything works: `npm test`

## 📚 Related Documentation

- [Frontend Integration Guide](FRONTEND_INTEGRATION.md)
- [Firebase Testing Guide](FIREBASE_TESTING_MIGRATION.md)
- [API Documentation](README.md)
