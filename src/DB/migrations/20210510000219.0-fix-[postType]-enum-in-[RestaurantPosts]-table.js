'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old column and recreate with correct ENUM
    await queryInterface.removeColumn('RestaurantPosts', 'postType');

    await queryInterface.addColumn('RestaurantPosts', 'postType', {
      type: Sequelize.ENUM('post', 'event'),
      allowNull: false,
      defaultValue: 'post',
      after: 'image'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('RestaurantPosts', 'postType');

    await queryInterface.addColumn('RestaurantPosts', 'postType', {
      type: Sequelize.ENUM('post', 'event'),
      allowNull: false,
      defaultValue: 'post',
      after: 'image'
    });
  }
};
