'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [inner][stripe]
      queryInterface.addColumn('Couriers', 'accountId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Couriers', 'personId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Couriers', 'isKycCompleted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
      queryInterface.addColumn('Couriers', 'kycCompletedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),

    ]);
  },
  down: async (queryInterface, Sequelize) => {
    try{ await queryInterface.removeColumn('Couriers', 'accountId'); }catch(e){}
    try{ await queryInterface.removeColumn('Couriers', 'personId'); }catch(e){}
    try{ await queryInterface.removeColumn('Couriers', 'isKycCompleted'); }catch(e){}
    try{ await queryInterface.removeColumn('Couriers', 'kycCompletedAt'); }catch(e){}
  }
};
