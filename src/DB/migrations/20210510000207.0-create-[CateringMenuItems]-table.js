'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('CateringMenuItems', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      menuItemId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        unique: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'MenuItems',
          key: 'id'
        },
      },

      feedsPeople: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        required: true,
        defaultValue: 1,
        comment: 'Number of people this menu item feeds',
      },

      minimumQuantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        comment: 'Minimum quantity required for catering orders',
      },

      leadTimeDays: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Days of advance notice required for this item',
      },

      isAvailableForCatering: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this item is available for catering orders',
      },

      cateringPrice: {
        type: DataTypes.DECIMAL(8,2),
        allowNull: true,
        defaultValue: null,
        comment: 'Optional catering-specific price (if different from regular menu price)',
      },

      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },

      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    }).then(() => {
      // Add unique index on menuItemId
      return queryInterface.addIndex('CateringMenuItems', {
        fields: ['menuItemId'],
        unique: true,
        name: 'unique_menu_item_catering'
      });
    }).then(() => {
      // Add index on isAvailableForCatering for faster queries
      return queryInterface.addIndex('CateringMenuItems', {
        fields: ['isAvailableForCatering'],
        name: 'idx_catering_availability'
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CateringMenuItems');
  }
};
