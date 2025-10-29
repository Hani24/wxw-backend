# Catering Feature - Postman Testing Guide

**Date:** October 29, 2025
**Purpose:** Complete end-to-end testing guide for catering feature
**Includes:** Guest user flows, registered user flows, restaurant management

---

## 📋 Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Phase 1: Restaurant Setup](#phase-1-restaurant-setup)
3. [Phase 2: Guest User Flow](#phase-2-guest-user-flow)
4. [Phase 3: Registered User Flow](#phase-3-registered-user-flow)
5. [Phase 4: Restaurant Order Management](#phase-4-restaurant-order-management)
6. [Phase 5: Payment Confirmation](#phase-5-payment-confirmation)
7. [Troubleshooting](#troubleshooting)

---

## Setup & Prerequisites

### Environment Setup
```
Base URL: http://localhost:3000
or
Base URL: https://your-api-domain.com
```

### Required Postman Environment Variables
Create a Postman environment with these variables:
```
BASE_URL          = http://localhost:3000
RESTAURANT_TOKEN  = (will be set after restaurant login)
CLIENT_TOKEN      = (will be set after client login)
GUEST_TOKEN       = (will be set after guest init)
RESTAURANT_ID     = (will be set after restaurant creation)
MENU_ITEM_ID      = (will be set after menu item creation)
CATERING_ITEM_ID  = (will be set after catering item creation)
ORDER_ID          = (will be set after order creation)
```

### Test Data Preparation
1. Have at least one restaurant account created
2. Have at least one menu item created for that restaurant
3. Have a test payment card or use Stripe test cards

---

## Phase 1: Restaurant Setup

### 1.1 Restaurant Login
**Endpoint:** `POST /public/restaurant/login`

**Request:**
```json
{
  "phone": "+1234567890",
  "password": "your_password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 10,
      "role": "restaurant_manager",
      // ...
    }
  }
}
```

**Postman Test Script:**
```javascript
// Save token for subsequent requests
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("RESTAURANT_TOKEN", response.data.token);
    pm.environment.set("RESTAURANT_ID", response.data.restaurant.id);
}
```

---

### 1.2 Get Restaurant Menu Items
**Endpoint:** `GET /private/restaurant/menu-items/get/all`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Party Platter",
      "price": 250.00,
      "description": "Large platter for events",
      // ...
    }
  ]
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.length > 0) {
        pm.environment.set("MENU_ITEM_ID", response.data[0].id);
    }
}
```

---

### 1.3 Enable Catering for Restaurant
**Endpoint:** `POST /private/restaurant/order-type-settings/update`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "orderType": "catering",
  "isEnabled": true,
  "pricingModel": "per-item",
  "serviceFeePercentage": 15
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 5,
    "orderType": "catering",
    "isEnabled": true,
    "serviceFeePercentage": 15
  }
}
```

---

### 1.4 Add Menu Item to Catering
**Endpoint:** `POST /private/restaurant/catering-menu-items/add`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "menuItemId": {{MENU_ITEM_ID}},
  "feedsPeople": 10,
  "minimumQuantity": 1,
  "leadTimeDays": 3,
  "cateringPrice": null,
  "isAvailableForCatering": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 1,
    "menuItemId": 123,
    "feedsPeople": 10,
    "minimumQuantity": 1,
    "leadTimeDays": 3,
    "cateringPrice": null,
    "isAvailableForCatering": true,
    "MenuItem": {
      "id": 123,
      "name": "Party Platter",
      "price": 250.00
    }
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("CATERING_ITEM_ID", response.data.id);
}
```

---

### 1.5 Get All Catering Menu Items
**Endpoint:** `GET /private/restaurant/catering-menu-items/get`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menuItemId": 123,
      "feedsPeople": 10,
      "minimumQuantity": 1,
      "leadTimeDays": 3,
      "menuItem": {
        "id": 123,
        "name": "Party Platter",
        "price": 250.00,
        "category": {
          "id": 5,
          "name": "Appetizers"
        }
      },
      "effectivePrice": 250.00
    }
  ]
}
```

---

### 1.6 Set Unavailable Dates (Optional)
**Endpoint:** `POST /private/restaurant/unavailable-dates/add`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "unavailableDate": "2025-12-25",
  "reason": "Christmas Day - Restaurant Closed",
  "isFullDayBlocked": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 10,
    "restaurantId": 1,
    "unavailableDate": "2025-12-25",
    "reason": "Christmas Day - Restaurant Closed"
  }
}
```

---

## Phase 2: Guest User Flow

### 2.1 Initialize Guest Session
**Endpoint:** `POST /public/guest/init`

**Request:**
```json
{
  "deviceId": "test-device-123",
  "timezone": "America/New_York"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Guest session created",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "guestToken": "guest_abc123...",
    "expiresAt": "2025-10-30T10:30:00Z",
    "userId": 501,
    "clientId": 401
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("GUEST_TOKEN", response.data.token);
    pm.environment.set("GUEST_USER_ID", response.data.userId);
    pm.environment.set("GUEST_CLIENT_ID", response.data.clientId);
}
```

---

### 2.2 Browse Restaurant Catering Info (Public)
**Endpoint:** `GET /public/restaurant/catering/info/get/by/id`

**Request Body:**
```json
{
  "id": {{RESTAURANT_ID}}
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "restaurant": {
      "id": 1,
      "name": "Test Restaurant",
      "description": "Great food for events",
      "image": "https://...",
      "rating": 4.5,
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001"
      }
    },
    "cateringSettings": {
      "isEnabled": true,
      "minimumLeadTimeDays": 10,
      "serviceFeePercentage": 15,
      "pricingModel": "per-item"
    },
    "deliveryOptions": ["pickup", "drop-off"],
    "unavailableDates": [
      {
        "date": "2025-12-25",
        "reason": "Christmas Day - Restaurant Closed"
      }
    ],
    "menuCategories": [
      {
        "categoryId": 5,
        "categoryName": "Appetizers",
        "items": [
          {
            "cateringMenuItemId": 1,
            "menuItemId": 123,
            "name": "Party Platter",
            "description": "Large platter for events",
            "image": "https://...",
            "price": 250.00,
            "feedsPeople": 10,
            "minimumQuantity": 1,
            "leadTimeDays": 3,
            "nutritionalInfo": {
              "kcal": 500,
              "proteins": 20,
              "fats": 15,
              "carbs": 45
            }
          }
        ]
      }
    ],
    "totalItems": 1
  }
}
```

---

### 2.3 Estimate Catering Order (Guest)
**Endpoint:** `POST /private/client/orders/catering/estimate`

**Headers:**
```
Authorization: Bearer {{GUEST_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-15",
  "deliveryMethod": "drop-off",
  "items": [
    {
      "menuItemId": {{MENU_ITEM_ID}},
      "quantity": 3
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "restaurantId": 1,
    "restaurantName": "Test Restaurant",
    "eventDate": "2025-12-15",
    "deliveryMethod": "drop-off",
    "estimatedTotalPeople": 30,
    "items": [
      {
        "menuItemId": 123,
        "cateringMenuItemId": 1,
        "name": "Party Platter",
        "quantity": 3,
        "pricePerItem": 250.00,
        "subtotal": 750.00,
        "feedsPeople": 10,
        "totalPeopleServed": 30
      }
    ],
    "pricing": {
      "basePrice": 750.00,
      "serviceFee": 112.50,
      "serviceFeePercentage": 15,
      "totalPrice": 862.50
    },
    "paymentSchedule": {
      "firstPayment": {
        "amount": 431.25,
        "percentage": 50,
        "dueDate": "2025-12-05",
        "description": "10 days before event - Non-refundable"
      },
      "secondPayment": {
        "amount": 431.25,
        "percentage": 50,
        "dueDate": "2025-12-12",
        "description": "3 days before event - Non-refundable"
      }
    }
  }
}
```

**Validation Tests:**
- ✅ Total people calculation is correct (3 × 10 = 30)
- ✅ Service fee is 15% of base price
- ✅ Payment split is exactly 50/50
- ✅ First payment date is 10 days before event
- ✅ Second payment date is 3 days before event

---

### 2.4 Create Catering Order (Guest)
**Endpoint:** `POST /private/client/orders/catering/create`

**Headers:**
```
Authorization: Bearer {{GUEST_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-15",
  "eventStartTime": "18:00",
  "eventEndTime": "22:00",
  "deliveryMethod": "drop-off",
  "deliveryAddress": "456 Event Ave, New York, NY 10002",
  "deliveryLatitude": 40.7128,
  "deliveryLongitude": -74.0060,
  "specialRequests": "Please include vegetarian options. Setup at 5:30 PM.",
  "items": [
    {
      "menuItemId": {{MENU_ITEM_ID}},
      "quantity": 3
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Catering order created successfully",
  "data": {
    "id": 10000000001,
    "status": "created",
    "orderType": "catering",
    "order": {
      "id": 10000000001,
      "orderNumber": "ORD-1234567890",
      "clientId": 401,
      "status": "created",
      "orderType": "catering",
      "totalPrice": 750.00,
      "finalPrice": 862.50,
      "totalItems": 1,
      "discountAmount": 0,
      "createdAt": "2025-10-29T10:30:00Z"
    },
    "cateringDetails": {
      "eventDate": "2025-12-15",
      "eventStartTime": "18:00",
      "eventEndTime": "22:00",
      "deliveryMethod": "drop-off",
      "deliveryAddress": "456 Event Ave, New York, NY 10002",
      "estimatedTotalPeople": 30,
      "specialRequests": "Please include vegetarian options. Setup at 5:30 PM.",
      "estimatedBasePrice": 750.00,
      "estimatedServiceFee": 112.50,
      "estimatedTotalPrice": 862.50,
      "paymentSchedule": {
        "firstPayment": {
          "amount": 431.25,
          "dueDate": "2025-12-05",
          "description": "50% - 10 days before event (Non-refundable)"
        },
        "secondPayment": {
          "amount": 431.25,
          "dueDate": "2025-12-12",
          "description": "50% - 3 days before event (Non-refundable)"
        }
      },
      "acceptanceDeadline": "2025-10-30T10:30:00Z"
    }
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("ORDER_ID", response.data.id);

    // Validation tests
    pm.test("Order created with correct status", function() {
        pm.expect(response.data.status).to.equal("created");
    });

    pm.test("Order type is catering", function() {
        pm.expect(response.data.orderType).to.equal("catering");
    });

    pm.test("Payment schedule is correct", function() {
        const schedule = response.data.cateringDetails.paymentSchedule;
        const total = schedule.firstPayment.amount + schedule.secondPayment.amount;
        pm.expect(total).to.equal(response.data.cateringDetails.estimatedTotalPrice);
    });
}
```

---

### 2.5 Confirm Catering Order (Guest - First Payment)
**Endpoint:** `POST /private/client/orders/confirm`

**Headers:**
```
Authorization: Bearer {{GUEST_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "id": {{ORDER_ID}}
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order created, please confirm Card payment",
  "data": {
    "clientSecret": "pi_xxx_secret_yyy",
    "paymentIntentId": "pi_xxxxxxxxxxxxx",
    "id": 10000000001,
    "status": "created",
    "order": {
      "id": 10000000001,
      "finalPrice": 862.50,
      "cateringDetails": {
        "eventDate": "2025-12-15",
        "deliveryMethod": "drop-off",
        "paymentSchedule": {
          "firstPayment": {
            "amount": 431.25,
            "dueDate": "2025-12-05",
            "paidAt": null
          },
          "secondPayment": {
            "amount": 431.25,
            "dueDate": "2025-12-12",
            "paidAt": null
          }
        }
      }
    }
  }
}
```

**Important Notes:**
- ✅ Payment intent created for **FIRST payment only** (50%)
- ✅ Amount charged: $431.25 (not full $862.50)
- ✅ Second payment will be charged automatically 3 days before event
- ✅ Guest user can complete payment without registering

---

## Phase 3: Registered User Flow

### 3.1 Client Login
**Endpoint:** `POST /public/client/login`

**Request:**
```json
{
  "phone": "+1234567891",
  "password": "client_password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 20,
      "role": "client",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("CLIENT_TOKEN", response.data.token);
}
```

---

### 3.2 Browse Restaurant Catering (Registered)
**Endpoint:** `GET /public/restaurant/catering/info/get/by/id`

**Request Body:**
```json
{
  "id": {{RESTAURANT_ID}}
}
```

**Note:** Same response as guest user (Phase 2.2)

---

### 3.3 Estimate Catering Order (Registered)
**Endpoint:** `POST /private/client/orders/catering/estimate`

**Headers:**
```
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-20",
  "deliveryMethod": "pickup",
  "items": [
    {
      "menuItemId": {{MENU_ITEM_ID}},
      "quantity": 5
    }
  ]
}
```

**Expected Response:** Similar to Phase 2.3 but with different quantities

---

### 3.4 Create Catering Order (Registered)
**Endpoint:** `POST /private/client/orders/catering/create`

**Headers:**
```
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json
```

**Request (Pickup Example):**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-20",
  "eventStartTime": "14:00",
  "eventEndTime": "18:00",
  "deliveryMethod": "pickup",
  "specialRequests": "Need extra plates and utensils",
  "items": [
    {
      "menuItemId": {{MENU_ITEM_ID}},
      "quantity": 5
    }
  ]
}
```

**Expected Response:** Similar to Phase 2.4

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("ORDER_ID_REGISTERED", response.data.id);
}
```

---

### 3.5 Confirm Order (Registered User)
**Endpoint:** `POST /private/client/orders/confirm`

**Headers:**
```
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "id": {{ORDER_ID_REGISTERED}}
}
```

**Expected Response:** Similar to Phase 2.5

---

## Phase 4: Restaurant Order Management

### 4.1 Get Pending Catering Orders
**Endpoint:** `GET /private/restaurant/orders/on-site-presence/pending/get/all`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderId": 10000000001,
        "orderNumber": "ORD-1234567890",
        "orderType": "catering",
        "eventDate": "2025-12-15",
        "eventStartTime": "18:00",
        "eventEndTime": "22:00",
        "deliveryMethod": "drop-off",
        "deliveryAddress": "456 Event Ave, New York, NY 10002",
        "estimatedTotalPeople": 30,
        "specialRequests": "Please include vegetarian options. Setup at 5:30 PM.",
        "estimatedTotalPrice": 862.50,
        "estimatedBasePrice": 750.00,
        "estimatedServiceFee": 112.50,
        "paymentSchedule": {
          "firstPayment": {
            "amount": 431.25,
            "dueDate": "2025-12-05",
            "paidAt": null
          },
          "secondPayment": {
            "amount": 431.25,
            "dueDate": "2025-12-12",
            "paidAt": null
          }
        },
        "acceptanceDeadline": "2025-10-30T10:30:00Z",
        "timeRemainingMinutes": 1380,
        "createdAt": "2025-10-29T10:30:00Z",
        "client": {
          "id": 401,
          "userId": 501
        },
        "user": {
          "id": 501,
          "firstName": "Guest",
          "lastName": "User",
          "email": "guest_501@temporary.com",
          "phone": "guest_1730197800_abc123"
        }
      }
    ],
    "totalPending": 1
  }
}
```

**Validation Tests:**
- ✅ Shows both on-site-presence and catering orders
- ✅ Sorted by acceptance deadline (most urgent first)
- ✅ Includes payment schedule for catering orders
- ✅ Shows time remaining in minutes

---

### 4.2 Accept Catering Order
**Endpoint:** `POST /private/restaurant/orders/on-site-presence/accept/by/id`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "orderId": {{ORDER_ID}}
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "orderId": 10000000001,
    "orderNumber": "ORD-1234567890",
    "status": "processing",
    "acceptedAt": "2025-10-29T11:00:00Z"
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();

    pm.test("Order status changed to processing", function() {
        pm.expect(response.data.status).to.equal("processing");
    });

    pm.test("Accepted timestamp is set", function() {
        pm.expect(response.data.acceptedAt).to.not.be.null;
    });
}
```

---

### 4.3 Reject Catering Order
**Endpoint:** `POST /private/restaurant/orders/on-site-presence/reject/by/id`

**Headers:**
```
Authorization: Bearer {{RESTAURANT_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "orderId": {{ORDER_ID}},
  "reason": "Sorry, we are fully booked for that date. Please consider another date or time."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "data": {
    "orderId": 10000000001,
    "orderNumber": "ORD-1234567890",
    "status": "refunded",
    "rejectedAt": "2025-10-29T11:00:00Z",
    "rejectionReason": "Sorry, we are fully booked for that date.",
    "refundProcessed": true
  }
}
```

**Note:** Order status will be "refunded" if payment was already made

---

## Phase 5: Payment Confirmation

### 5.1 Verify First Payment
After confirming the order, verify the payment details:

**Endpoint:** `GET /private/client/orders/get/by/id`

**Headers:**
```
Authorization: Bearer {{CLIENT_TOKEN}} or {{GUEST_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "id": {{ORDER_ID}}
}
```

**Check in Response:**
- ✅ `order.isPaid` should be `true` (if auto-payment succeeded)
- ✅ `order.paymentIntentId` should have Stripe payment intent ID
- ✅ `cateringDetails.firstPaymentPaidAt` should have timestamp
- ✅ `cateringDetails.secondPaymentPaidAt` should be `null` (not yet paid)

---

## Edge Case Testing

### Test 1: Lead Time Validation
**Endpoint:** `POST /private/client/orders/catering/estimate`

**Request with event too soon:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-11-02",
  "deliveryMethod": "pickup",
  "items": [{"menuItemId": {{MENU_ITEM_ID}}, "quantity": 1}]
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Catering orders require at least 10 days advance notice"
}
```

---

### Test 2: Minimum Quantity Validation
**If minimum quantity is 2:**

**Request:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-15",
  "deliveryMethod": "pickup",
  "items": [{"menuItemId": {{MENU_ITEM_ID}}, "quantity": 1}]
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Party Platter: Minimum quantity for this item is 2"
}
```

---

### Test 3: Unavailable Date
**Request with blocked date:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-25",
  "deliveryMethod": "pickup",
  "items": [{"menuItemId": {{MENU_ITEM_ID}}, "quantity": 3}]
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Date is not available for catering"
}
```

---

### Test 4: Duplicate Pending Order
**Try creating second order while first is pending:**

**Expected Response:**
```json
{
  "success": false,
  "message": "You already have a pending catering order for this restaurant. Please wait for the restaurant to respond."
}
```

---

### Test 5: Deadline Expiry
**Try accepting order after 24 hours:**

**Expected Response:**
```json
{
  "success": false,
  "message": "Acceptance deadline has passed"
}
```

---

### Test 6: Drop-off Without Address
**Request:**
```json
{
  "restaurantId": {{RESTAURANT_ID}},
  "eventDate": "2025-12-15",
  "deliveryMethod": "drop-off",
  "items": [{"menuItemId": {{MENU_ITEM_ID}}, "quantity": 3}]
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Delivery address is required for drop-off"
}
```

---

## Guest User Conversion Test

### Convert Guest to Registered User
**Endpoint:** `POST /public/guest/checkout/complete`

**Headers:**
```
Authorization: Bearer {{GUEST_TOKEN}}
Content-Type: application/json
```

**Request:**
```json
{
  "guestToken": "{{GUEST_TOKEN}}",
  "orderId": {{ORDER_ID}},
  "guestInfo": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "phone": "+1234567892",
    "address": {
      "street": "789 Main St",
      "city": "New York",
      "stateId": 1,
      "zip": "10003",
      "lat": 40.7128,
      "lon": -74.0060
    }
  },
  "createAccount": true,
  "password": "securepassword123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "new_regular_user_token...",
    "user": {
      "id": 501,
      "isGuest": false,
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "phone": "+1234567892"
    }
  }
}
```

---

## Troubleshooting

### Issue: "Restaurant does not offer catering"
**Solution:** Run Phase 1.3 to enable catering for the restaurant

### Issue: "Menu item not available for catering"
**Solution:** Run Phase 1.4 to add the menu item to catering

### Issue: "Payment card is required"
**Solution:** Add a default payment card to the client account first

### Issue: "Guest session expired"
**Solution:** Re-run Phase 2.1 to create a new guest session

### Issue: "Acceptance deadline has passed"
**Solution:** Create a new order (restaurant has 24 hours to respond)

### Issue: "Order not found"
**Solution:** Verify the ORDER_ID environment variable is set correctly

---

## Test Checklist

### Restaurant Setup ✅
- [ ] Restaurant login successful
- [ ] Catering enabled for restaurant
- [ ] Menu items added to catering
- [ ] Catering menu items retrieved successfully
- [ ] Unavailable dates set (optional)

### Guest User Flow ✅
- [ ] Guest session initialized
- [ ] Restaurant catering info browsed
- [ ] Price estimated correctly
- [ ] Order created successfully
- [ ] Payment confirmed (first 50%)
- [ ] Guest can convert to registered user

### Registered User Flow ✅
- [ ] Client login successful
- [ ] Can browse catering menu
- [ ] Can estimate prices
- [ ] Can create orders
- [ ] Can confirm payment

### Restaurant Management ✅
- [ ] Pending orders retrieved
- [ ] Orders sorted by urgency
- [ ] Can accept orders
- [ ] Can reject orders with reason
- [ ] Refund processed on rejection

### Edge Cases ✅
- [ ] Lead time validation works
- [ ] Minimum quantity validation works
- [ ] Unavailable date validation works
- [ ] Duplicate order prevention works
- [ ] Deadline expiry handled
- [ ] Drop-off requires address

### Payment Verification ✅
- [ ] First payment (50%) charged
- [ ] Payment intent ID stored
- [ ] Second payment not charged yet
- [ ] Payment schedule correct

---

## Success Metrics

**Complete Test Pass Criteria:**
1. ✅ Restaurant can set up catering menu (5 endpoints)
2. ✅ Guest users can place catering orders
3. ✅ Registered users can place catering orders
4. ✅ Payment split works (50% charged, 50% pending)
5. ✅ Restaurant can accept/reject orders
6. ✅ All edge cases handled correctly
7. ✅ Guest conversion works properly
8. ✅ Response formats are consistent

---

## Test Execution Time

**Estimated Time:** 30-45 minutes for complete test suite
- Phase 1: 10 minutes (Restaurant setup)
- Phase 2: 10 minutes (Guest flow)
- Phase 3: 5 minutes (Registered user flow)
- Phase 4: 5 minutes (Restaurant management)
- Phase 5: 5 minutes (Payment verification)
- Edge Cases: 5-10 minutes

---

**Happy Testing! 🎉**

If you encounter any issues not covered in this guide, please document them and report to the development team.
