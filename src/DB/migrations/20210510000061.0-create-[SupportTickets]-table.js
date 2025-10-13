'use strict';

const { DataTypes } = require('sequelize');

const USER_ROLES = require('../dicts/USER_ROLES');
const SUPPORT_TICKET_TYPES = require('../dicts/SUPPORT_TICKET_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('SupportTickets', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      userId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id'
        },
      },
      orderId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: true,
        required: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Orders',
          key: 'id'
        },
      },
      userType: {
        type: DataTypes.ENUM, required: true, values: USER_ROLES,
        defaultValue: USER_ROLES[ 0 ],
      },
      type: {
        type: DataTypes.ENUM, required: true, values: SUPPORT_TICKET_TYPES,
        defaultValue: SUPPORT_TICKET_TYPES[ 0 ],
      },
      message: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: '',
      },
      isRead: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,
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
    return queryInterface.dropTable('SupportTickets');
  }
};
