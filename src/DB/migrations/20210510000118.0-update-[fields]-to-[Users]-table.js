'use strict';

const { DataTypes } = require('sequelize');

const USER_ROLES = require('../dicts/USER_ROLES');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'role', {
        type: DataTypes.ENUM, required: true, values: USER_ROLES,
        defaultValue: USER_ROLES[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  }
};
