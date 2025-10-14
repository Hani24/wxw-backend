'use strict';

const bcrypt = require('bcrypt');

/**
 * Demo Users Seeder
 * Creates sample users with different roles for testing
 * Password for all users: "1234"
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash the password once for all users (for demo purposes)
    // Password: "1234"
    const hashedPassword = await bcrypt.hash('1234', 10);

    const now = new Date();

    const users = [
      // Root/Admin Users
      {
        role: 'root',
        phone: '+11234567890',
        email: 'root@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Root',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'admin',
        phone: '+11234567891',
        email: 'admin@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },

      // Restaurant Owners (for creating restaurants)
      {
        role: 'restaurant',
        phone: '+11234567892',
        email: 'manager.burgers@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '123 Main St',
        zip: '36830',
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'restaurant',
        phone: '+11234567893',
        email: 'manager.pizza@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Maria',
        lastName: 'Garcia',
        gender: 'female',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '456 Oak Ave',
        zip: '36830',
        image: 'default.female.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'restaurant',
        phone: '+11234567894',
        email: 'manager.sushi@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Chen',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '789 Elm St',
        zip: '35611',
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'restaurant',
        phone: '+11234567895',
        email: 'manager.taco@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '321 Maple Dr',
        zip: '36201',
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },

      // Restaurant Employees
      {
        role: 'employee',
        phone: '+11234567896',
        email: 'employee1@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'female',
        isEmailVerified: true,
        isPhoneVerified: true,
        // restaurantId will be set after restaurant is created
        cityId: null, // No city assigned
        image: 'default.female.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'employee',
        phone: '+11234567897',
        email: 'employee2@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Brown',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        // restaurantId will be set after restaurant is created
        cityId: null, // No city assigned
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },

      // Couriers
      {
        role: 'courier',
        phone: '+11234567898',
        email: 'courier1@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'James',
        lastName: 'Wilson',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 32.6099,
        lon: -85.4808,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'courier',
        phone: '+11234567899',
        email: 'courier2@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Emma',
        lastName: 'Davis',
        gender: 'female',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        image: 'default.female.png',
        isNewUser: false,
        lang: 'en',
        lat: 34.8026,
        lon: -86.9719,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'courier',
        phone: '+11234567800',
        email: 'courier3@wxwdelivery.com',
        password: hashedPassword,
        firstName: 'Robert',
        lastName: 'Martinez',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 33.6597,
        lon: -85.8316,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },

      // Clients
      {
        role: 'client',
        phone: '+11234567801',
        email: 'client1@example.com',
        password: hashedPassword,
        firstName: 'Alice',
        lastName: 'Anderson',
        gender: 'female',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '100 Client St',
        zip: '36830',
        image: 'default.female.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'client',
        phone: '+11234567802',
        email: 'client2@example.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Taylor',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '200 Customer Ave',
        zip: '36830',
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'client',
        phone: '+11234567803',
        email: 'client3@example.com',
        password: hashedPassword,
        firstName: 'Jennifer',
        lastName: 'White',
        gender: 'female',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '300 Buyer Rd',
        zip: '35611',
        image: 'default.female.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
      {
        role: 'client',
        phone: '+11234567804',
        email: 'client4@example.com',
        password: hashedPassword,
        firstName: 'Daniel',
        lastName: 'Harris',
        gender: 'male',
        isEmailVerified: true,
        isPhoneVerified: true,
        cityId: null, // No city assigned
        street: '400 Patron Ln',
        zip: '36201',
        image: 'default.male.png',
        isNewUser: false,
        lang: 'en',
        lat: 0,
        lon: 0,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      },
    ];

    await queryInterface.bulkInsert('Users', users, {});

    console.log('✅ Demo users created successfully!');
    console.log('📧 Login with any user using:');
    console.log('   Phone: +1123456789X (where X is 0-4)');
    console.log('   Password: 1234');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {
      phone: {
        [Sequelize.Op.like]: '+1123456789%'
      }
    }, {});

    console.log('✅ Demo users removed successfully!');
  }
};
