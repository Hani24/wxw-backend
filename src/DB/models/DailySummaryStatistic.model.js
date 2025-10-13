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

  Model.getChartByDateRange = async function( dateFrom=false, dateUpto=false ) {

    console.log(` #DailySummaryStatistic:getChartByDateRange: dateFrom: ${dateFrom}, dateUpto: ${dateUpto}`);

    let startOfDate = false; 
    let endOfDate = false;

    if( !App.DT.isValidDate(dateFrom) || !App.DT.isValidDate(dateUpto) ){
      startOfDate = App.DT.moment().subtract(7,'days').format(App.getDateFormat());
      endOfDate = App.DT.moment().format(App.getDateFormat());
      console.debug(`#getChartByDateRange: using default [range] of [1 week] from [now]`);

    }else{
      startOfDate = App.DT.getStartOf( `${dateFrom}T12:00:00`, 'day', true );
      endOfDate = App.DT.getEndOf( `${dateUpto}T12:00:00`, 'day', true );
    }

    console.debug({getChartByDateRange: {startOfDate, endOfDate}});
    const mDailySummaryStatistics = await Model.findAndCountAll({
      where: {
        createdAt: {
          [App.DB.Op.between]: [ startOfDate, endOfDate ],
        },
      },
      attributes: [
        'id',
        'totalOrders','totalAcceptedOrders','totalCanceledOrders','totalIncomeInCent','totalPreparationTimeInSeconds',
        // [ App.DB.literal('sum(totalPreparationTimeInSeconds) / count(id)'), 'avgTotalPreparationTimeInSeconds' ],
        'createdAt'
      ],
      order: [['id','asc']]
    });

    mDailySummaryStatistics.rows = mDailySummaryStatistics.rows.map((mState)=>{
      mState.dataValues.avgTotalPreparationTimeInSeconds = 
        ( mState.totalPreparationTimeInSeconds > 0 && mState.totalOrders > 0 )
          ? Math.floor(mState.totalPreparationTimeInSeconds / mState.totalOrders)
          : 0;

      return mState;
    });

    mDailySummaryStatistics.dateRange = {
      startOfDate,
      endOfDate,
    };

    return mDailySummaryStatistics;

  }

  Model.getStateFromChartData = async function(mDailySummaryStatistics){

    console.log(` #DailySummaryStatistic:getStateFromChartData: `);

    const mainState = {
      totalOrders: 0,
      totalAcceptedOrders: 0,
      totalCanceledOrders: 0,
      totalIncomeInCent: 0,
      totalPreparationTimeInSeconds: 0,
      avgTotalPreparationTimeInSeconds: 0,
      // totalClients: 0,
      // totalCouriers: 0,
      // totalEmployees: 0,
      // totalManagers: 0,
      // totalRestaurants: 0,
    };

    if( !App.isObject(mDailySummaryStatistics) || !App.isArray(mDailySummaryStatistics.rows) )
      return mainState;

    mDailySummaryStatistics.rows.map((mState)=>{
      mainState.totalOrders += mState.totalOrders;
      mainState.totalAcceptedOrders += mState.totalAcceptedOrders;
      mainState.totalCanceledOrders += mState.totalCanceledOrders;
      mainState.totalIncomeInCent += mState.totalIncomeInCent;
      mainState.totalPreparationTimeInSeconds += mState.totalPreparationTimeInSeconds;
      // mainState.totalClients += mState.totalClients;
      // mainState.totalCouriers += mState.totalCouriers;
      // mainState.totalEmployees += mState.totalEmployees;
      // mainState.totalManagers += mState.totalManagers;
      // mainState.totalRestaurants += mState.totalRestaurants;
    });

    if( mainState.totalPreparationTimeInSeconds > 0 && mainState.totalOrders > 0 )
      mainState.avgTotalPreparationTimeInSeconds 
        = Math.floor(mainState.totalPreparationTimeInSeconds / mainState.totalOrders);

    return mainState;

  }

  Model.getStateFromGlobalData = async function(){
    console.log(` #DailySummaryStatistic:getStateFromGlobalData: => #GlobalSummaryStatistic:getLatestStatistic`);
    return await App.getModel('GlobalSummaryStatistic').getLatestStatistic();
  }

  return Model;

}
