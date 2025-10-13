'use strict';

const { DataTypes } = require('sequelize');
const PAYMENT_TYPES = require('../dicts/PAYMENT_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('ClientPaymentSettings', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      clientId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Clients',
          key: 'id'
        },
      },
      type: {
        type: Sequelize.ENUM, required: true, values: PAYMENT_TYPES,
        defaultValue: PAYMENT_TYPES[ 0 ],
      },
      paymentCardId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: true,
        required: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'PaymentCards',
          key: 'id'
        },
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
    return queryInterface.dropTable('ClientPaymentSettings');
  }
};
