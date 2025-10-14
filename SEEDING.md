# Database Seeding Guide

This guide explains how to seed your local database with demo data for development and testing.

## Overview

The project includes comprehensive seed data to help you quickly get started with development:

- **15 Users** with different roles (root, admin, managers, employees, couriers, clients)
- **4 Restaurants** (burger place, pizza house, sushi restaurant, taco truck)
- **16 Menu Categories** (organized by restaurant)
- **34 Menu Items** (with realistic prices, nutrition info, and ratings)

## Quick Start

### 1. Run All Seeders

```bash
npm run seed:dev
```

This will populate your database with all demo data.

### 2. Undo All Seeders

```bash
npm run seed:undo:dev
```

This removes all seeded data from your database.

### 3. Reset Database (Migration + Seed)

```bash
npm run db:reset:dev
```

This will:
1. Undo all migrations (drops all tables)
2. Run all migrations (recreates tables)
3. Run all seeders (populates with demo data)

## Login Credentials

All demo users use the same password for convenience:

**Password:** `1234`

### Demo User Accounts

| Role | Phone | Email |
|------|-------|-------|
| Root | +11234567890 | root@wxwdelivery.com |
| Admin | +11234567891 | admin@wxwdelivery.com |
| Manager (Burgers) | +11234567892 | manager.burgers@wxwdelivery.com |
| Manager (Pizza) | +11234567893 | manager.pizza@wxwdelivery.com |
| Manager (Sushi) | +11234567894 | manager.sushi@wxwdelivery.com |
| Manager (Tacos) | +11234567895 | manager.taco@wxwdelivery.com |
| Employee 1 | +11234567896 | employee1@wxwdelivery.com |
| Employee 2 | +11234567897 | employee2@wxwdelivery.com |
| Courier 1 | +11234567898 | courier1@wxwdelivery.com |
| Courier 2 | +11234567899 | courier2@wxwdelivery.com |
| Courier 3 | +11234567800 | courier3@wxwdelivery.com |
| Client 1 | +11234567801 | client1@example.com |
| Client 2 | +11234567802 | client2@example.com |
| Client 3 | +11234567803 | client3@example.com |
| Client 4 | +11234567804 | client4@example.com |

## Demo Restaurants

### 1. Delicious Burgers & More
- **Location:** Auburn, AL
- **Type:** Stationary
- **Manager:** John Smith (userId: 3)
- **Menu:** 4 burgers, 2 sides, 2 drinks, desserts
- **Prep Time:** 25 minutes

### 2. Italian Pizza House
- **Location:** Auburn, AL
- **Type:** Stationary
- **Manager:** Maria Garcia (userId: 4)
- **Menu:** Classic pizzas, specialty pizzas, pasta, appetizers
- **Prep Time:** 30 minutes

### 3. Tokyo Sushi & Asian Fusion
- **Location:** Athens, AL
- **Type:** Stationary
- **Manager:** David Chen (userId: 5)
- **Menu:** Sushi rolls, sashimi, hot dishes, soups
- **Prep Time:** 35 minutes

### 4. El Loco Taco Truck
- **Location:** Anniston, AL
- **Type:** Mobile (Food Truck)
- **Manager:** Carlos Rodriguez (userId: 6)
- **Menu:** Tacos, burritos, quesadillas, sides
- **Prep Time:** 20 minutes

## Manual Seeding Commands

If you want to run seeders individually:

```bash
# Seed users only
NODE_ENV=dev npx sequelize db:seed --seed 20241014000001-demo-users.js

# Seed restaurants only
NODE_ENV=dev npx sequelize db:seed --seed 20241014000002-demo-restaurants.js

# Seed menu categories only
NODE_ENV=dev npx sequelize db:seed --seed 20241014000003-demo-menu-categories.js

# Seed menu items only
NODE_ENV=dev npx sequelize db:seed --seed 20241014000004-demo-menu-items.js
```

## Undo Specific Seeder

```bash
NODE_ENV=dev npx sequelize db:seed:undo --seed <seeder-filename>
```

## Database Structure

The seeders populate the following tables:

1. **Users** (15 records)
   - Includes all user roles: root, admin, managers, employees, couriers, clients
   - All passwords are hashed using bcrypt
   - Users are linked to Cities (which already exist in your database)

2. **Restaurants** (4 records)
   - Each restaurant is linked to a manager user
   - Includes complete business information and settings
   - Mix of stationary and mobile restaurant types

3. **MenuCategories** (16 records)
   - 4 categories per restaurant
   - Organized by display order

4. **MenuItems** (34 records)
   - Complete menu items with:
     - Prices
     - Nutritional information (kcal, proteins, fats, carbs)
     - Ratings
     - Availability status
     - Images (placeholder filenames)

## Tips for Development

1. **Fresh Start:** Use `npm run db:reset:dev` to start with a clean database
2. **Testing:** Use different user roles to test various features
3. **Orders:** Create test orders between clients and restaurants
4. **Courier Assignment:** Test courier workflows with the 3 courier accounts
5. **Restaurant Management:** Login as managers to test menu management

## Troubleshooting

### Seeder Fails to Run

**Problem:** Seeder returns an error

**Solution:**
- Check that migrations have been run: `npm run migrate:dev`
- Verify database connection in `.env` file
- Check that MariaDB/MySQL service is running

### Duplicate Key Errors

**Problem:** Error about duplicate IDs

**Solution:**
Run undo first, then seed again:
```bash
npm run seed:undo:dev
npm run seed:dev
```

### Password Login Issues

**Problem:** Cannot login with provided credentials

**Solution:**
- Verify password is exactly: `1234`
- Check that Users table has been seeded
- Try using phone number instead of email for login

## Seeder Files Location

All seeder files are located in:
```
src/DB/seeders/
├── 20241014000001-demo-users.js
├── 20241014000002-demo-restaurants.js
├── 20241014000003-demo-menu-categories.js
└── 20241014000004-demo-menu-items.js
```

## Customizing Seed Data

To customize the demo data:

1. Edit the seeder files in `src/DB/seeders/`
2. Modify the data arrays with your own values
3. Run `npm run seed:undo:dev` to clear old data
4. Run `npm run seed:dev` to apply your changes

## Additional Resources

- [Sequelize CLI Documentation](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Sequelize Seeders Guide](https://sequelize.org/docs/v6/other-topics/migrations/#creating-the-first-seed)

---

**Generated with Claude Code** - Last updated: 2024-10-14
