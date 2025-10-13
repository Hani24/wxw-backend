'use strict';

const { DataTypes } = require('sequelize');
const ORDER_STATUSES = require('../dicts/ORDER_STATUSES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Orders', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      clientId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Clients',
          key: 'id'
        },
      },
      courierId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Couriers',
          key: 'id'
        },
      },
      status: {
        type: Sequelize.ENUM, required: true, values: ORDER_STATUSES,
        defaultValue: ORDER_STATUSES[ 0 ],
      },
      totalPrice: {
        type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
      },
      totalItems: {
        type: DataTypes.INTEGER, allowNull: false, defaultValue: 0
      },
      isDeliveredByCourier: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      deliveredByCourierAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isCourierRatedByClient: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      courierRatedByClientAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      courierRating: { // 0-5
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 0
      },
      isRejectedByClient: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      rejectedByClientAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      rejectionReason: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: ''
      },
      // 'Client didn't get in touch' ???
      // isClient: {
      //   type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      // },

      createdAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
    }, {
      initialAutoIncrement: '10000000000'
    });

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Orders');
  }
};
