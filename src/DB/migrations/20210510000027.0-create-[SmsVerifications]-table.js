'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('SmsVerifications', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },
      // userId: {
      //   type: DataTypes.INTEGER(11).UNSIGNED,
      //   allowNull: false,
      //   required: true,
      //   onUpdate: 'CASCADE',
      //   onDelete: 'CASCADE',
      //   references: {
      //     model: 'Users',
      //     key: 'id'
      //   },
      // },
      phone: {
        type: DataTypes.STRING, allowNull: false, required: true,
      },
      code: {
        type: DataTypes.STRING, allowNull: false, required: true,
      },
      maxAge: {
        type: DataTypes.INTEGER(11).UNSIGNED, allowNull: true, defaultValue: 0,
      },
      isExpired: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      isUsed: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      ip: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
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
    return queryInterface.dropTable('SmsVerifications');
  }
};
