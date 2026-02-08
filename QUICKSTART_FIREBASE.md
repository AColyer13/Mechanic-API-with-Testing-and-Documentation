# 🚀 Quick Start - Deploy Your Firebase API

## ✅ What's Been Completed

Your complete Flask API has been migrated to Firebase Cloud Functions:
- ✅ All customer endpoints (with JWT auth)
- ✅ All mechanic endpoints
- ✅ All inventory endpoints  
- ✅ All service ticket endpoints (with relationships)
- ✅ Firebase project structure created
- ✅ Dependencies installed

---

## 📋 Before You Deploy

### 1. Create Firebase Project

**Go to**: https://console.firebase.google.com/

1. Click **"Add project"**
2. Enter name: `mechanic-shop-api` (or your preferred name)
3. Disable Google Analytics (optional)
4. Click **"Create project"**
5. **Copy your Project ID** (you'll need this!)

### 2. Enable Firestore Database

1. In Firebase Console → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select region: **`us-central1`** (or your preferred region)
5. Click **"Enable"**

### 3. Update Project Configuration

Edit `.firebaserc` in your root directory:
```json
{
  "projects": {
    "default": "YOUR-ACTUAL-PROJECT-ID-HERE"
  }
}
```

Replace `YOUR-ACTUAL-PROJECT-ID-HERE` with your actual Firebase Project ID from step 1.

---

## 🚀 Deploy to Firebase

### Login to Firebase

```powershell
firebase login
```

This will open your browser to authenticate.

### Deploy Functions and Firestore Rules

```powershell
firebase deploy --only functions,firestore
```

This will:
- Upload your Cloud Functions
- Set Firestore security rules
- Create indexes

**Deployment takes ~3-5 minutes** for first deploy.

---

## 🎉 Your API is Live!

After deployment completes, your API will be available at:

```
https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api
```

### Test Your API

**1. Check API is Running:**
```powershell
curl https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api
```

**2. Create a Customer:**
```powershell
curl -X POST https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api/customers `
  -H "Content-Type: application/json" `
  -d '{"first_name":"John","last_name":"Doe","email":"john@example.com","password":"password123","phone":"555-1234"}'
```

**3. Login:**
```powershell
curl -X POST https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api/customers/login `
  -H "Content-Type: application/json" `
  -d '{"email":"john@example.com","password":"password123"}'
```

You'll receive a JWT token in the response!

---

## 🔧 Local Testing (Optional)

Test locally before deploying:

```powershell
cd functions
npm run serve
```

Your API will run at:
```
http://localhost:5001/YOUR-PROJECT-ID/us-central1/api
```

---

## 📱 Update Your Frontend

Change your base URL from:
```
https://mechanic-api-copy-with-testing-and.onrender.com
```

To:
```
https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/api
```

**Important:** Replace `YOUR-PROJECT-ID` with your actual Firebase Project ID!

---

## 🔒 Production Security (Recommended)

### Set JWT Secret

Currently using default secret. For production, set a custom one:

```powershell
firebase functions:config:set jwt.secret="your-super-secret-key-123456"
```

Then update `functions/src/middleware/auth.js` line 10 to:
```javascript
const JWT_SECRET = functions.config().jwt.secret || process.env.JWT_SECRET || 'dev-secret-key';
```

Redeploy after changing:
```powershell
firebase deploy --only functions
```

---

## 💰 Cost Estimate

### Firebase Free Tier (Spark Plan)
- **2M function invocations/month** - FREE
- **50K Firestore reads/day** - FREE
- **20K Firestore writes/day** - FREE
- **10GB network egress/month** - FREE

### Estimated Usage for Your API
- 10,000 API calls/month = ~10K invocations
- Basic CRUD operations = ~20K reads, ~5K writes
- **Total monthly cost: $0** (well within free tier!)

**No database expiration, no forced shutdowns** ✅

---

## 🆘 Troubleshooting

### "Project Not Found" Error
- Double-check your Project ID in `.firebaserc`
- Make sure you're logged in: `firebase login`

### "Permission Denied" Errors
- Verify Firestore rules deployed: `firebase deploy --only firestore`
- Check Firebase Console → Firestore → Rules tab

### Functions Take Long to Deploy
- First deployment is slow (~5 min)
- Subsequent deploys are faster (~1-2 min)

### API Returns 404
- Verify functions deployed successfully
- Check full URL includes `/api` at the end
- View logs: `firebase functions:log`

---

## 📊 Monitor Your API

### View Logs
```powershell
firebase functions:log
```

### Firebase Console
Go to: https://console.firebase.google.com/
- **Functions** → See invocation count, errors
- **Firestore** → View your data in real-time
- **Usage** → Monitor quota usage

---

## ✅ Next Steps

1. **Deploy now** using the commands above
2. **Test all endpoints** using Postman (update base URL)
3. **Update your frontend** with new Firebase URL
4. **Monitor usage** in Firebase Console
5. **Celebrate!** 🎉 You're now running serverless!

---

## 🔥 You're Ready to Deploy!

Run these three commands:

```powershell
# 1. Login
firebase login

# 2. Update .firebaserc with your project ID

# 3. Deploy!
firebase deploy --only functions,firestore
```

**That's it!** Your API will be live in ~5 minutes.

Questions? Check `functions/README.md` for detailed documentation.
