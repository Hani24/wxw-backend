'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async(queryInterface, Sequelize) => {
    // requested by the client 
    const autoIncrement = await queryInterface.sequelize.query(
      // `ALTER TABLE Orders AUTO_INCREMENT = 10000000000`
      `ALTER TABLE Orders MODIFY id BIGINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=10000000000;`
    );
  },
  down: (queryInterface, Sequelize) => {
    // return queryInterface.dropTable('Orders');
  }
};
