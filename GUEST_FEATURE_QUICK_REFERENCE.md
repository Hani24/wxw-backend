# Guest Feature - Quick Reference Card

**Version:** 2.0.0 (JWT Implementation) | **Updated:** October 21, 2025

## 🚀 Quick Start

### Manual Deployment
```bash
npx sequelize-cli db:migrate
pm2 restart wxw-backend
```

---

## 🔌 API Endpoints

### 1. Initialize Guest ⭐ NEW: Returns JWT Token
```bash
POST /public/guest/init
Body: {"deviceId": "optional"}
Returns: {
  token: "JWT_TOKEN",           # ← USE THIS for Auth header
  guestToken: "xxx",            # Backup token
  expiresAt, userId, clientId
}
```

### 2. Validate Token
```bash
POST /public/guest/validate
Body: {"guestToken": "xxx"}
Returns: {valid, expiresAt, userId, clientId, isConverted}
```

### 3. Complete Checkout ⭐ Phone/Email Optional
```bash
POST /public/guest/checkout/complete
Body: {
  guestToken, orderId,
  guestInfo: {
    firstName, lastName,        # REQUIRED
    phone, email,              # OPTIONAL
    address: {...}             # REQUIRED
  },
  createAccount (optional), password (optional)
}
```

---

## 💻 Frontend Usage

### Initialize Guest (Updated)
```javascript
const response = await fetch('/public/guest/init', {
  method: 'POST',
  body: JSON.stringify({deviceId: 'xxx'})
}).then(r => r.json());

// ⭐ NEW: Store JWT token (not guestToken)
localStorage.setItem('authToken', response.data.token);
localStorage.setItem('guestToken', response.data.guestToken); // Backup
```

### Use JWT Token ⭐ UPDATED
```javascript
// Use JWT token in Authorization header
headers: {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
}
```

### Complete Checkout (Updated)
```javascript
await fetch('/public/guest/checkout/complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  },
  body: JSON.stringify({
    guestToken: localStorage.getItem('guestToken'), // Still needed
    orderId: 123,
    guestInfo: {
      firstName: 'John',      // REQUIRED
      lastName: 'Doe',        // REQUIRED
      phone: '+1234...',      // OPTIONAL ⭐
      email: 'john@...',      // OPTIONAL ⭐
      address: {
        street, city, stateId, zip, lat, lon
      }
    },
    createAccount: true,  // optional
    password: 'xxx'       // if createAccount
  })
});
```

---

## 🔐 Security Limits

| Limit | Value | Enforced In |
|-------|-------|-------------|
| Max Orders | 5 | Middleware |
| Session Expiry | 24 hours | Database |
| Token Length | 32 chars | Model |

### Blocked Endpoints for Guests
- `/private/client/payment/*`
- `/private/client/favorite/*`
- `/private/client/courier/create`

---

## 🗄️ Database Schema

### Users Table
```sql
isGuest BOOLEAN DEFAULT false
guestToken VARCHAR(64) DEFAULT NULL
guestExpiresAt DATETIME DEFAULT NULL
```

### GuestSessions Table
```sql
id, guestToken, userId, clientId,
deviceId, ip, expiresAt,
isConverted, isDeleted
```

---

## 🧹 Cleanup Job

**Schedule:** Daily at 3:00 AM
**Job Name:** `dev.guest-sessions.cleanup-expired`

**Action:**
- Delete expired sessions (no active orders)
- Extend sessions (with active orders)
- Clean cart items

**Enable Debug:**
```javascript
// In cron-job.config.js
'dev.guest-sessions.cleanup-expired': {
  debug: true
}
```

---

## 📊 Monitoring Queries

### Guest Conversion Rate (Last 30 Days)
```sql
SELECT
  COUNT(CASE WHEN isConverted = 1 THEN 1 END) as converted,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN isConverted = 1 THEN 1 END) / COUNT(*) * 100, 2) as rate
FROM GuestSessions
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Active Guest Sessions
```sql
SELECT COUNT(*) FROM GuestSessions
WHERE isDeleted = 0
  AND isConverted = 0
  AND expiresAt > NOW();
```

### Guest Orders Today
```sql
SELECT COUNT(*) FROM Orders o
JOIN Clients c ON c.id = o.clientId
JOIN Users u ON u.id = c.userId
WHERE u.isGuest = 1
  AND DATE(o.createdAt) = CURDATE();
```

---

## 🧪 Testing Commands

### Test Init
```bash
curl -X POST http://localhost:3000/public/guest/init \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test"}'
```

### Test Cart (with token)
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:3000/private/client/cart/set/amount/by/menu-item/id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"menuItemId": 1, "amount": 2}'
```

### Test Order Limit
```bash
# Should fail on 6th request
for i in {1..6}; do
  curl -X POST http://localhost:3000/private/client/orders/create \
    -H "Authorization: Bearer $TOKEN"
done
```

---

## 🐛 Quick Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid/expired token | Get new token |
| 403 Order limit | 5 orders reached | Create account |
| 403 Feature blocked | Sensitive endpoint | Create account |
| 404 Session not found | Expired/deleted | Get new token |

### Check Logs
```bash
pm2 logs wxw-backend | grep -i guest
```

### Verify Database
```sql
-- Check if migrations ran
SELECT * FROM Users LIMIT 1;  -- Should have isGuest column
SHOW TABLES LIKE 'GuestSessions';  -- Should exist
```

---

## 📁 Key Files

```
Database:
  ├─ migrations/20210510000201.0-add-guest-fields-to-[Users]-table.js
  └─ migrations/20210510000202.0-create-[GuestSessions]-table.js

Models:
  ├─ models/GuestSession.model.js
  └─ models/User.model.js (modified)

Routes:
  ├─ routes/public/guest/init/index.js
  ├─ routes/public/guest/validate/index.js
  └─ routes/public/guest/checkout/complete/index.js

Middleware:
  └─ middlewares/middlewares/02.access.middleware.js (modified)

Cron:
  ├─ cron/jobs/dev.guest-sessions.cleanup-expired.job.js
  └─ cron/jobs/cron-job.config.js (modified)

Docs:
  ├─ GUEST_USER_IMPLEMENTATION.md (full guide)
  ├─ GUEST_FEATURE_SUMMARY.md (overview)
  ├─ GUEST_FEATURE_QUICK_REFERENCE.md (this file)
  └─ GUEST_FEATURE_DEPLOYMENT.sh (deploy script)
```

---

## 🔄 Complete Flow Diagram

```
User Action          →  Frontend Call                →  Backend Response
─────────────────────────────────────────────────────────────────────────
Click "Guest"        →  POST /guest/init             →  guestToken
Browse              →  GET /restaurant/find/all     →  restaurants
Add to Cart         →  POST /cart/set (+ token)     →  cart updated
Create Order        →  POST /orders/create (+ token)→  orderId
Enter Details       →  POST /guest/checkout/complete→  order confirmed
[Optional] Account  →  (createAccount: true)        →  sessionToken
```

---

## ⚙️ Configuration

### Adjust Order Limit
```javascript
// In 02.access.middleware.js, line ~141
if (guestOrderCount >= 5) {  // Change 5 to desired limit
```

### Adjust Session Expiry
```javascript
// In GuestSession.model.js, line ~90
.add(24, 'hours')  // Change 24 to desired hours
```

### Adjust Cleanup Schedule
```javascript
// In dev.guest-sessions.cleanup-expired.job.js, line ~19
{ at: 3, type: 'hours' }  // Change 3 to desired hour (0-23)
```

---

## 💡 Pro Tips

1. **Always use header for token** (more secure than query param)
2. **Store token in localStorage** (persists across page reloads)
3. **Check expiration before requests** (avoid 401 errors)
4. **Prompt account creation** (at checkout for better UX)
5. **Monitor conversion rate** (optimize prompt timing)

---

## 📚 Full Documentation

For complete details, see:
- **[GUEST_USER_IMPLEMENTATION.MD](./GUEST_USER_IMPLEMENTATION.md)** - Technical deep-dive
- **[GUEST_FEATURE_SUMMARY.MD](./GUEST_FEATURE_SUMMARY.md)** - Executive summary

---

**Last Updated:** October 21, 2025
**Version:** 2.0.0

---

## 📝 Changelog

### v2.0.0 (October 21, 2025) - JWT Implementation
**Breaking Changes:**
- ✅ Guest init now returns JWT `token` (use this instead of plain `guestToken`)
- ✅ Authorization header must use JWT token
- ✅ Phone and email are now OPTIONAL at checkout

**New Features:**
- ✅ JWT authentication for guests (more secure)
- ✅ Stripe customer auto-created for guest payments
- ✅ Session tracking for analytics
- ✅ Cart returns `isEstimated` flag for delivery price
- ✅ Better error handling and validation

**Bug Fixes:**
- ✅ Fixed cart delivery estimation for guests without address
- ✅ Fixed phone/email duplicate validation
- ✅ Fixed foreign key constraint errors
- ✅ Removed duplicate client check that blocked guests

**Migration Notes:**
- Backward compatible - old plain tokens still work
- Frontend should migrate to use JWT tokens
- Store both `token` (JWT) and `guestToken` (backup)

### v1.0.0 (October 16, 2025) - Initial Release
- Initial guest user implementation
- Basic token authentication
- Guest checkout flow
- Order limits and restrictions
