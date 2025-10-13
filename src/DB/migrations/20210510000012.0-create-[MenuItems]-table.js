'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('MenuItems', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      restaurantId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Restaurants',
          key: 'id'
        },
      },
      menuCategoryId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'MenuCategories',
          key: 'id'
        },
      },
      image: {
        type: DataTypes.STRING, allowNull: false, defaultValue: ''
      },
      name: { // upto 20 syms.
        type: DataTypes.STRING, allowNull: false
      },
      description: { // upto 300 syms.
        type: DataTypes.TEXT, allowNull: false
      },
      kcal: { //(up to 5 numeral symbols)
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      },
      proteins: { // (up to 5 numeral symbols)
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      },
      fats: { //(up to 5 numeral symbols)
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      },
      carbs: { //(up to 5 numeral symbols)
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      },
      price: {
        type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
      },
      rating: {
        // ex. (5+4+3+5)/4 = 4.25. 
        // The rate is displayed only when 20 rates were made 
        type: DataTypes.REAL.UNSIGNED, allowNull: false, defaultValue: 0
      },
      isAvailable: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },

      createdAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
    });

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('MenuItems');
  }
};
