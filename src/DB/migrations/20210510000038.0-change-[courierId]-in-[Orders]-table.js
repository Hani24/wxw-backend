'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'courierId');
    await queryInterface.addColumn('Orders', 'courierId', {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Couriers',
        key: 'id'
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'courierId');
    await queryInterface.addColumn('Orders', 'courierId', {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Couriers',
        key: 'id'
      },
    });
  }
};
