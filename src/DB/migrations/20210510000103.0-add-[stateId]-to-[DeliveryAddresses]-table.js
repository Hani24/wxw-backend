'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryAddresses', 'stateId', {
        type: DataTypes.BIGINT(8).UNSIGNED,
        // !!! allow to be null
        allowNull: true, // <== true
        required: false, // <== false
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'States',
          key: 'id'
        },
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryAddresses', 'stateId'),
    ]);
  }
};
