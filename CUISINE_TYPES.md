# Cuisine Types Feature Documentation

## Overview

The cuisine types feature allows restaurants to be categorized by the type of food they serve (e.g., Italian, Mexican, Japanese). This enables users to filter restaurants by cuisine type in the UI.

## Architecture

### Database Structure

The implementation uses a **many-to-many relationship** allowing restaurants to have multiple cuisine types:

```
CuisineTypes (Master table of cuisine types)
     |
     |--- RestaurantCuisines (Junction table)
                |
          Restaurants
```

### Tables

#### 1. CuisineTypes
Stores the master list of available cuisine types.

**Fields:**
- `id` - Primary key
- `name` - Cuisine name (e.g., "Italian", "Mexican")
- `slug` - URL-friendly identifier (e.g., "italian", "mexican")
- `description` - Description of the cuisine type
- `image` - Optional image filename for the cuisine
- `isActive` - Whether this cuisine type is active/visible
- `order` - Display order in UI
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- Primary key on `id`
- Unique index on `name`
- Unique index on `slug`
- Index on `isActive` for filtering

#### 2. RestaurantCuisines
Junction table linking restaurants to their cuisine types.

**Fields:**
- `id` - Primary key
- `restaurantId` - Foreign key to Restaurants table
- `cuisineTypeId` - Foreign key to CuisineTypes table
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- Composite unique index on `(restaurantId, cuisineTypeId)` to prevent duplicates
- Index on `restaurantId` for fast restaurant lookups
- Index on `cuisineTypeId` for fast cuisine lookups

**Foreign Keys:**
- `restaurantId` → `Restaurants.id` (CASCADE on update/delete)
- `cuisineTypeId` → `CuisineTypes.id` (CASCADE on update/delete)

## File Structure

```
src/DB/
├── migrations/
│   ├── 20210510000199.0-create-[CuisineTypes]-table.js
│   └── 20210510000200.0-create-[RestaurantCuisines]-table.js
├── models/
│   └── CuisineType.model.js
└── seeders/
    ├── 20241014000005-demo-cuisine-types.js
    └── 20241014000006-demo-restaurant-cuisines.js
```

## Seeded Cuisine Types

The system comes pre-seeded with 17 popular cuisine types:

1. **American** - Classic American comfort food
2. **Italian** - Pizza, pasta, and traditional Italian dishes
3. **Mexican** - Tacos, burritos, and traditional Mexican food
4. **Japanese** - Sushi, ramen, and Japanese specialties
5. **Chinese** - Various regional Chinese specialties
6. **Indian** - Aromatic dishes with rich spices
7. **Thai** - Sweet, sour, salty, and spicy balanced dishes
8. **Mediterranean** - Greek and Middle Eastern dishes
9. **Fast Food** - Quick service restaurants
10. **Pizza** - Specialty pizza restaurants
11. **Asian Fusion** - Modern combination of Asian cuisines
12. **BBQ** - Barbecue and smoked meats
13. **Seafood** - Fresh seafood and fish dishes
14. **Vegetarian** - Plant-based options
15. **Healthy** - Health-conscious meals
16. **Desserts** - Cakes and sweet treats
17. **Coffee & Tea** - Coffee shops and cafes

## Demo Data

### Restaurant-Cuisine Mappings

- **Delicious Burgers & More**: American, Fast Food
- **Italian Pizza House**: Italian, Pizza
- **Tokyo Sushi & Asian Fusion**: Japanese, Asian Fusion
- **El Loco Taco Truck**: Mexican

## Model Methods

### CuisineType Model

```javascript
// Get all active cuisine types
const cuisines = await CuisineType.getAllActive({ asArray: true });

// Get cuisine by slug
const italian = await CuisineType.getBySlug('italian');

// Get cuisine by ID
const cuisine = await CuisineType.getById(1);
```

## API Usage Examples

### 1. Get All Active Cuisine Types

```javascript
const CuisineType = App.getModel('CuisineType');
const cuisines = await CuisineType.getAllActive({ asArray: true });

// Returns:
// [
//   { id: 1, name: 'American', slug: 'american', image: '...' },
//   { id: 2, name: 'Italian', slug: 'italian', image: '...' },
//   ...
// ]
```

### 2. Get Restaurants by Cuisine Type

```javascript
// Find all restaurants with a specific cuisine
const Restaurant = App.getModel('Restaurant');

const restaurants = await Restaurant.findAll({
  include: [{
    model: App.getModel('CuisineType'),
    through: { attributes: [] }, // Exclude junction table fields
    where: { slug: 'italian' }
  }]
});
```

### 3. Get Restaurant with Its Cuisines

```javascript
const Restaurant = App.getModel('Restaurant');

const restaurant = await Restaurant.findOne({
  where: { id: restaurantId },
  include: [{
    model: App.getModel('CuisineType'),
    through: { attributes: [] }, // Exclude junction table fields
    attributes: ['id', 'name', 'slug', 'image']
  }]
});

// Returns restaurant with CuisineTypes array
```

### 4. Filter Restaurants by Multiple Cuisines (OR logic)

```javascript
const Restaurant = App.getModel('Restaurant');

const restaurants = await Restaurant.findAll({
  include: [{
    model: App.getModel('CuisineType'),
    through: { attributes: [] },
    where: {
      slug: {
        [App.DB.Op.in]: ['italian', 'mexican', 'japanese']
      }
    }
  }],
  distinct: true
});
```

### 5. Add Cuisine to Restaurant

```javascript
const restaurant = await Restaurant.findByPk(restaurantId);
const cuisineType = await CuisineType.findOne({ where: { slug: 'italian' } });

// Add cuisine to restaurant
await queryInterface.bulkInsert('RestaurantCuisines', [{
  restaurantId: restaurant.id,
  cuisineTypeId: cuisineType.id,
  createdAt: new Date(),
  updatedAt: new Date()
}]);
```

### 6. Remove Cuisine from Restaurant

```javascript
await queryInterface.bulkDelete('RestaurantCuisines', {
  restaurantId: restaurantId,
  cuisineTypeId: cuisineTypeId
});
```

## UI Implementation Suggestions

### 1. Cuisine Filter Component

```javascript
// Fetch all active cuisines for filter UI
GET /api/cuisines
Response: [
  {
    id: 1,
    name: "American",
    slug: "american",
    image: "https://..."
  },
  ...
]

// Filter restaurants by cuisine
GET /api/restaurants?cuisine=italian,mexican
```

### 2. Restaurant Listing

Display cuisine tags/badges on each restaurant card:

```javascript
{
  id: 1,
  name: "Italian Pizza House",
  cuisines: [
    { name: "Italian", slug: "italian" },
    { name: "Pizza", slug: "pizza" }
  ]
}
```

### 3. Search & Filter Flow

1. User selects cuisine filters (e.g., "Italian" + "Pizza")
2. Frontend sends: `GET /api/restaurants?cuisine=italian,pizza`
3. Backend filters restaurants that have ANY of these cuisines
4. Return filtered results with cuisine info

## Database Queries for Common Operations

### Get Cuisine Type Statistics

```sql
SELECT
  ct.name,
  ct.slug,
  COUNT(rc.restaurantId) as restaurant_count
FROM CuisineTypes ct
LEFT JOIN RestaurantCuisines rc ON ct.id = rc.cuisineTypeId
WHERE ct.isActive = 1
GROUP BY ct.id
ORDER BY restaurant_count DESC;
```

### Get Restaurants with Specific Cuisine

```sql
SELECT r.*
FROM Restaurants r
INNER JOIN RestaurantCuisines rc ON r.id = rc.restaurantId
INNER JOIN CuisineTypes ct ON rc.cuisineTypeId = ct.id
WHERE ct.slug = 'italian'
  AND r.isVerified = 1
  AND r.isDeleted = 0;
```

### Get All Cuisines for a Restaurant

```sql
SELECT ct.*
FROM CuisineTypes ct
INNER JOIN RestaurantCuisines rc ON ct.id = rc.cuisineTypeId
WHERE rc.restaurantId = ?
  AND ct.isActive = 1
ORDER BY ct.order ASC;
```

## Migration Commands

```bash
# Run migrations to create tables
npm run migrate:dev

# Seed cuisine types
NODE_ENV=dev npx sequelize db:seed --seed 20241014000005-demo-cuisine-types.js

# Seed restaurant-cuisine links
NODE_ENV=dev npx sequelize db:seed --seed 20241014000006-demo-restaurant-cuisines.js

# Run all seeds (includes cuisine data)
npm run seed:dev

# Undo cuisine seeds
NODE_ENV=dev npx sequelize db:seed:undo --seed 20241014000006-demo-restaurant-cuisines.js
NODE_ENV=dev npx sequelize db:seed:undo --seed 20241014000005-demo-cuisine-types.js
```

## Adding New Cuisine Types

### Option 1: Via Seeder

Create a new seeder file:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    await queryInterface.bulkInsert('CuisineTypes', [{
      name: 'Korean',
      slug: 'korean',
      description: 'Traditional Korean cuisine including BBQ, kimchi, and more',
      order: 18,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('CuisineTypes', {
      slug: 'korean'
    }, {});
  }
};
```

### Option 2: Via API/Admin Panel

Create an admin endpoint:

```javascript
// POST /api/admin/cuisines
{
  name: "Korean",
  slug: "korean",
  description: "Traditional Korean cuisine",
  order: 18,
  isActive: true
}
```

## Best Practices

1. **Always use slugs for filtering** - They're URL-friendly and indexed
2. **Use junction table for flexibility** - Restaurants can have multiple cuisines
3. **Keep isActive flag** - Allows disabling cuisines without deletion
4. **Order matters** - Use the `order` field for consistent UI display
5. **Cascade deletes** - Foreign keys ensure data integrity
6. **Validate uniqueness** - Prevent duplicate restaurant-cuisine pairs

## Troubleshooting

### Duplicate Key Error

If you see duplicate key errors, it means a restaurant-cuisine pair already exists. The composite unique index prevents duplicates.

### Missing Cuisines

Check that:
1. Migrations have been run: `npm run migrate:dev`
2. Cuisines are seeded: Check `CuisineTypes` table
3. `isActive` is true for the cuisine

### Performance Issues

- Ensure indexes exist on `restaurantId` and `cuisineTypeId`
- Use `distinct: true` when joining to avoid duplicates
- Consider caching cuisine types (they rarely change)

---

**Generated with Claude Code** - Last updated: 2024-10-14
