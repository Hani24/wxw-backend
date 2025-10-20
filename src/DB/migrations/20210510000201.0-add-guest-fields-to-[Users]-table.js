'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'isGuest', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }),
      queryInterface.addColumn('Users', 'guestToken', {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn('Users', 'guestExpiresAt', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }),
      // Add index for guest token lookup
      queryInterface.addIndex('Users', ['guestToken'], {
        name: 'idx_users_guest_token',
        unique: false
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('Users', 'idx_users_guest_token'),
      queryInterface.removeColumn('Users', 'isGuest'),
      queryInterface.removeColumn('Users', 'guestToken'),
      queryInterface.removeColumn('Users', 'guestExpiresAt')
    ]);
  }
};
