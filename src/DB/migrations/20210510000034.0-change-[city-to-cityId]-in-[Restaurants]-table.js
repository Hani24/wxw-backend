'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'country'),
      queryInterface.removeColumn('Restaurants', 'city'),
      queryInterface.addColumn('Restaurants', 'cityId', {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: true,
        required: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Cities',
          key: 'id'
        },
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'cityId'),
      queryInterface.addColumn('Restaurants', 'city', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.addColumn('Restaurants', 'country', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  }
};
