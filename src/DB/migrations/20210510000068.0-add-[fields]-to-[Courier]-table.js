'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Couriers', 'hasActiveOrder', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
      queryInterface.addColumn('Couriers', 'activeOrderAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Couriers', 'activeOrderId', {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: true,
        required: false,
        // onUpdate: 'CASCADE',
        // onDelete: 'CASCADE',
        defaultValue: null,
        references: {
          model: 'Orders',
          key: 'id'
        },
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Couriers', 'hasActiveOrder'),
      queryInterface.removeColumn('Couriers', 'activeOrderAt'),
      queryInterface.removeColumn('Couriers', 'activeOrderId'),
    ]);
  }
};
