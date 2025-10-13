'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('DeliveryAddresses', {
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
      isDefault: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      label: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      city: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      street: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      porch: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      apartment: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      floor: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      description: {
        type: DataTypes.TEXT, allowNull: true, defaultValue: '',
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
    return queryInterface.dropTable('DeliveryAddresses');
  }
};
