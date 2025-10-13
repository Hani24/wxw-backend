'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'region'),
      queryInterface.removeColumn('Users', 'country'),
      queryInterface.removeColumn('Users', 'city'),
      queryInterface.addColumn('Users', 'cityId', {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: true,
        required: false,
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
      queryInterface.removeColumn('Users', 'cityId'),
      queryInterface.addColumn('Users', 'region', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.addColumn('Users', 'country', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.addColumn('Users', 'city', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  }

};
