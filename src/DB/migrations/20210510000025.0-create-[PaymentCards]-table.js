'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('PaymentCards', {
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
      encCardHolderName: {
        type: DataTypes.TEXT, allowNull: false 
      },
      encCardNumber: {
        type: DataTypes.TEXT, allowNull: false 
      },
      encCardExpiryDate: {
        type: DataTypes.TEXT, allowNull: false 
      },
      encCardCVV: {
        type: DataTypes.TEXT, allowNull: false 
      },
      isUsedInPayment: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      },
      lastUsedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      },
      deletedAt: {
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
    return queryInterface.dropTable('PaymentCards');
  }
};
