# Unified Authentication Guide

This guide explains the **unified authentication system** that supports multiple token types through a single `Authorization` header.

---

## 🎯 Overview

The authentication system now automatically detects and handles **three types of tokens**:

1. **JWT Token** (Regular authenticated users)
2. **Guest Token** (Guest/anonymous users)
3. **Firebase ID Token** (During signup/login)

All three can be sent via the standard `Authorization: Bearer <token>` header!

---

## 🔐 Token Types

### 1. JWT Token (Backend-Issued)

**When**: After successful authentication
**Format**: JWT (JSON Web Token)
**Contains**: `{userId, sessionId, token, role}`
**Example**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywic2Vzc2lvbklkIjo0NTYsInRva2VuIjoiYWJjMTIzIiwicm9sZSI6ImNsaWVudCJ9.xyz...
```

**Usage**:
```javascript
// After login/signup, store the token
const { token } = response.data;
localStorage.setItem('authToken', token);

// Use for all authenticated requests
fetch('/private/client/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
```

---

### 2. Guest Token (Guest Sessions)

**When**: For anonymous/guest users
**Format**: Plain string (32-character random token)
**Contains**: Just the token string
**Example**:
```
Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Usage**:
```javascript
// Initialize guest session
const response = await fetch('/public/guest/init', {
  method: 'POST',
  body: JSON.stringify({ deviceId: 'optional' })
});

const { guestToken } = response.data;
localStorage.setItem('guestToken', guestToken);

// Use for guest requests
fetch('/private/client/cart/set/amount/by/menu-item/id', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('guestToken')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ menuItemId: 1, amount: 2 })
});
```

---

### 3. Firebase ID Token (Authentication Only)

**When**: Only during signup/login
**Format**: Firebase JWT (signed by Google)
**Contains**: Firebase user data
**Example**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMjEzMGZlZjAyNTg3Zm...
```

**Usage**:
```javascript
// Get Firebase ID token
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const firebaseIdToken = await userCredential.user.getIdToken();

// Exchange for backend JWT
const response = await fetch('/public/services/firebase/auth/by/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,  // Firebase token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'client' })
});

// Now use the backend JWT for all future requests
const { token } = response.data;
localStorage.setItem('authToken', token);
```

---

## 📊 Complete Authentication Flows

### Flow 1: Email/Phone Signup → Login

```javascript
// STEP 1: Firebase Authentication
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const firebaseToken = await userCredential.user.getIdToken();

// STEP 2: Backend Authentication (Exchange Firebase token for Backend JWT)
const authResponse = await fetch('/public/services/firebase/auth/by/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,  // ← Firebase ID Token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'client' })
});

const { token, isNewUser } = authResponse.data;
localStorage.setItem('authToken', token);  // ← Backend JWT Token

// STEP 3: Complete Profile (if new user)
if (isNewUser) {
  await fetch('/private/client/profile/update', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,  // ← Backend JWT Token
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      birthday: '1990-01-01'
    })
  });
}

// STEP 4: Use backend JWT for all future requests
fetch('/private/client/orders/history', {
  headers: {
    'Authorization': `Bearer ${token}`  // ← Backend JWT Token
  }
});
```

---

### Flow 2: Guest User → Convert to Account

```javascript
// STEP 1: Initialize Guest Session
const guestResponse = await fetch('/public/guest/init', {
  method: 'POST',
  body: JSON.stringify({ deviceId: 'device123' })
});

const { guestToken } = guestResponse.data;
localStorage.setItem('guestToken', guestToken);

// STEP 2: Browse and Add to Cart (as guest)
await fetch('/private/client/cart/set/amount/by/menu-item/id', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${guestToken}`,  // ← Guest Token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ menuItemId: 1, amount: 2 })
});

// STEP 3: Create Order (as guest)
const orderResponse = await fetch('/private/client/orders/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${guestToken}`,  // ← Guest Token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* order data */ })
});

const { orderId } = orderResponse.data;

// STEP 4: Complete Checkout (convert to account)
const checkoutResponse = await fetch('/public/guest/checkout/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guestToken: guestToken,
    orderId: orderId,
    guestInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: { street: '123 Main St', city: 'NYC', stateId: 1, zip: '10001' }
    },
    createAccount: true,
    password: 'password123'
  })
});

const { sessionToken } = checkoutResponse.data;
localStorage.removeItem('guestToken');
localStorage.setItem('authToken', sessionToken);  // ← Backend JWT Token

// Now user is authenticated with regular account
```

---

## 🔄 Token Detection Logic

The backend automatically detects token type:

```javascript
// Backend logic (automatic)
const header = req.getHeader('authorization');
const token = header.split(' ').pop();  // Extract Bearer token

// Try 1: Decode as JWT (regular user)
const jwt = await JWT.decode(token);
if (jwt && jwt.userId) {
  // Regular authenticated user
  req.user = await User.getById(jwt.userId);
  req.session = await Session.getById(jwt.sessionId);
  return next();
}

// Try 2: Look up as Guest Token
const guestSession = await GuestSession.getByToken(token);
if (guestSession) {
  // Guest user
  req.user = guestSession.User;
  req.client = guestSession.Client;
  req.isGuest = true;
  return next();
}

// Try 3: Validate as Firebase Token (only for /firebase/auth/by/token endpoint)
const firebaseResult = await firebase.verifyIdToken(token);
if (firebaseResult.success) {
  // Create/find user and return backend JWT
}
```

---

## 🆚 Old vs New Approach

### ❌ OLD: Multiple Header Types (DEPRECATED - No Longer Supported)

```javascript
// Regular user
fetch('/private/client/profile', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

// Guest user (REMOVED - Don't use!)
fetch('/private/client/cart', {
  headers: {
    'X-Guest-Token': guestToken  // ❌ NO LONGER WORKS
  }
});

// OR
fetch('/private/client/cart?guestToken=' + guestToken);  // ❌ NO LONGER WORKS
```

### ✅ NEW: Unified Bearer Token (Current Standard)

```javascript
// Regular user
fetch('/private/client/profile', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

// Guest user (same pattern!)
fetch('/private/client/cart', {
  headers: {
    'Authorization': `Bearer ${guestToken}`  // ✅ Use this!
  }
});
```

---

## 🔧 Important: Legacy Methods Removed

**The old authentication methods have been removed:**

❌ ~~Custom header: `X-Guest-Token`~~
❌ ~~Query parameter: `?guestToken=`~~

**Only the standard Bearer token is now supported:**

✅ **Use this:** `Authorization: Bearer <token>`

---

## 📋 Implementation Checklist

### Frontend

- [ ] Store tokens in localStorage/sessionStorage
- [ ] Use `Authorization: Bearer <token>` for all requests
- [x] ~~Remove custom `X-Guest-Token` header~~ ✅ Removed from backend
- [x] ~~Remove query param `?guestToken=`~~ ✅ Removed from backend
- [ ] Handle token expiration and refresh

### Backend

- [x] Passport middleware detects JWT tokens
- [x] Passport middleware detects guest tokens (from Bearer)
- [x] ~~Access middleware handles legacy custom headers~~ ✅ Removed
- [x] Firebase auth endpoint validates Firebase ID tokens
- [x] All endpoints work with unified approach

---

## 🎯 Best Practices

### 1. Use a Single Auth Function

```javascript
// auth.js
export function getAuthHeaders() {
  // Check for regular token first
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    return { 'Authorization': `Bearer ${authToken}` };
  }

  // Fallback to guest token
  const guestToken = localStorage.getItem('guestToken');
  if (guestToken) {
    return { 'Authorization': `Bearer ${guestToken}` };
  }

  return {};
}

// Usage everywhere
fetch('/private/client/cart', {
  headers: {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  }
});
```

### 2. Clear Token on Logout

```javascript
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('guestToken');
  window.location.href = '/login';
}
```

### 3. Handle Token Expiration

```javascript
async function apiCall(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid
    logout();
    throw new Error('Authentication required');
  }

  return response.json();
}
```

---

## 🧪 Testing

### Test Regular User Authentication

```bash
# Get backend JWT token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET https://localhost:20123/private/client/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Test Guest User Authentication

```bash
# Get guest token
GUEST_TOKEN="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

curl -X POST https://localhost:20123/private/client/cart/set/amount/by/menu-item/id \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"menuItemId": 1, "amount": 2}'
```

### Test Firebase Authentication

```bash
# Get Firebase ID token from client
FIREBASE_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6..."

curl -X POST https://localhost:20123/public/services/firebase/auth/by/token \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "client"}'
```

---

## ✅ Summary

**Key Benefits:**
- ✅ Single, standard `Authorization` header for all token types
- ✅ Automatic token type detection
- ✅ Backward compatible with existing implementations
- ✅ RESTful and follows industry standards
- ✅ Simpler frontend code
- ✅ Better developer experience

**Migration:**
- Old approach still works (no breaking changes)
- Gradually migrate to unified Bearer token approach
- Remove custom headers at your convenience

---

**Last Updated:** October 17, 2025
