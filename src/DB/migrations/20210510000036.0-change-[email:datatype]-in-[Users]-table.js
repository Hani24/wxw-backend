'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'email', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null, unique: false,
      }),
      queryInterface.removeIndex('Users', 'email'),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'email', {
        type: DataTypes.STRING, allowNull: false, unique: true,
      }),
      // queryInterface.addIndex('Users', 'email', {
      //   unique: true
      // }),
    ]);
  }
};
