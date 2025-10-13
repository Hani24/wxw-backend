'use strict';

const { DataTypes } = require('sequelize');

const DELIVERY_DAYS = require('../dicts/DELIVERY_DAYS');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.changeColumn('OrderDeliveryTimes', 'deliveryDay', {
      type: DataTypes.ENUM, required: true, values: DELIVERY_DAYS,
      defaultValue: DELIVERY_DAYS[ 0 ],
    }).catch((e)=>{
      console.log(`e: ${e.message}`);
    })

  },
  down: (queryInterface, Sequelize) => {

  }
};
