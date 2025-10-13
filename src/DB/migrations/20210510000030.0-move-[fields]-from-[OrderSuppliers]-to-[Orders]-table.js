'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return Promise.all([
      // from
      queryInterface.removeColumn('OrderSuppliers', 'discountAmount'),
      queryInterface.removeColumn('OrderSuppliers', 'discountCode'),

      // to
      queryInterface.addColumn('Orders', 'discountAmount', {
        type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
      }),
      queryInterface.addColumn('Orders', 'discountCode', {
        type: DataTypes.STRING, allowNull: false, defaultValue: ''
      }),
    ]);

  },
  down: (queryInterface, Sequelize) => {

    return Promise.all([
      // from
      queryInterface.removeColumn('Orders', 'discountAmount'),
      queryInterface.removeColumn('Orders', 'discountCode'),

      // to
      queryInterface.addColumn('OrderSuppliers', 'discountAmount', {
        type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
      }),
      queryInterface.addColumn('OrderSuppliers', 'discountCode', {
        type: DataTypes.STRING, allowNull: false, defaultValue: ''
      }),
    ]);

  }
};
