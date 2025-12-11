'use strict';

const { DataTypes } = require('sequelize');

// This migration makes the phone field nullable to support email-based authentication
// Users authenticating with Google/email won't have a phone number initially

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'phone', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        unique: false,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'phone', {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      }),
    ]);
  }
};
