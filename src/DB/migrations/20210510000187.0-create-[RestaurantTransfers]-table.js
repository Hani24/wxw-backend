'use strict';

const { DataTypes } = require('sequelize');
const TRANSFER_STATUSES = require('../dicts/TRANSFER_STATUSES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('RestaurantTransfers', {
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
      status: {
        type: Sequelize.ENUM, required: true, values: TRANSFER_STATUSES,
        defaultValue: TRANSFER_STATUSES[ 0 ],
      },
      amount: {
        type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
      },
      // [stripe:owner] to [stripe:restaurant]
      isTransfered: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      transferedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      // [stripe]:[internal]:[external]    
      transferId: {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      },
      transferError: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: ''
      },
      // [stripe:restaurant] to [bank:restaurant]
      isPaidOut: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      paidOutAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      paidOutError: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: ''
      },
      payoutId: {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      },
      isInited: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      initedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
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
    return queryInterface.dropTable('RestaurantTransfers');
  }
};
