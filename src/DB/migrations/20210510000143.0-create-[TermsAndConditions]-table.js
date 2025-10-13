'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('TermsAndConditions', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      sectionTitle: {
        type: DataTypes.STRING, allowNull: false, defaultValue: 'Terms and conditions'
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
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
    return queryInterface.dropTable('TermsAndConditions');
  }
};
