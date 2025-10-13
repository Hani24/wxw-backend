// select 
// sum(totalOrders),  
// sum(totalAcceptedOrders),  
// sum(totalCanceledOrders),  
// sum(totalIncomeInCent),  
// sum(totalPreparationTimeInSeconds)
// from DailySummaryStatistics;

// select * from GlobalSummaryStatistics;

module.exports = async (App, params={}, task='')=>{

  try{

    // NOTE: runs once @ server start up
    // recreate statistic from data from the past [all]

    console.ok(` #post-boot: [${task}]: start`);
    
    if( (await App.getModel('GlobalSummaryStatistic').getTotal()) > 0 ){
      console.warn(` #post-boot: [${task}]: disabled`);
      return true;
    }

    // App.DT.fromDatetime()
    // const hist = App.DT.getStartOf( '2021-01-02T00:00:00', 'day').add(1, 'days');
    // return;
    // 'MMMM Do YYYY, h:mm:ss a'
    const statuses = await App.getModel('Order').getStatuses();
    const datetime_t = App.DT.moment().add(1,'days'); // .format( App.getDateFormat() )
    let baseDate = App.DT.moment('2021-10-01T00:00:00').add(1, 'days'); // .format( App.getDateFormat() );

    await App.getModel('RestaurantStatistic').truncate();
    await App.getModel('GlobalSummaryStatistic').truncate();
    await App.getModel('DailySummaryStatistic').truncate();
    await App.getModel('Restaurant').update({
      totalOrders: 0,
      totalAcceptedOrders: 0,
      totalCanceledOrders: 0,
      totalIncomeInCent: 0,
      totalPreparationTimeInSeconds: 0,
    },{where: {}});

    const mGlobalSummaryStatistic = await App.getModel('GlobalSummaryStatistic').getLatestStatistic();
    const mRestaurants = await App.getModel('Restaurant').findAll({
      where: {isDeleted: false, isRestricted: false, isVerified: true},
      attributes: ['id'],
    });


    while( baseDate < datetime_t ){

      // console.line();

      const dateFrom = baseDate.format( App.getDateFormat() );
      const dateUpto = baseDate.add(1,'days').format( App.getDateFormat() );
      // console.log({ baseDate: baseDate.format( App.getDateFormat() ), dateFrom, dateUpto, });
      const createdAt = dateFrom;

      const mOrders = await App.getModel('Order').findAll({
        where: { 
          status: { [App.DB.Op.in]: ['delivered','canceled','refunded'] },
          // isPaid: true,
          // isRefunded: false,
          createdAt: {
            [App.DB.Op.between]: [ dateFrom, dateUpto ],
          },
        },
        attributes: [
          'status', 
          // 'totalPrice', 'finalPrice', 'totalItems', 
          'isDeliveredByCourier', 'isCanceledByClient',
          'allSuppliersHaveConfirmed', 
          'isPaid','paidAt',
          'isRefunded',
          // [ App.DB.literal('count(id)'), '_totalOrders' ],
          // [ App.DB.literal('count(totalItems)'), '_totalItems' ],
          // [ App.DB.literal('sum(totalPrice)'), '_totalIncomeInCent' ],
          'createdAt',
        ],
        distinct: true,
        include: [{
          model: App.getModel('OrderSupplier'),
          required: true,
          where: { 
            // isOrderReady: true,
          },
          attributes: [
            'id',
            'restaurantId',
            'totalPrice',
            'totalItems',
            'isOrderReady','orderReadyAt',
            'isAcceptedByRestaurant',
            'isCanceledByRestaurant',
          ],
          include: [{
            required: true,
            model: App.getModel('Restaurant'),
            where: { 
              // isOrderReady: true,
              isDeleted: false, isRestricted: false, isVerified: true,
            },
            attributes: [
              'id','name',
              // 'totalIncomeInCent','totalOrders','totalAcceptedOrders','totalCanceledOrders','totalPreparationTimeInSeconds',
            ]
          }],
        }],
        order: [['id','asc']],
        // limit: 20,
      });

      console.log(` #post-boot: [${task}]: using date range: from: ${dateFrom} => ${dateUpto}`);

      const orderSuppliersDailyData = {};

      const dailyData = {
        totalOrders: 0,
        totalAcceptedOrders: 0,
        totalCanceledOrders: 0,
        totalIncomeInCent: 0,
        totalPreparationTimeInSeconds: 0,
      };

      for( const mOrder of mOrders ){

        for( const mOrderSupplier of mOrder.OrderSuppliers ){

          if( !orderSuppliersDailyData.hasOwnProperty( mOrderSupplier.restaurantId ) ){
            orderSuppliersDailyData[ mOrderSupplier.restaurantId ] = {
              restaurantId: mOrderSupplier.restaurantId,
              totalOrders: 0,
              totalAcceptedOrders: 0,
              totalCanceledOrders: 0,
              totalIncomeInCent: 0,
              totalPreparationTimeInSeconds: 0,
              createdAt,
            };
          }

          orderSuppliersDailyData[ mOrderSupplier.restaurantId ].totalOrders++;

          if( mOrderSupplier.isAcceptedByRestaurant )
            orderSuppliersDailyData[ mOrderSupplier.restaurantId ].totalAcceptedOrders++;

          if( mOrder.status === statuses.canceled && mOrder.isCanceledByRestaurant /* || mOrder.status === statuses.refunded */ ){
            orderSuppliersDailyData[ mOrderSupplier.restaurantId ].totalCanceledOrders++;
          }else{
            // delivered
            if( mOrderSupplier.isOrderReady ){
              orderSuppliersDailyData[ mOrderSupplier.restaurantId ].totalIncomeInCent 
                += App.isNumber(mOrderSupplier.totalPrice) ? mOrderSupplier.totalPrice : 0;
            }
          }

          const diffTime_t = mOrderSupplier.isOrderReady 
            ? Math.floor(((new Date(mOrderSupplier.orderReadyAt)) - (new Date(mOrder.paidAt)))/1000)
            : 0;

          orderSuppliersDailyData[ mOrderSupplier.restaurantId ].totalPreparationTimeInSeconds 
            += App.isNumber(diffTime_t) ? diffTime_t : 0;

        }
      }

      for(const mRestaurant of mRestaurants ){
        // console.log(orderSuppliersDailyData[ mRestaurant.id ]);
        if( !orderSuppliersDailyData.hasOwnProperty(mRestaurant.id) ){
          // console.warn('empty object');
          orderSuppliersDailyData[ mRestaurant.id ] = {
            restaurantId: mRestaurant.id,
            totalOrders: 0,
            totalAcceptedOrders: 0,
            totalCanceledOrders: 0,
            totalIncomeInCent: 0,
            totalPreparationTimeInSeconds: 0,
            createdAt,
          };
        }
      }

      // console.json({orderSuppliersDailyData});

      for( const restaurantId of Object.keys( orderSuppliersDailyData ) ){
        const mState = orderSuppliersDailyData[ restaurantId ];
        const mRestaurantStatistic = await App.getModel('RestaurantStatistic').create(mState);
        if( !App.isObject(mRestaurantStatistic) ){
          console.error(` #post-boot: [${task}]: failed to create mRestaurantStatistic`);
          return false;
        }
        // console.json({mRestaurantStatistic});

        const mRestaurant = await App.getModel('Restaurant').getByFields({ id: restaurantId });
        if( !App.isObject(mRestaurant) ){
          console.error(` #post-boot: [${task}]: failed to get mRestaurant`);
          return false;
        }

        const updateRestaurant = await mRestaurant.update({
          totalOrders: mRestaurant.totalOrders + mState.totalOrders,
          totalAcceptedOrders: mRestaurant.totalAcceptedOrders + mState.totalAcceptedOrders,
          totalCanceledOrders: mRestaurant.totalCanceledOrders + mState.totalCanceledOrders,
          totalIncomeInCent: mRestaurant.totalIncomeInCent + mState.totalIncomeInCent,
          totalPreparationTimeInSeconds: mRestaurant.totalPreparationTimeInSeconds + mState.totalPreparationTimeInSeconds,
        });
        // console.debug(`#restaurantId: ${restaurantId} => ${ App.isObject(updateRestaurant) }`);
        if( !App.isObject(mRestaurant) ){
          console.error(` #post-boot: [${task}]: failed to update mRestaurant: [${mRestaurant.id}]`);
          return false;
        }

        dailyData.totalOrders += mState.totalOrders;
        dailyData.totalAcceptedOrders += mState.totalAcceptedOrders;
        dailyData.totalCanceledOrders +=mState.totalCanceledOrders;
        dailyData.totalIncomeInCent += mState.totalIncomeInCent;
        dailyData.totalPreparationTimeInSeconds += mState.totalPreparationTimeInSeconds;

        // console.log({
        //   [`r: ${restaurantId}`]: updateRestaurant.totalOrders,
        //   restoStatistic: mRestaurantStatistic.totalOrders,
        //   state: mState.totalOrders,
        // });
      }

      const mDailySummaryStatistic = await App.getModel('DailySummaryStatistic').create({
        totalOrders: dailyData.totalOrders,
        totalAcceptedOrders: dailyData.totalAcceptedOrders,
        totalCanceledOrders: dailyData.totalCanceledOrders,
        totalIncomeInCent: dailyData.totalIncomeInCent,
        totalPreparationTimeInSeconds: dailyData.totalPreparationTimeInSeconds,
        createdAt,
      });

      if( !App.isObject(mDailySummaryStatistic) ){
        console.error(` #post-boot: [${task}]: failed to create mDailySummaryStatistic`);
        return false;
      }

      const updateGlobalStatistic = await mGlobalSummaryStatistic.update({
        totalOrders: mGlobalSummaryStatistic.totalOrders + mDailySummaryStatistic.totalOrders,
        totalAcceptedOrders: mGlobalSummaryStatistic.totalAcceptedOrders + mDailySummaryStatistic.totalAcceptedOrders,
        totalCanceledOrders: mGlobalSummaryStatistic.totalCanceledOrders + mDailySummaryStatistic.totalCanceledOrders,
        totalIncomeInCent: mGlobalSummaryStatistic.totalIncomeInCent + mDailySummaryStatistic.totalIncomeInCent,
        totalPreparationTimeInSeconds: mGlobalSummaryStatistic.totalPreparationTimeInSeconds + mDailySummaryStatistic.totalPreparationTimeInSeconds,
      });

      if( !App.isObject(updateGlobalStatistic) ){
        console.error(` #post-boot: [${task}]: failed to create mDailySummaryStatistic`);
        return false;
      }

      // console.log({
      //   daily: mDailySummaryStatistic.totalOrders, 
      //   global: updateGlobalStatistic.totalOrders,
      // });

    }

    // console.json(await App.getModel('Restaurant').findAll({
    //   attributes: [
    //     'id',
    //     'name',
    //     'totalOrders',
    //     'totalAcceptedOrders',
    //     'totalCanceledOrders',
    //     'totalIncomeInCent',
    //     'totalPreparationTimeInSeconds',
    //   ]
    // }));

    console.log(` #post-boot: [${task}]: global-state`);

    const GlobalSummaryStatistic = await App.getModel('GlobalSummaryStatistic').getLatestStatistic();
    console.json({
      totalOrders: GlobalSummaryStatistic.totalOrders, 
      totalAcceptedOrders: GlobalSummaryStatistic.totalAcceptedOrders, 
      totalCanceledOrders: GlobalSummaryStatistic.totalCanceledOrders, 
      totalIncomeInCent: GlobalSummaryStatistic.totalIncomeInCent, 
      totalPreparationTimeInSeconds: GlobalSummaryStatistic.totalPreparationTimeInSeconds, 
    });

    console.log(` #post-boot: [${task}]: statistic: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: ${e.message}`);
    return false;
  }

}