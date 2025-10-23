# On-Site Presence Feature - Postman Testing Guide

Complete step-by-step guide to test all on-site presence functionality using Postman.

---

## Prerequisites

1. **Authentication Tokens Required:**
   - Client authentication token (for client endpoints)
   - Restaurant authentication token (for restaurant endpoints)

2. **Test Data:**
   - At least one restaurant in the system
   - At least one client account
   - Stripe test keys configured

---

## Testing Flow

### PHASE 1: Restaurant Setup

#### 1.1 Get Current Order Type Settings
**Endpoint:** `GET /private/restaurant/order-type-settings/get`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "settings": [
      {
        "id": 1,
        "orderType": "order-now",
        "isEnabled": true,
        "pricingModel": null,
        ...
      }
    ]
  }
}
```

---

#### 1.2 Enable On-Site Presence with Pricing
**Endpoint:** `POST /private/restaurant/order-type-settings/update`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (Per-Person Pricing):**
```json
{
  "orderType": "on-site-presence",
  "isEnabled": true,
  "pricingModel": "per-person",
  "pricePerPerson": 25.00,
  "minPeople": 10,
  "maxPeople": 100,
  "serviceFeePercentage": 15
}
```

**Body (Per-Hour Pricing):**
```json
{
  "orderType": "on-site-presence",
  "isEnabled": true,
  "pricingModel": "per-hour",
  "pricePerHour": 150.00,
  "minHours": 2,
  "maxHours": 8,
  "serviceFeePercentage": 15
}
```

**Body (Per-Event Pricing):**
```json
{
  "orderType": "on-site-presence",
  "isEnabled": true,
  "pricingModel": "per-event",
  "basePrice": 500.00,
  "serviceFeePercentage": 15
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "orderType": "on-site-presence",
    "isEnabled": true,
    "pricingModel": "per-person",
    ...
  }
}
```

---

#### 1.3 Add Unavailable Dates
**Endpoint:** `POST /private/restaurant/unavailable-dates/add`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "unavailableDate": "2025-11-15",
  "reason": "Private event already booked",
  "isFullDayBlocked": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Unavailable date added successfully",
  "data": {
    "id": 1,
    "unavailableDate": "2025-11-15",
    "reason": "Private event already booked",
    ...
  }
}
```

---

#### 1.4 Get All Unavailable Dates
**Endpoint:** `GET /private/restaurant/unavailable-dates/get`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Optional Query Parameters:**
```
?startDate=2025-10-22&endDate=2025-12-31
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Unavailable dates retrieved successfully",
  "data": {
    "dates": [
      {
        "id": 1,
        "unavailableDate": "2025-11-15",
        "reason": "Private event already booked",
        "isFullDayBlocked": true,
        ...
      }
    ]
  }
}
```

---

### PHASE 2: Client - Browse Restaurants

#### 2.1 Get Restaurants Supporting On-Site Presence
**Endpoint:** `GET /public/restaurant/find/all`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (Filter by Order Type):**
```json
{
  "orderType": "on-site-presence"
}
```

**Body (Filter by Order Type + Event Date):**
```json
{
  "orderType": "on-site-presence",
  "eventDate": "2025-11-20"
}
```

**Body (With Proximity Search):**
```json
{
  "orderType": "on-site-presence",
  "eventDate": "2025-11-20",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radiusInKm": 10
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "id": 1,
        "name": "Test Restaurant",
        "supportedOrderTypes": [
          {
            "orderType": "order-now",
            "pricingModel": null,
            ...
          },
          {
            "orderType": "on-site-presence",
            "pricingModel": "per-person",
            "pricePerPerson": 25.00,
            "pricePerHour": null,
            "basePrice": null
          }
        ],
        "unavailableDates": [
          {
            "date": "2025-11-15",
            "reason": "Private event already booked"
          }
        ],
        ...
      }
    ]
  }
}
```

---

### PHASE 3: Client - Create Order

#### 3.1 Get Price Estimate
**Endpoint:** `POST /private/client/orders/on-site-presence/estimate`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_CLIENT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (Per-Person Pricing):**
```json
{
  "restaurantId": 1,
  "eventDate": "2025-11-20",
  "numberOfPeople": 50,
  "numberOfHours": 4
}
```

**Body (Per-Hour Pricing):**
```json
{
  "restaurantId": 1,
  "eventDate": "2025-11-20",
  "numberOfPeople": 30,
  "numberOfHours": 5
}
```

**Body (Per-Event Pricing):**
```json
{
  "restaurantId": 1,
  "eventDate": "2025-11-20",
  "numberOfPeople": 75,
  "numberOfHours": 6
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Price estimate calculated successfully",
  "data": {
    "restaurantId": 1,
    "pricingModel": "per-person",
    "basePrice": 1250.00,
    "serviceFee": 187.50,
    "totalPrice": 1437.50,
    "breakdown": {
      "numberOfPeople": 50,
      "pricePerPerson": 25.00,
      "subtotal": 1250.00,
      "serviceFeePercentage": 15,
      "serviceFee": 187.50
    }
  }
}
```

---

#### 3.2 Create On-Site Presence Order
**Endpoint:** `POST /private/client/orders/on-site-presence/create`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_CLIENT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (Minimum Required):**
```json
{
  "restaurantId": 1,
  "eventDate": "2025-11-20",
  "numberOfPeople": 50,
  "numberOfHours": 4
}
```

**Body (With All Details):**
```json
{
  "restaurantId": 1,
  "eventDate": "2025-11-20",
  "eventStartTime": "18:00:00",
  "eventEndTime": "22:00:00",
  "numberOfPeople": 50,
  "numberOfHours": 4,
  "specialRequests": "Need vegetarian and vegan options. Setup by 5:30 PM please."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "On-site presence order created successfully",
  "data": {
    "orderId": 123,
    "orderNumber": "ORD-123456",
    "status": "created",
    "orderType": "on-site-presence",
    "estimatedTotalPrice": 1437.50,
    "acceptanceDeadline": "2025-10-23T15:10:00.000Z",
    "paymentIntent": {
      "clientSecret": "pi_xxx_secret_xxx",
      "amount": 143750
    },
    "eventDetails": {
      "eventDate": "2025-11-20",
      "eventStartTime": "18:00:00",
      "eventEndTime": "22:00:00",
      "numberOfPeople": 50,
      "numberOfHours": 4,
      "specialRequests": "Need vegetarian and vegan options..."
    }
  }
}
```

**Note:** Save the `orderId` and `clientSecret` for payment processing.

---

### PHASE 4: Restaurant - Manage Orders

#### 4.1 Get Pending Orders
**Endpoint:** `GET /private/restaurant/orders/on-site-presence/pending/get/all`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderId": 123,
        "orderNumber": "ORD-123456",
        "eventDate": "2025-11-20",
        "eventStartTime": "18:00:00",
        "eventEndTime": "22:00:00",
        "numberOfPeople": 50,
        "numberOfHours": 4,
        "specialRequests": "Need vegetarian and vegan options...",
        "estimatedTotalPrice": 1437.50,
        "estimatedBasePrice": 1250.00,
        "estimatedServiceFee": 187.50,
        "acceptanceDeadline": "2025-10-23T15:10:00.000Z",
        "timeRemainingMinutes": 1320,
        "createdAt": "2025-10-22T15:10:00.000Z",
        "client": {
          "id": 5,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        }
      }
    ],
    "totalPending": 1
  }
}
```

---

#### 4.2 Accept Order
**Endpoint:** `POST /private/restaurant/orders/on-site-presence/accept/by/id`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "orderId": 123
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "orderId": 123,
    "orderNumber": "ORD-123456",
    "status": "processing",
    "acceptedAt": "2025-10-22T16:00:00.000Z"
  }
}
```

---

#### 4.3 Reject Order
**Endpoint:** `POST /private/restaurant/orders/on-site-presence/reject/by/id`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "orderId": 123,
  "rejectionReason": "We are fully booked for that date. Sorry for the inconvenience."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "data": {
    "orderId": 123,
    "orderNumber": "ORD-123456",
    "status": "refunded",
    "rejectedAt": "2025-10-22T16:00:00.000Z",
    "rejectionReason": "We are fully booked for that date...",
    "refundProcessed": true
  }
}
```

---

#### 4.4 Delete Unavailable Date
**Endpoint:** `DELETE /private/restaurant/unavailable-dates/delete/by/id`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_RESTAURANT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "id": 1
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Unavailable date removed successfully"
}
```

---

## Complete Test Scenarios

### Scenario 1: Happy Path (Order Accepted)

1. **Restaurant Setup:**
   - Enable on-site presence with per-person pricing ($25/person)
   - Set min 10, max 100 people
   - Set service fee to 15%

2. **Client Creates Order:**
   - Get estimate for 50 people, 4 hours
   - Verify estimate: $1,250 base + $187.50 service fee = $1,437.50
   - Create order with event date in future
   - Receive payment intent client secret

3. **Restaurant Accepts:**
   - View pending orders
   - Accept the order
   - Verify status changed to "processing"

4. **Verify:**
   - Order status is "processing"
   - Payment is held (not refunded)

---

### Scenario 2: Order Rejected by Restaurant

1. **Client Creates Order:**
   - Create on-site presence order
   - Payment intent created

2. **Restaurant Rejects:**
   - View pending orders
   - Reject with reason: "Already booked for that date"

3. **Verify:**
   - Order status is "refunded"
   - Stripe refund was processed
   - Rejection reason saved

---

### Scenario 3: Date Availability Filtering

1. **Restaurant Setup:**
   - Add unavailable date: 2025-11-15
   - Add unavailable date: 2025-12-25

2. **Client Browses:**
   - Search restaurants with orderType="on-site-presence"
   - Verify `unavailableDates` array includes blocked dates
   - Search with eventDate="2025-11-15"
   - Verify restaurant is excluded from results

3. **Client Attempts Order:**
   - Try to create order for unavailable date
   - Should receive error: "Restaurant is not available on selected date"

---

### Scenario 4: Automatic Rejection (24-Hour Deadline)

1. **Create Order:**
   - Client creates on-site presence order
   - Note the acceptance deadline (24 hours from creation)

2. **Wait for Cron Job:**
   - Cron runs every 5 minutes
   - After deadline passes, cron job auto-rejects

3. **Verify:**
   - Order status is "refunded"
   - Rejection reason: "Restaurant did not respond within 24 hours"
   - Refund processed automatically

**To Test Immediately:**
- Temporarily modify the deadline in OrderOnSitePresenceDetails model
- Change from 24 hours to 1 minute for testing
- Wait for cron to run
- Revert the change after testing

---

### Scenario 5: Different Pricing Models

**Test Per-Person:**
```json
{
  "pricingModel": "per-person",
  "pricePerPerson": 25,
  "numberOfPeople": 50
}
// Expected: $25 × 50 = $1,250 + 15% = $1,437.50
```

**Test Per-Hour:**
```json
{
  "pricingModel": "per-hour",
  "pricePerHour": 150,
  "numberOfHours": 4
}
// Expected: $150 × 4 = $600 + 15% = $690
```

**Test Per-Event:**
```json
{
  "pricingModel": "per-event",
  "basePrice": 500
}
// Expected: $500 + 15% = $575
```

---

### Scenario 6: Validation Errors

**Test Past Event Date:**
```json
{
  "eventDate": "2024-01-01"
}
// Expected Error: "Event date must be in the future"
```

**Test Invalid Number of People:**
```json
{
  "numberOfPeople": 5
}
// Expected Error: "Number of people must be at least 10" (if min is 10)
```

**Test Unavailable Date:**
```json
{
  "eventDate": "2025-11-15"
}
// Expected Error: "Restaurant is not available on selected date"
```

**Test Restaurant Not Supporting On-Site Presence:**
```json
{
  "restaurantId": 999
}
// Expected Error: "Restaurant does not support on-site presence orders"
```

---

## Error Cases to Test

### 1. Restaurant Not Found
```json
{
  "restaurantId": 99999
}
// Expected: 404 "Restaurant not found"
```

### 2. Order Type Not Enabled
- Disable on-site presence for restaurant
- Try to create order
- Expected: "Restaurant does not support on-site presence orders"

### 3. Duplicate Unavailable Date
- Add same date twice
- Expected: "This date is already marked as unavailable"

### 4. Accept Already Accepted Order
- Accept order twice
- Expected: "Order already accepted"

### 5. Reject Already Rejected Order
- Reject order twice
- Expected: "Order already rejected"

### 6. Accept After Deadline
- Wait for deadline to pass
- Try to accept
- Expected: "Acceptance deadline has passed"

### 7. Missing Required Fields
- Try to create order without numberOfPeople
- Expected: "Number of people is required"

---

## Postman Collection Structure

```
On-Site Presence Testing/
├── 1. Restaurant Setup/
│   ├── 1.1 Get Order Type Settings
│   ├── 1.2 Enable On-Site Presence (Per-Person)
│   ├── 1.3 Enable On-Site Presence (Per-Hour)
│   ├── 1.4 Enable On-Site Presence (Per-Event)
│   ├── 1.5 Add Unavailable Date
│   ├── 1.6 Get Unavailable Dates
│   └── 1.7 Delete Unavailable Date
│
├── 2. Client - Browse/
│   ├── 2.1 Get Restaurants (Order Type Filter)
│   ├── 2.2 Get Restaurants (With Event Date)
│   └── 2.3 Get Restaurants (With Proximity)
│
├── 3. Client - Order/
│   ├── 3.1 Get Price Estimate (Per-Person)
│   ├── 3.2 Get Price Estimate (Per-Hour)
│   ├── 3.3 Get Price Estimate (Per-Event)
│   ├── 3.4 Create Order (Minimum)
│   └── 3.5 Create Order (Full Details)
│
├── 4. Restaurant - Manage Orders/
│   ├── 4.1 Get Pending Orders
│   ├── 4.2 Accept Order
│   └── 4.3 Reject Order
│
└── 5. Error Cases/
    ├── 5.1 Past Event Date
    ├── 5.2 Invalid People Count
    ├── 5.3 Unavailable Date
    ├── 5.4 Restaurant Not Found
    ├── 5.5 Duplicate Unavailable Date
    └── 5.6 Accept After Deadline
```

---

## Environment Variables for Postman

```json
{
  "base_url": "http://localhost:3000",
  "client_token": "YOUR_CLIENT_JWT_TOKEN",
  "restaurant_token": "YOUR_RESTAURANT_JWT_TOKEN",
  "test_restaurant_id": 1,
  "test_order_id": 123,
  "future_date": "2025-11-20",
  "unavailable_date_id": 1
}
```

---

## Quick Testing Checklist

- [ ] Restaurant can enable on-site presence
- [ ] Restaurant can set all three pricing models
- [ ] Restaurant can add/delete unavailable dates
- [ ] Client can filter restaurants by order type
- [ ] Client can filter restaurants by event date
- [ ] Unavailable dates appear in restaurant response
- [ ] Client can get accurate price estimates
- [ ] Client can create on-site presence order
- [ ] Payment intent is created correctly
- [ ] Restaurant can view pending orders
- [ ] Restaurant can accept orders
- [ ] Restaurant can reject orders with reason
- [ ] Refunds process on rejection
- [ ] Cron job auto-rejects expired orders
- [ ] Validation errors work correctly
- [ ] Edge cases handled properly

---

## Notes

1. **Authentication:** Make sure to use valid JWT tokens for client and restaurant endpoints

2. **Dates:** Use future dates for event bookings. Format: `YYYY-MM-DD`

3. **Times:** Optional, but if provided use format: `HH:MM:SS` (24-hour)

4. **Stripe:** Ensure Stripe test keys are configured in environment variables

5. **Cron Job:** Runs every 5 minutes automatically. Check server logs for execution

6. **Debugging:** Check server console for detailed error messages and job logs

---

## Expected Response Codes

- `200` - Success
- `404` - Resource not found
- `417` - Validation error / Business logic error
- `500` - Server error

---

Happy Testing! 🚀
