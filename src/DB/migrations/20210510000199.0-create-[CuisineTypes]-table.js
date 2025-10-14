'use strict';

/**
 * Migration: Create CuisineTypes table
 * Stores master list of cuisine types (e.g., Italian, Mexican, Asian, etc.)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CuisineTypes', {
      id: {
        type: Sequelize.BIGINT(8).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Cuisine type name (e.g., Italian, Mexican, Japanese)',
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'URL-friendly slug for filtering',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '',
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
        comment: 'Image filename for cuisine type',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this cuisine type is active/visible',
      },
      order: {
        type: Sequelize.INTEGER(4).UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order in UI',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('CuisineTypes', ['slug'], {
      name: 'cuisine_types_slug_idx',
    });

    await queryInterface.addIndex('CuisineTypes', ['isActive'], {
      name: 'cuisine_types_is_active_idx',
    });

    console.log('✅ CuisineTypes table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CuisineTypes');
    console.log('✅ CuisineTypes table dropped');
  }
};
