'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryAddresses', 'city'),
      queryInterface.addColumn('DeliveryAddresses', 'cityId', {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
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
      queryInterface.removeColumn('DeliveryAddresses', 'cityId'),
      queryInterface.addColumn('DeliveryAddresses', 'city', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  }
};
