'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn(
      'OrderOnSitePresenceDetails',
      'firstPaymentAmount',
      {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '50% of total - non-refundable',
      }
    ).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'firstPaymentDueDate',
        {
          type: DataTypes.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: '10 days before event',
        }
      );
    }).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'firstPaymentPaidAt',
        {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'When first payment was charged',
        }
      );
    }).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'firstPaymentIntentId',
        {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
          comment: 'Stripe payment intent ID for first payment',
        }
      );
    }).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'secondPaymentAmount',
        {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: false,
          defaultValue: 0,
          comment: 'Remaining 50% - non-refundable',
        }
      );
    }).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'secondPaymentDueDate',
        {
          type: DataTypes.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: '3 days before event',
        }
      );
    }).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'secondPaymentPaidAt',
        {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'When second payment was charged',
        }
      );
    }).then(() => {
      return queryInterface.addColumn(
        'OrderOnSitePresenceDetails',
        'secondPaymentIntentId',
        {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
          comment: 'Stripe payment intent ID for second payment',
        }
      );
    }).then(() => {
      // Add index on firstPaymentDueDate for payment processing queries
      return queryInterface.addIndex('OrderOnSitePresenceDetails', {
        fields: ['firstPaymentDueDate'],
        name: 'idx_first_payment_due_date'
      });
    }).then(() => {
      // Add index on secondPaymentDueDate for payment processing queries
      return queryInterface.addIndex('OrderOnSitePresenceDetails', {
        fields: ['secondPaymentDueDate'],
        name: 'idx_second_payment_due_date'
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OrderOnSitePresenceDetails', 'firstPaymentAmount')
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'firstPaymentDueDate'))
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'firstPaymentPaidAt'))
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'firstPaymentIntentId'))
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'secondPaymentAmount'))
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'secondPaymentDueDate'))
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'secondPaymentPaidAt'))
      .then(() => queryInterface.removeColumn('OrderOnSitePresenceDetails', 'secondPaymentIntentId'))
      .then(() => queryInterface.removeIndex('OrderOnSitePresenceDetails', 'idx_first_payment_due_date'))
      .then(() => queryInterface.removeIndex('OrderOnSitePresenceDetails', 'idx_second_payment_due_date'));
  }
};
