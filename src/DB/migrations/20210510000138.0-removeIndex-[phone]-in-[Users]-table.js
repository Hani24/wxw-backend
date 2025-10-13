'use strict';

const { DataTypes } = require('sequelize');

// -- ALTER TABLE morris_ams_db.`Users` DROP INDEX phone;
// -- CREATE INDEX phone ON morris_ams_db.`Users` ( phone );
// explain Users;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('Users', 'phone'), {
        unique: true
      },
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('Users', 'phone', {
        unique: true
      }),
    ]);
  }
};
