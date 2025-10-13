'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('CourierWithdrawRequests', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      courierId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Couriers',
          key: 'id'
        },
      },
      amount: {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
      },
      cardHolderName: {
        type: DataTypes.TEXT, allowNull: false, required: true
      },
      cardNumber: {
        type: DataTypes.TEXT, allowNull: false, required: true
      },
      // cardExpiryDate: {
      //   type: DataTypes.TEXT, allowNull: false, required: true
      // },
      // cardCVV: {
      //   type: DataTypes.TEXT, allowNull: false, required: true
      // },
      isAccepted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      },
      acceptedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isRejected: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      },
      rejectedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      rejectionReason: {
        type: DataTypes.TEXT, allowNull: true, defaultValue: ''
      },
      isCompleted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      },
      completedAt: {
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
    return queryInterface.dropTable('CourierWithdrawRequests');
  }
};
