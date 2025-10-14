# Restaurant Cuisine Type Management - Frontend Integration Guide

## Overview

This document provides a complete guide for implementing cuisine type management in the restaurant UI/frontend. Restaurants can select and update their cuisine types both during sign-up and after registration through their dashboard.

---

## API Endpoints

### 1. Get All Available Cuisine Types (Public)

**Endpoint:** `GET /public/cuisine-types/get/all`

**Authentication:** None required

**Purpose:** Fetch all available cuisine types for restaurant selection (used during sign-up and in settings)

**Request:**
```bash
curl -X POST http://localhost:3001/public/cuisine-types/get/all \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "cuisineTypes": [
      {
        "id": 1,
        "name": "American",
        "slug": "american",
        "description": "Classic American comfort food including burgers, steaks, and BBQ",
        "image": "",
        "order": 1
      },
      {
        "id": 2,
        "name": "Italian",
        "slug": "italian",
        "description": "Traditional Italian cuisine with pasta, pizza, and more",
        "image": "",
        "order": 2
      }
      // ... 15 more cuisine types
    ],
    "total": 17
  }
}
```

---

### 2. Get Restaurant's Current Cuisine Types (Authenticated)

**Endpoint:** `POST /private/restaurant/cuisine-types/get/my`

**Authentication:** Required (Restaurant owner/manager)

**Purpose:** Fetch the currently selected cuisine types for the logged-in restaurant

**Request:**
```bash
curl -X POST http://localhost:3001/private/restaurant/cuisine-types/get/my \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "success",
  "data": {
    "cuisineTypes": [
      {
        "id": 1,
        "name": "American",
        "slug": "american",
        "description": "Classic American comfort food including burgers, steaks, and BBQ",
        "image": "",
        "order": 1
      },
      {
        "id": 8,
        "name": "Fast Food",
        "slug": "fast-food",
        "description": "Quick service food including burgers, fries, and sandwiches",
        "image": "",
        "order": 8
      }
    ],
    "total": 2,
    "restaurantId": 52,
    "restaurantName": "Delicious Burgers & More"
  }
}
```

---

### 3. Update Restaurant's Cuisine Types (Authenticated)

**Endpoint:** `POST /private/restaurant/cuisine-types/update`

**Authentication:** Required (Restaurant owner/manager)

**Purpose:** Update the cuisine types for the logged-in restaurant

**Request Body:**
```json
{
  "cuisineTypeIds": [1, 3, 5, 8]
}
```

**Full Request:**
```bash
curl -X POST http://localhost:3001/private/restaurant/cuisine-types/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "cuisineTypeIds": [1, 3, 5, 8]
  }'
```

**Validation Rules:**
- `cuisineTypeIds` must be an array
- At least one cuisine type must be selected
- All IDs must exist in the CuisineTypes table
- All cuisine types must be active (`isActive: true`)

**Success Response:**
```json
{
  "success": true,
  "message": "Cuisine types updated successfully",
  "data": {
    "cuisineTypes": [
      {
        "id": 1,
        "name": "American",
        "slug": "american",
        "description": "Classic American comfort food including burgers, steaks, and BBQ",
        "image": "",
        "order": 1
      },
      {
        "id": 3,
        "name": "Mexican",
        "slug": "mexican",
        "description": "Authentic Mexican food with tacos, burritos, and enchiladas",
        "image": "",
        "order": 3
      }
      // ... selected cuisines
    ],
    "total": 4,
    "restaurantId": 52
  }
}
```

**Error Responses:**

*No cuisine types selected:*
```json
{
  "success": false,
  "message": "Please select at least one cuisine type"
}
```

*Invalid cuisine type IDs:*
```json
{
  "success": false,
  "message": "One or more selected cuisine types are invalid"
}
```

---

## Frontend Implementation Guide

### Scenario 1: Restaurant Sign-Up Flow

During restaurant registration, add a cuisine type selection step after basic information.

**Step 1: Fetch Available Cuisine Types**

```javascript
// Fetch all available cuisine types when sign-up form loads
async function loadCuisineTypes() {
  try {
    const response = await fetch('http://localhost:3001/public/cuisine-types/get/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data.cuisineTypes;
    } else {
      console.error('Failed to load cuisine types:', result.message);
      return [];
    }
  } catch (error) {
    console.error('Error loading cuisine types:', error);
    return [];
  }
}
```

**Step 2: Render Cuisine Type Selection UI**

```jsx
// React component example
import React, { useState, useEffect } from 'react';

function CuisineTypeSelector({ selectedIds, onChange }) {
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCuisines() {
      setLoading(true);
      const cuisines = await loadCuisineTypes();
      setCuisineTypes(cuisines);
      setLoading(false);
    }
    fetchCuisines();
  }, []);

  const handleToggle = (cuisineId) => {
    const newSelection = selectedIds.includes(cuisineId)
      ? selectedIds.filter(id => id !== cuisineId)
      : [...selectedIds, cuisineId];
    onChange(newSelection);
  };

  if (loading) return <div>Loading cuisine types...</div>;

  return (
    <div className="cuisine-type-selector">
      <h3>Select Your Cuisine Types</h3>
      <p className="text-muted">Choose at least one cuisine type that describes your restaurant</p>

      <div className="cuisine-grid">
        {cuisineTypes.map(cuisine => (
          <div
            key={cuisine.id}
            className={`cuisine-card ${selectedIds.includes(cuisine.id) ? 'selected' : ''}`}
            onClick={() => handleToggle(cuisine.id)}
          >
            <div className="cuisine-icon">
              {cuisine.image ? (
                <img src={cuisine.image} alt={cuisine.name} />
              ) : (
                <span className="placeholder-icon">🍽️</span>
              )}
            </div>
            <h4>{cuisine.name}</h4>
            <p className="cuisine-description">{cuisine.description}</p>
            <div className="checkbox">
              <input
                type="checkbox"
                checked={selectedIds.includes(cuisine.id)}
                onChange={() => handleToggle(cuisine.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        ))}
      </div>

      {selectedIds.length === 0 && (
        <p className="text-danger">Please select at least one cuisine type</p>
      )}
    </div>
  );
}

export default CuisineTypeSelector;
```

**Step 3: Add to Sign-Up Form**

```jsx
// In your restaurant sign-up form component
function RestaurantSignUpForm() {
  const [formData, setFormData] = useState({
    owner: {
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordRepeat: ''
    },
    restaurant: {
      name: '',
      stateId: 0,
      cityId: 0,
      address: '',
      type: 'stationary',
      website: '',
      comment: ''
    },
    cuisineTypeIds: [] // Add this field
  });

  const handleCuisineChange = (selectedIds) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypeIds: selectedIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate cuisine types
    if (formData.cuisineTypeIds.length === 0) {
      alert('Please select at least one cuisine type');
      return;
    }

    try {
      // Step 1: Register restaurant
      const signUpResponse = await fetch('http://localhost:3001/public/restaurant/sign-up/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: formData.owner,
          restaurant: formData.restaurant
        })
      });

      const signUpResult = await signUpResponse.json();

      if (!signUpResult.success) {
        alert(signUpResult.message);
        return;
      }

      // Step 2: After successful registration and login, update cuisine types
      // (This assumes you have the auth token after login)
      const updateCuisineResponse = await fetch('http://localhost:3001/private/restaurant/cuisine-types/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Get token after login
        },
        body: JSON.stringify({
          cuisineTypeIds: formData.cuisineTypeIds
        })
      });

      const updateCuisineResult = await updateCuisineResponse.json();

      if (updateCuisineResult.success) {
        alert('Restaurant registered successfully with cuisine types!');
        // Redirect to dashboard
      }

    } catch (error) {
      console.error('Sign-up error:', error);
      alert('Failed to register restaurant');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Owner information fields */}
      {/* Restaurant information fields */}

      {/* Cuisine Type Selection */}
      <CuisineTypeSelector
        selectedIds={formData.cuisineTypeIds}
        onChange={handleCuisineChange}
      />

      <button type="submit">Register Restaurant</button>
    </form>
  );
}
```

---

### Scenario 2: Restaurant Dashboard - Edit Cuisine Types

In the restaurant dashboard settings, add a section to view and edit cuisine types.

**Component Implementation:**

```jsx
import React, { useState, useEffect } from 'react';

function CuisineTypeManagement({ authToken }) {
  const [availableCuisines, setAvailableCuisines] = useState([]);
  const [currentCuisines, setCurrentCuisines] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load available cuisine types and current selections
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch all available cuisines
      const availableResponse = await fetch('http://localhost:3001/public/cuisine-types/get/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const availableResult = await availableResponse.json();

      // Fetch restaurant's current cuisines
      const currentResponse = await fetch('http://localhost:3001/private/restaurant/cuisine-types/get/my', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      const currentResult = await currentResponse.json();

      if (availableResult.success) {
        setAvailableCuisines(availableResult.data.cuisineTypes);
      }

      if (currentResult.success) {
        setCurrentCuisines(currentResult.data.cuisineTypes);
        setSelectedIds(currentResult.data.cuisineTypes.map(c => c.id));
      }
    } catch (error) {
      console.error('Error loading cuisine data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleToggle = (cuisineId) => {
    setSelectedIds(prev =>
      prev.includes(cuisineId)
        ? prev.filter(id => id !== cuisineId)
        : [...prev, cuisineId]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one cuisine type');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:3001/private/restaurant/cuisine-types/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ cuisineTypeIds: selectedIds })
      });

      const result = await response.json();

      if (result.success) {
        setCurrentCuisines(result.data.cuisineTypes);
        setIsEditing(false);
        alert('Cuisine types updated successfully!');
      } else {
        alert(result.message || 'Failed to update cuisine types');
      }
    } catch (error) {
      console.error('Error updating cuisines:', error);
      alert('Failed to update cuisine types');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to current cuisines
    setSelectedIds(currentCuisines.map(c => c.id));
    setIsEditing(false);
  };

  if (loading) {
    return <div className="loading">Loading cuisine types...</div>;
  }

  return (
    <div className="cuisine-management">
      <div className="section-header">
        <h2>Cuisine Types</h2>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Cuisine Types
          </button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <div className="cuisine-display">
          <p className="text-muted">Your restaurant's cuisine types:</p>
          <div className="cuisine-badges">
            {currentCuisines.length > 0 ? (
              currentCuisines.map(cuisine => (
                <span key={cuisine.id} className="badge badge-cuisine">
                  {cuisine.name}
                </span>
              ))
            ) : (
              <p className="text-warning">No cuisine types selected</p>
            )}
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="cuisine-editor">
          <p className="text-muted">Select the cuisine types that best describe your restaurant:</p>

          <div className="cuisine-grid">
            {availableCuisines.map(cuisine => (
              <div
                key={cuisine.id}
                className={`cuisine-card ${selectedIds.includes(cuisine.id) ? 'selected' : ''}`}
                onClick={() => handleToggle(cuisine.id)}
              >
                <div className="cuisine-icon">
                  {cuisine.image ? (
                    <img src={cuisine.image} alt={cuisine.name} />
                  ) : (
                    <span className="placeholder-icon">🍽️</span>
                  )}
                </div>
                <h4>{cuisine.name}</h4>
                <p className="cuisine-description">{cuisine.description}</p>
                <div className="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cuisine.id)}
                    onChange={() => handleToggle(cuisine.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={saving || selectedIds.length === 0}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          {selectedIds.length === 0 && (
            <p className="text-danger">Please select at least one cuisine type</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CuisineTypeManagement;
```

---

## CSS Styling Examples

```css
/* Cuisine Type Selector Styles */
.cuisine-type-selector {
  padding: 20px;
}

.cuisine-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.cuisine-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.cuisine-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cuisine-card.selected {
  border-color: #28a745;
  background-color: #f0fff4;
}

.cuisine-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 10px;
}

.cuisine-icon img {
  width: 60px;
  height: 60px;
  object-fit: cover;
}

.cuisine-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.cuisine-description {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-bottom: 10px;
  line-height: 1.4;
}

.cuisine-card .checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
}

.cuisine-card .checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Badge Display */
.cuisine-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.badge-cuisine {
  background-color: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

/* Actions */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-danger {
  color: #dc3545;
  font-size: 14px;
  margin-top: 10px;
}

.text-muted {
  color: #6c757d;
  font-size: 14px;
}

.text-warning {
  color: #ffc107;
  font-size: 14px;
}
```

---

## User Flow Diagrams

### Flow 1: During Restaurant Sign-Up

```
1. User fills owner information (name, email, phone, password)
   ↓
2. User fills restaurant information (name, address, type, etc.)
   ↓
3. User selects cuisine types (multi-select checkboxes)
   - Fetch: GET /public/cuisine-types/get/all
   - Display all 17 available cuisines
   - User selects 1 or more cuisines
   ↓
4. User submits sign-up form
   - POST /public/restaurant/sign-up/
   - Creates User + Restaurant + Stripe Account
   - Sends verification email
   ↓
5. User verifies email and logs in
   ↓
6. After login, automatically update cuisine types
   - POST /private/restaurant/cuisine-types/update
   - With cuisineTypeIds array
   ↓
7. Restaurant dashboard loads with selected cuisines
```

### Flow 2: Editing Cuisine Types from Dashboard

```
1. Restaurant owner logs into dashboard
   ↓
2. Navigate to Settings → Cuisine Types
   ↓
3. System loads current cuisine selections
   - POST /private/restaurant/cuisine-types/get/my
   - Display as badges: "American, Fast Food, Italian"
   ↓
4. Owner clicks "Edit Cuisine Types" button
   ↓
5. System loads all available cuisines
   - POST /public/cuisine-types/get/all
   - Display as selectable grid with checkboxes
   - Pre-check currently selected cuisines
   ↓
6. Owner toggles checkboxes to add/remove cuisines
   ↓
7. Owner clicks "Save Changes"
   - POST /private/restaurant/cuisine-types/update
   - With new cuisineTypeIds array
   ↓
8. System updates and returns success message
   ↓
9. Dashboard refreshes showing updated cuisine badges
```

---

## Backend Sign-Up Flow Modification

**IMPORTANT:** Currently, the restaurant sign-up endpoint does NOT handle cuisine types. You need to modify the sign-up process.

### Option A: Add Cuisine Types to Sign-Up Endpoint (Recommended)

Modify [src/routes/public/restaurant/sign-up/index.js](src/routes/public/restaurant/sign-up/index.js) to accept and save cuisine types during registration.

**Changes needed:**

1. Accept `cuisineTypeIds` in request body
2. After creating restaurant (line 197), insert cuisine types into `RestaurantCuisines` table within the same transaction
3. Example code:

```javascript
// After line 197 (after restaurant creation)

// Get cuisine type IDs from request
const cuisineTypeIds = req.getCommonData('cuisineTypeIds', []);

if (Array.isArray(cuisineTypeIds) && cuisineTypeIds.length > 0) {
  const validCuisineIds = cuisineTypeIds
    .map(id => Math.floor(+id))
    .filter(id => App.isPosNumber(id));

  if (validCuisineIds.length > 0) {
    // Insert restaurant cuisines
    const cuisineData = validCuisineIds.map(cuisineTypeId => ({
      restaurantId: mRestaurant.id,
      cuisineTypeId: cuisineTypeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await App.DB.sequelize.getQueryInterface().bulkInsert(
      'RestaurantCuisines',
      cuisineData,
      { transaction: tx }
    );
  }
}
```

### Option B: Two-Step Process (Current Implementation)

1. Register restaurant (without cuisines)
2. After email verification and login, call `/private/restaurant/cuisine-types/update` to set cuisines

This is less ideal but works if you don't want to modify the sign-up endpoint immediately.

---

## Testing Guide

### Test 1: Fetch Available Cuisine Types

```bash
curl -X POST http://localhost:3001/public/cuisine-types/get/all \
  -H "Content-Type: application/json"
```

Expected: Returns all 17 cuisine types

### Test 2: Get Restaurant's Current Cuisines

```bash
# First, login to get auth token
curl -X POST http://localhost:3001/public/restaurant/sign-in/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager1@example.com",
    "password": "1234"
  }'

# Then get cuisines (replace YOUR_TOKEN)
curl -X POST http://localhost:3001/private/restaurant/cuisine-types/get/my \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Returns restaurant's selected cuisines

### Test 3: Update Restaurant Cuisines

```bash
curl -X POST http://localhost:3001/private/restaurant/cuisine-types/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cuisineTypeIds": [1, 3, 5]
  }'
```

Expected: Updates cuisines and returns success

### Test 4: Error Cases

**No cuisines selected:**
```bash
curl -X POST http://localhost:3001/private/restaurant/cuisine-types/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cuisineTypeIds": []
  }'
```

Expected: Error "Please select at least one cuisine type"

**Invalid cuisine ID:**
```bash
curl -X POST http://localhost:3001/private/restaurant/cuisine-types/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cuisineTypeIds": [999]
  }'
```

Expected: Error "One or more selected cuisine types are invalid"

---

## Available Cuisine Types

Current database includes 17 cuisine types:

1. **American** - Classic American comfort food
2. **Italian** - Traditional Italian cuisine
3. **Mexican** - Authentic Mexican food
4. **Chinese** - Traditional Chinese dishes
5. **Japanese** - Japanese cuisine including sushi
6. **Indian** - Authentic Indian curries and dishes
7. **Thai** - Traditional Thai food
8. **Fast Food** - Quick service food
9. **Pizza** - Pizza restaurants and pizzerias
10. **Seafood** - Fresh seafood and fish dishes
11. **Vegetarian** - Vegetarian and plant-based options
12. **Vegan** - Vegan and plant-based cuisine
13. **BBQ** - Barbecue and grilled specialties
14. **Mediterranean** - Mediterranean cuisine
15. **Middle Eastern** - Middle Eastern dishes
16. **Asian Fusion** - Fusion of various Asian cuisines
17. **Desserts & Sweets** - Desserts, pastries, and sweet treats

---

## Summary

### For Frontend Developers:

1. **During Sign-Up:**
   - Call `/public/cuisine-types/get/all` to load options
   - Display as checkboxes/cards for selection
   - Submit selected IDs with sign-up form OR call update endpoint after registration

2. **In Dashboard Settings:**
   - Call `/private/restaurant/cuisine-types/get/my` to load current selection
   - Display as badges in view mode
   - Call `/public/cuisine-types/get/all` when entering edit mode
   - Call `/private/restaurant/cuisine-types/update` to save changes

3. **Validation:**
   - At least one cuisine must be selected
   - Show error messages for validation failures
   - Disable save button if no cuisines selected

### For Backend Developers:

1. Three new endpoints created:
   - `GET /public/cuisine-types/get/all` (public)
   - `POST /private/restaurant/cuisine-types/get/my` (authenticated)
   - `POST /private/restaurant/cuisine-types/update` (authenticated)

2. Consider modifying sign-up endpoint to accept `cuisineTypeIds` for one-step registration

3. All APIs include proper error handling and transaction management

---

## Questions or Issues?

If you encounter any issues implementing this feature, check:

1. Database migrations are run: `npm run migrate:dev`
2. Cuisine types are seeded: `npm run seed:dev`
3. Foreign key associations are set up correctly in `setUpForeignKeys.js`
4. Authentication middleware is working for private endpoints

For more details, see:
- [CUISINE_TYPES.md](CUISINE_TYPES.md) - Complete cuisine types architecture
- [API_CUISINE_UPDATES.md](API_CUISINE_UPDATES.md) - API update details
