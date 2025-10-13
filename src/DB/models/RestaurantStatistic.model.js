const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const RESTAURANT_TYPES = App.getDictByName('RESTAURANT_TYPES');

  const Model = sequelize.define( exportModelWithName, {
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    totalOrders:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalAcceptedOrders:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalCanceledOrders:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalIncomeInCent:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalPreparationTimeInSeconds:{
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
    },
  });

  Model.getChartByIdAndDateRange = async function( restaurantId, dateFrom=false, dateUpto=false ) {

    console.log(` #RestaurantStatistic:getChartByIdAndDateRange: resto: ${restaurantId}, dateFrom: ${dateFrom}, dateUpto: ${dateUpto}`);

    let startOfDate = false; 
    let endOfDate = false;

    if( !App.DT.isValidDate(dateFrom) || !App.DT.isValidDate(dateUpto) ){
      startOfDate = App.DT.moment().subtract(7,'days').format(App.getDateFormat());
      endOfDate = App.DT.moment().format(App.getDateFormat());
      console.debug(`#getChartByIdAndDateRange: using default [range] of [1 week] from [now]`);

    }else{
      startOfDate = App.DT.getStartOf( `${dateFrom}T12:00:00`, 'day', true );
      endOfDate = App.DT.getEndOf( `${dateUpto}T12:00:00`, 'day', true );

    }

    console.debug({getChartByIdAndDateRange: {startOfDate, endOfDate}});
    const mRestaurantStatistics = await App.getModel('RestaurantStatistic').findAndCountAll({
      where: {
        restaurantId,
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
      // attributes: { exclude: ['restaurantId','updatedAt'] },
      order: [['id','asc']]
    });

    mRestaurantStatistics.rows = mRestaurantStatistics.rows.map((mState)=>{
      mState.dataValues.avgTotalPreparationTimeInSeconds = 
        ( mState.totalPreparationTimeInSeconds > 0 && mState.totalOrders > 0 )
          ? Math.floor(mState.totalPreparationTimeInSeconds / mState.totalOrders)
          : 0;

      return mState;
    });

    mRestaurantStatistics.dateRange = {
      startOfDate,
      endOfDate,
    };

    return mRestaurantStatistics;

  }

  Model.getStateFromChartData = async function(mRestaurantStatistics){

    console.log(`#RestaurantStatistic:getStateFromChartData:`);

    const mainState = {
      totalOrders: 0,
      totalAcceptedOrders: 0,
      totalCanceledOrders: 0,
      totalIncomeInCent: 0,
      totalPreparationTimeInSeconds: 0,
      avgTotalPreparationTimeInSeconds: 0,
    };

    if( !App.isObject(mRestaurantStatistics) || !App.isArray(mRestaurantStatistics.rows) )
      return mainState;

    mRestaurantStatistics.rows = mRestaurantStatistics.rows.map((mState)=>{
      mainState.totalOrders += mState.totalOrders;
      mainState.totalAcceptedOrders += mState.totalAcceptedOrders;
      mainState.totalCanceledOrders += mState.totalCanceledOrders;
      mainState.totalIncomeInCent += mState.totalIncomeInCent;
      mainState.totalPreparationTimeInSeconds += mState.totalPreparationTimeInSeconds;

      if( mState.totalPreparationTimeInSeconds > 0 && mState.totalOrders > 0 )
        mState.dataValues.avgTotalPreparationTimeInSeconds
          = Math.floor(mState.totalPreparationTimeInSeconds / mState.totalOrders);

      return mState;

    });

    if( mainState.totalPreparationTimeInSeconds > 0 && mainState.totalOrders > 0 )
      mainState.avgTotalPreparationTimeInSeconds 
        = Math.floor(mainState.totalPreparationTimeInSeconds / mainState.totalOrders);

    return mainState;

  }

  Model.getStateFromGlobalData = async function(mRestaurant){

    console.log(`#RestaurantStatistic:getStateFromGlobalData: resto: ${mRestaurant.id}, ${mRestaurant.name} `);

    const mainState = {
      totalOrders: 0,
      totalAcceptedOrders: 0,
      totalCanceledOrders: 0,
      totalIncomeInCent: 0,
      totalPreparationTimeInSeconds: 0,
      avgTotalPreparationTimeInSeconds: 0,
    };

    if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
      return mainState;

    mainState.totalOrders = mRestaurant.totalOrders;
    mainState.totalAcceptedOrders = mRestaurant.totalAcceptedOrders;
    mainState.totalCanceledOrders = mRestaurant.totalCanceledOrders;
    mainState.totalIncomeInCent = mRestaurant.totalIncomeInCent;
    mainState.totalPreparationTimeInSeconds = mRestaurant.totalPreparationTimeInSeconds;

    if( mainState.totalPreparationTimeInSeconds > 0 && mainState.totalOrders > 0 )
      mainState.avgTotalPreparationTimeInSeconds 
        = Math.floor(mainState.totalPreparationTimeInSeconds / mainState.totalOrders);

    return mainState;

  }

  return Model;

}
