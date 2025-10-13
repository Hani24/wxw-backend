'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('CourierWithdrawSettings', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      isEnabled: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true,
      },
      minAmount: {
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true, defaultValue: 5,
      },
      maxAmount: {
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true, defaultValue: 0, // 0 === +Infinity
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
    return queryInterface.dropTable('CourierWithdrawSettings');
  }
};
