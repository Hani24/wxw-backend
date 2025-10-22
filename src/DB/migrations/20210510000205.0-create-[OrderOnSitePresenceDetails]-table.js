'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('OrderOnSitePresenceDetails', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      orderId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        unique: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Orders',
          key: 'id'
        },
      },

      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        required: true,
      },

      eventStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },

      eventEndTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },

      numberOfPeople: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        required: true,
      },

      numberOfHours: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        required: true,
      },

      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      estimatedBasePrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      },

      estimatedServiceFee: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      },

      estimatedTotalPrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      },

      restaurantAcceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      restaurantRejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      acceptanceDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    }).then(() => {
      // Add indexes for faster queries
      return queryInterface.addIndex('OrderOnSitePresenceDetails', {
        fields: ['orderId'],
        unique: true,
        name: 'unique_order_on_site_presence'
      });
    }).then(() => {
      return queryInterface.addIndex('OrderOnSitePresenceDetails', {
        fields: ['eventDate'],
        name: 'idx_event_date'
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OrderOnSitePresenceDetails');
  }
};
