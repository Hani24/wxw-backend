'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('OrderSuppliers', 'checksum', {
        type: DataTypes.STRING, allowNull: true, defaultValue: ''      
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderSuppliers', 'checksum'),
    ]);
  }
};
