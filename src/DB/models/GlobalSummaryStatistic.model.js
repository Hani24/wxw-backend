const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    totalClients:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalCouriers:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalEmployees:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalManagers:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalRestaurants:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalAcceptedOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalCanceledOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalIncomeInCent:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalPreparationTimeInSeconds:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
  });

  Model.getLatestStatistic = async function() {

    console.log(` #GlobalSummaryStatistic:getLatestStatistic:`);

    if( (await Model.getTotal()) <= 0 ){
      const mModel = await Model.create();
      if( !App.isObject(mModel) ){
        console.error(` Could not create default [GlobalSummaryStatistic] model`);
        // return some valid structure
        return {
          totalOrders: 0,
          totalAcceptedOrders: 0,
          totalCanceledOrders: 0,
          totalIncomeInCent: 0,
          totalPreparationTimeInSeconds: 0,
          // totalClients: 0,
          // totalCouriers: 0,
          // totalEmployees: 0,
          // totalManagers: 0,
          // totalRestaurants: 0,
        };
      }
    }

    const mGlobalSummaryStatistic = await Model.findOne({
      attributes: { exclude: [
        'totalClients','totalCouriers','totalEmployees','totalManagers','totalRestaurants',
        'updatedAt'
      ]},
      order: [['id','asc']]
    });

    mGlobalSummaryStatistic.dataValues.avgTotalPreparationTimeInSeconds = 
      ( mGlobalSummaryStatistic.totalPreparationTimeInSeconds > 0 && mGlobalSummaryStatistic.totalOrders > 0 )
        ? Math.floor(mGlobalSummaryStatistic.totalPreparationTimeInSeconds / mGlobalSummaryStatistic.totalOrders)
        : 0;

    return mGlobalSummaryStatistic;

  }

  return Model;

}
