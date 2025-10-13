'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Orders', 'paymentIntentId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Orders', 'clientSecret', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Orders', 'paymentIntentId', {
        type: DataTypes.TEXT, allowNull: true, defaultValue: null
      }),
      queryInterface.removeColumn('Orders', 'clientSecret'),
    ]);
  }
};
