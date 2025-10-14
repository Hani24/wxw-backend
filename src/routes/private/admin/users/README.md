# Admin Users Endpoints

API endpoints for managing all users across all roles (root, admin, restaurant, employee, courier, client).

## Endpoints

### 1. Get All Users

```
GET /private/admin/users/get/all
```

Retrieve all users with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `offset` | number | 0 | Pagination offset |
| `limit` | number | 15 | Number of results per page |
| `order` | string | desc | Sort order: `asc` or `desc` |
| `by` | string | firstName | Sort field: `id`, `firstName`, `lastName`, `email`, `phone`, `role`, `createdAt` |
| `role` | string | - | Filter by role: `root`, `admin`, `restaurant`, `employee`, `courier`, `client` |
| `isEmailVerified` | boolean | - | Filter by email verification status |
| `isPhoneVerified` | boolean | - | Filter by phone verification status |
| `isRestricted` | boolean | - | Filter by restricted status |
| `search` | string | - | Search by firstName, lastName, email, or phone |

**Example Requests:**

```bash
# Get all users (default pagination)
GET /private/admin/users/get/all

# Get first 50 users sorted by creation date
GET /private/admin/users/get/all?limit=50&by=createdAt&order=desc

# Get only admin users
GET /private/admin/users/get/all?role=admin

# Get only verified clients
GET /private/admin/users/get/all?role=client&isEmailVerified=true&isPhoneVerified=true

# Search for users by name or email
GET /private/admin/users/get/all?search=john

# Get restricted users
GET /private/admin/users/get/all?isRestricted=true
```

**Response:**

```json
{
  "success": true,
  "message": "success",
  "data": {
    "count": 100,
    "rows": [
      {
        "id": 1,
        "email": "admin@wxwdelivery.com",
        "phone": "+11234567891",
        "firstName": "Admin",
        "lastName": "User",
        "fullName": "Admin User",
        "role": "admin",
        "gender": "male",
        "image": "https://...",
        "lang": "en",
        "birthday": null,
        "street": null,
        "zip": null,
        "cityId": null,
        "restaurantId": null,
        "isEmailVerified": true,
        "isPhoneVerified": true,
        "isRestricted": false,
        "isNewUser": false,
        "lat": 0,
        "lon": 0,
        "createdAt": "2024-10-14T...",
        "updatedAt": "2024-10-14T...",
        "lastSeenAt": "2024-10-14T...",
        "City": null,
        "Restaurant": null,
        "clientData": null,
        "courierData": null
      }
    ]
  }
}
```

### 2. Get User by ID

```
GET /private/admin/users/get/by/id?id=<number>
```

Retrieve a specific user by their ID with role-specific data.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | User ID (required) |

**Example Requests:**

```bash
# Get user with ID 1
GET /private/admin/users/get/by/id?id=1

# Get user with ID 42
GET /private/admin/users/get/by/id?id=42
```

**Response:**

```json
{
  "success": true,
  "message": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@wxwdelivery.com",
      "phone": "+11234567891",
      "firstName": "Admin",
      "lastName": "User",
      "fullName": "Admin User",
      "role": "admin",
      "gender": "male",
      "image": "https://...",
      "lang": "en",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "isRestricted": false,
      "City": null,
      "Restaurant": null,
      "roleSpecificData": null
    }
  }
}
```

## Role-Specific Data

Depending on the user's role, additional data may be included:

- **Client**: `clientData` with `totalOrders`, location, etc.
- **Courier**: `courierData` with `totalOrders`, `totalEarnings`, verification status, etc.
- **Restaurant/Employee**: Associated restaurant information

## Authentication

All endpoints require admin authentication. The request must include a valid admin token.

## Error Responses

```json
{
  "success": false,
  "message": "error-message-key"
}
```

Common errors:
- `invalid-user-id`: The provided user ID is invalid
- `user-not-found`: No user found with the given ID
- `unauthorized`: User is not authorized to access this endpoint
