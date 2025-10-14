'use strict';

/**
 * Demo Cuisine Types Seeder
 * Creates popular cuisine types for restaurant filtering
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const cuisineTypes = [
      {
        name: 'American',
        slug: 'american',
        description: 'Classic American comfort food including burgers, fries, and more',
        order: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Italian',
        slug: 'italian',
        description: 'Authentic Italian cuisine including pizza, pasta, and traditional dishes',
        order: 2,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Mexican',
        slug: 'mexican',
        description: 'Traditional Mexican food including tacos, burritos, and more',
        order: 3,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Japanese',
        slug: 'japanese',
        description: 'Japanese cuisine including sushi, ramen, and traditional dishes',
        order: 4,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Chinese',
        slug: 'chinese',
        description: 'Chinese cuisine with a variety of regional specialties',
        order: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Indian',
        slug: 'indian',
        description: 'Aromatic Indian cuisine with rich spices and flavors',
        order: 6,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Thai',
        slug: 'thai',
        description: 'Flavorful Thai dishes with perfect balance of sweet, sour, salty, and spicy',
        order: 7,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Mediterranean',
        slug: 'mediterranean',
        description: 'Fresh Mediterranean cuisine including Greek and Middle Eastern dishes',
        order: 8,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Fast Food',
        slug: 'fast-food',
        description: 'Quick service restaurants serving burgers, chicken, and more',
        order: 9,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Pizza',
        slug: 'pizza',
        description: 'Specialty pizza restaurants',
        order: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Asian Fusion',
        slug: 'asian-fusion',
        description: 'Modern Asian fusion combining multiple Asian cuisines',
        order: 11,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'BBQ',
        slug: 'bbq',
        description: 'Barbecue and smoked meats',
        order: 12,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Seafood',
        slug: 'seafood',
        description: 'Fresh seafood and fish dishes',
        order: 13,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Vegetarian',
        slug: 'vegetarian',
        description: 'Plant-based and vegetarian options',
        order: 14,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Healthy',
        slug: 'healthy',
        description: 'Health-conscious meals and options',
        order: 15,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Desserts',
        slug: 'desserts',
        description: 'Sweet treats, cakes, and desserts',
        order: 16,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Coffee & Tea',
        slug: 'coffee-tea',
        description: 'Coffee shops, cafes, and tea houses',
        order: 17,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('CuisineTypes', cuisineTypes, {});

    console.log('✅ Demo cuisine types created successfully!');
    console.log('🍽️  17 cuisine types added');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('CuisineTypes', {
      slug: {
        [Sequelize.Op.in]: [
          'american', 'italian', 'mexican', 'japanese', 'chinese',
          'indian', 'thai', 'mediterranean', 'fast-food', 'pizza',
          'asian-fusion', 'bbq', 'seafood', 'vegetarian', 'healthy',
          'desserts', 'coffee-tea'
        ]
      }
    }, {});

    console.log('✅ Demo cuisine types removed successfully!');
  }
};
