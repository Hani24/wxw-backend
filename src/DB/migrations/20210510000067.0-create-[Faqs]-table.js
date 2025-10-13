'use strict';

const { DataTypes } = require('sequelize');

const FAQ_ROLES = require('../dicts/FAQ_ROLES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Faqs', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      role: {
        type: DataTypes.ENUM, required: true, values: FAQ_ROLES,
        defaultValue: FAQ_ROLES[ 0 ],
      },
      q: {
        type: DataTypes.TEXT, allowNull: false, required: true
      },
      a: {
        type: DataTypes.TEXT, allowNull: false, required: true
      },
      isDisabled: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
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
    return queryInterface.dropTable('Faqs');
  }
};
