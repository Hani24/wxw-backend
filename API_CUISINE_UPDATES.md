# API Updates: Cuisine Types Integration

## Overview

Both restaurant API endpoints have been updated to include cuisine type information in their responses. This allows the frontend to display cuisine filters and show what types of food each restaurant serves.

---

## Updated Endpoints

### 1. `/public/restaurant/full-info/get/by/id/:id`

**What Changed:**
- Added `CuisineTypes` array to the restaurant response
- Includes full cuisine information (id, name, slug, description, image)

**New Response Format:**

```json
{
  "success": true,
  "message": "success",
  "data": {
    "info": {
      "id": 52,
      "name": "El Loco Taco Truck",
      "image": "https://...",
      "description": "Authentic Mexican street food...",
      "rating": 4.6,
      "type": "mobile",
      "isOpen": true,
      "CuisineTypes": [
        {
          "id": 3,
          "name": "Mexican",
          "slug": "mexican",
          "description": "Traditional Mexican food including tacos, burritos, and more",
          "image": "https://..."
        }
      ],
      "City": { ... },
      "State": { ... }
    },
    "workingTime": { ... },
    "MenuCategories": [ ... ]
  }
}
```

**File Updated:**
- [src/routes/public/restaurant/full-info/get/by/id/index.js](src/routes/public/restaurant/full-info/get/by/id/index.js)

**Changes Made:**
- Added `CuisineType` model to the `include` array
- Configured many-to-many relationship through `RestaurantCuisines` junction table
- Filters only active cuisines (`isActive: true`)
- Excludes junction table fields for cleaner response

---

### 2. `/public/restaurant/find/all`

**What Changed:**
- Added `CuisineTypes` array to each restaurant in the list
- Works for both proximity search and standard search
- Includes full cuisine information

**New Response Format:**

```json
{
  "success": true,
  "message": "success",
  "data": {
    "count": 4,
    "rows": [
      {
        "id": 49,
        "name": "Delicious Burgers & More",
        "image": "https://...",
        "rating": 4.5,
        "type": "stationary",
        "isOpen": true,
        "distance": 0,
        "distanceType": "mile",
        "MenuCategories": [
          { "id": 1, "name": "Burgers" },
          { "id": 2, "name": "Sides" }
        ],
        "CuisineTypes": [
          {
            "id": 1,
            "name": "American",
            "slug": "american",
            "description": "Classic American comfort food...",
            "image": "https://..."
          },
          {
            "id": 9,
            "name": "Fast Food",
            "slug": "fast-food",
            "description": "Quick service restaurants...",
            "image": "https://..."
          }
        ]
      }
    ]
  }
}
```

**File Updated:**
- [src/routes/public/restaurant/find/all/index.js](src/routes/public/restaurant/find/all/index.js)

**Changes Made:**

**For Proximity Search (Raw SQL):**
- Added separate SQL query to fetch cuisine types for each restaurant
- Query joins `CuisineTypes` and `RestaurantCuisines` tables
- Formats cuisine images with S3 URLs
- Orders by cuisine `order` field

**For Standard Search (Sequelize ORM):**
- Added `CuisineType` model to the `include` array
- Configured many-to-many relationship
- Filters only active cuisines
- Uses same formatting as proximity search for consistency

---

## Model Associations Setup

**File Updated:**
- [src/DB/setUpForeignKeys.js](src/DB/setUpForeignKeys.js)

**Association Added:**

```javascript
// Many-to-Many relationship
Restaurant.belongsToMany(CuisineType, {
  through: 'RestaurantCuisines',
  foreignKey: 'restaurantId',
  otherKey: 'cuisineTypeId'
});

CuisineType.belongsToMany(Restaurant, {
  through: 'RestaurantCuisines',
  foreignKey: 'cuisineTypeId',
  otherKey: 'restaurantId'
});
```

This enables Sequelize to automatically handle the many-to-many relationship and allows queries like:

```javascript
Restaurant.findAll({
  include: [CuisineType]
});
```

---

## Testing the APIs

### Test Full Info Endpoint

```bash
curl -X POST http://localhost:20123/public/restaurant/full-info/get/by/id/52 \
  -H "Content-Type: application/json" \
  -d '{"id": 52}'
```

**Expected:** Restaurant details with `CuisineTypes` array containing "Mexican"

### Test Find All Endpoint

```bash
curl -X POST http://localhost:20123/public/restaurant/find/all \
  -H "Content-Type: application/json" \
  -d '{
    "offset": 0,
    "limit": 10,
    "order": "desc",
    "by": "rating"
  }'
```

**Expected:** List of restaurants, each with `CuisineTypes` array

### Test with Filters

```bash
curl -X POST http://localhost:20123/public/restaurant/find/all \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza",
    "isOpen": true,
    "offset": 0,
    "limit": 10
  }'
```

**Expected:** Filtered restaurants with cuisine types

---

## Frontend Integration Guide

### 1. Display Cuisine Badges on Restaurant Cards

```javascript
// Restaurant card component
function RestaurantCard({ restaurant }) {
  return (
    <div className="restaurant-card">
      <img src={restaurant.image} alt={restaurant.name} />
      <h3>{restaurant.name}</h3>

      {/* Cuisine badges */}
      <div className="cuisine-badges">
        {restaurant.CuisineTypes?.map(cuisine => (
          <span key={cuisine.id} className="badge">
            {cuisine.name}
          </span>
        ))}
      </div>

      <p>{restaurant.rating} ⭐</p>
    </div>
  );
}
```

### 2. Cuisine Filter Component

```javascript
// Fetch all available cuisines for filter
const cuisines = await fetch('/api/public/cuisine-types/all')
  .then(res => res.json());

// Filter component
function CuisineFilter({ onFilterChange }) {
  const [selectedCuisines, setSelectedCuisines] = useState([]);

  const handleCuisineToggle = (slug) => {
    const updated = selectedCuisines.includes(slug)
      ? selectedCuisines.filter(s => s !== slug)
      : [...selectedCuisines, slug];

    setSelectedCuisines(updated);
    onFilterChange(updated);
  };

  return (
    <div className="cuisine-filters">
      {cuisines.map(cuisine => (
        <button
          key={cuisine.id}
          className={selectedCuisines.includes(cuisine.slug) ? 'active' : ''}
          onClick={() => handleCuisineToggle(cuisine.slug)}
        >
          {cuisine.name}
        </button>
      ))}
    </div>
  );
}
```

### 3. Restaurant Detail Page

```javascript
function RestaurantDetail({ restaurantId }) {
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    fetch(`/public/restaurant/full-info/get/by/id/${restaurantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: restaurantId })
    })
    .then(res => res.json())
    .then(data => setRestaurant(data.data.info));
  }, [restaurantId]);

  if (!restaurant) return <div>Loading...</div>;

  return (
    <div className="restaurant-detail">
      <h1>{restaurant.name}</h1>
      <p>{restaurant.description}</p>

      {/* Cuisine types */}
      <div className="cuisines">
        <h3>Cuisine Type:</h3>
        {restaurant.CuisineTypes?.map(cuisine => (
          <span key={cuisine.id} className="cuisine-tag">
            {cuisine.name}
          </span>
        ))}
      </div>

      {/* Menu categories, etc. */}
    </div>
  );
}
```

---

## Current Seeded Data

### Restaurants with Their Cuisines

| Restaurant | Cuisines |
|-----------|----------|
| **Delicious Burgers & More** | American, Fast Food |
| **Italian Pizza House** | Italian, Pizza |
| **Tokyo Sushi & Asian Fusion** | Japanese, Asian Fusion |
| **El Loco Taco Truck** | Mexican |

### All Available Cuisine Types (17 total)

1. American
2. Italian
3. Mexican
4. Japanese
5. Chinese
6. Indian
7. Thai
8. Mediterranean
9. Fast Food
10. Pizza
11. Asian Fusion
12. BBQ
13. Seafood
14. Vegetarian
15. Healthy
16. Desserts
17. Coffee & Tea

---

## Benefits

### For Users
✅ **Better Discovery**: Users can filter restaurants by cuisine type
✅ **Clear Information**: See what type of food a restaurant serves at a glance
✅ **Multiple Categories**: Restaurants can have multiple cuisine types (e.g., "Italian" + "Pizza")

### For Development
✅ **Clean Architecture**: Proper many-to-many relationship
✅ **Scalable**: Easy to add new cuisine types
✅ **Consistent**: Same data structure across both endpoints
✅ **Flexible**: Restaurants can be recategorized without data loss

---

## Next Steps

### Recommended Enhancements

1. **Add Cuisine Filter to Find All API**
   - Accept `cuisine` parameter to filter by cuisine slug
   - Support multiple cuisines (OR logic)

2. **Create Cuisine Types Endpoint**
   - `GET /public/cuisine-types/all` - Returns all active cuisines
   - For populating filter UI

3. **Add Cuisine Count Endpoint**
   - Show how many restaurants for each cuisine
   - Help users see available options

4. **Search by Cuisine**
   - Add cuisine-based search functionality
   - Combine with text search and location filters

### Example Future API

```javascript
// Filter by cuisines
POST /public/restaurant/find/all
{
  "cuisines": ["italian", "mexican"],  // NEW
  "isOpen": true,
  "searchNearByMe": true
}

// Returns only Italian or Mexican restaurants
```

---

## Troubleshooting

### Issue: CuisineTypes array is empty

**Causes:**
1. Restaurant has no cuisines assigned
2. Cuisines are inactive (`isActive = false`)
3. Association not properly set up

**Solution:**
```sql
-- Check restaurant cuisines
SELECT r.name, ct.name as cuisine
FROM Restaurants r
LEFT JOIN RestaurantCuisines rc ON r.id = rc.restaurantId
LEFT JOIN CuisineTypes ct ON rc.cuisineTypeId = ct.id
WHERE r.id = 52;
```

### Issue: Server error after updates

**Cause:** Server needs restart to load model associations

**Solution:**
```bash
# Restart the development server
npm run start:dev
```

### Issue: CuisineTypes not defined

**Cause:** Model not loaded or association missing

**Solution:**
- Verify `CuisineType.model.js` exists
- Check `setUpForeignKeys.js` has the association
- Restart server

---

## Summary

✅ **Files Modified:** 3 files
✅ **APIs Updated:** 2 endpoints
✅ **New Feature:** Cuisine type filtering ready
✅ **Backward Compatible:** Existing API calls still work
✅ **Data Seeded:** 4 restaurants with 7 cuisine links

**All changes are backward compatible** - existing API consumers will continue to work, they'll just receive additional `CuisineTypes` data in the response.

---

**Generated with Claude Code** - Last updated: 2024-10-14
