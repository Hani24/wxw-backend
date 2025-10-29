'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('OrderCateringDetails', {
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
        comment: 'Date of the catering event',
      },

      eventStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
        comment: 'Start time of the event',
      },

      eventEndTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
        comment: 'End time of the event',
      },

      deliveryMethod: {
        type: DataTypes.ENUM('pickup', 'drop-off'),
        allowNull: false,
        required: true,
        comment: 'Pickup or drop-off',
      },

      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Event location address (required if drop-off)',
      },

      deliveryLatitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
      },

      deliveryLongitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        defaultValue: null,
      },

      estimatedTotalPeople: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Calculated from menu items (sum of feedsPeople * quantity)',
      },

      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Special dietary requirements, setup instructions, etc.',
      },

      estimatedBasePrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total price of all menu items',
      },

      estimatedServiceFee: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '15% service fee',
      },

      estimatedTotalPrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Base price + service fee',
      },

      // Payment Schedule - Split Payments
      firstPaymentAmount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '50% of total - non-refundable',
      },

      firstPaymentDueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '10 days before event',
      },

      firstPaymentPaidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'When first payment was charged',
      },

      firstPaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        comment: 'Stripe payment intent ID for first payment',
      },

      secondPaymentAmount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Remaining 50% - non-refundable',
      },

      secondPaymentDueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '3 days before event',
      },

      secondPaymentPaidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'When second payment was charged',
      },

      secondPaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        comment: 'Stripe payment intent ID for second payment',
      },

      // Restaurant Acceptance
      restaurantAcceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'When restaurant accepted the catering order',
      },

      restaurantRejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'When restaurant rejected the catering order',
      },

      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Reason for rejection',
      },

      acceptanceDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: '24 hours from order creation',
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
      // Add unique index on orderId
      return queryInterface.addIndex('OrderCateringDetails', {
        fields: ['orderId'],
        unique: true,
        name: 'unique_order_catering'
      });
    }).then(() => {
      // Add index on eventDate for faster date range queries
      return queryInterface.addIndex('OrderCateringDetails', {
        fields: ['eventDate'],
        name: 'idx_catering_event_date'
      });
    }).then(() => {
      // Add index on payment due dates for cron job queries
      return queryInterface.addIndex('OrderCateringDetails', {
        fields: ['firstPaymentDueDate', 'firstPaymentPaidAt'],
        name: 'idx_first_payment_due'
      });
    }).then(() => {
      return queryInterface.addIndex('OrderCateringDetails', {
        fields: ['secondPaymentDueDate', 'secondPaymentPaidAt'],
        name: 'idx_second_payment_due'
      });
    }).then(() => {
      // Add index on acceptance deadline for cron job
      return queryInterface.addIndex('OrderCateringDetails', {
        fields: ['acceptanceDeadline'],
        name: 'idx_acceptance_deadline'
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OrderCateringDetails');
  }
};
