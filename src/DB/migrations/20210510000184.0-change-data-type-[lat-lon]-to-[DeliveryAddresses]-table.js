'use strict';

const { DataTypes, QueryTypes } = require('sequelize');

module.exports = {
  up: async(queryInterface, Sequelize) => {

    const _query = `select id, lat, lon from DeliveryAddresses order by id desc`;
    const data = await queryInterface.sequelize.query(_query, {
      type: QueryTypes.SELECT,
      // nest: false,
    });

    await Promise.all([
      queryInterface.removeColumn('DeliveryAddresses', 'lat'),
      queryInterface.removeColumn('DeliveryAddresses', 'lon'),
    ]);

    await Promise.all([
      queryInterface.addColumn('DeliveryAddresses', 'lat', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,      
      }),
      queryInterface.addColumn('DeliveryAddresses', 'lon', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
    ]);

    for( const coord_t of data ){
      const up = await queryInterface.sequelize.query(
        `update DeliveryAddresses set lat=${coord_t.lat}, lon=${coord_t.lon} where id=${coord_t.id}`
      );
      console.log({up});
    }

    // throw Error('break;');

  },
  down: async(queryInterface, Sequelize) => {

    await Promise.all([
      queryInterface.removeColumn('DeliveryAddresses', 'lat'),
      queryInterface.removeColumn('DeliveryAddresses', 'lon'),
    ]);

    await Promise.all([
      queryInterface.addColumn('DeliveryAddresses', 'lat', {
        type: DataTypes.FLOAT, allowNull: false, defaultValue: 0,      
      }),
      queryInterface.addColumn('DeliveryAddresses', 'lon', {
        type: DataTypes.FLOAT, allowNull: false, defaultValue: 0,
      }),
    ]);

  }
};
