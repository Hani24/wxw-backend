module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  if( !App.isNodeOfTypeEnabled('master') ){
    return false;
  }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // do not wait for prev. instance to end.
    isEnabled: true, // App.isEnv('rem'), // true,
    runOnce: false,
    runAtStart: false, // true,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      // { each: 10, type: 'seconds' },
      // { each: 5, type: 'minutes' },
      // { each: 1, type: 'hours' },
      // { each: 1, type: 'minutes' },
      { at: 23, type: 'hours' },
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    // [
    //   <RestaurantStatistic>: {
    //     "id": 1874,                          // statistic record id
    //     "restaurantId": 2,                   // resto id
    //     "totalOrders": 18,                   // sum (Accepted + Canceled) => resto-id
    //     "totalIncomeInCent": 0,              // total USD from orders (completed only)
    //     "totalAcceptedOrders": 6,            // total accepted
    //     "totalCanceledOrders": 18,           // total canceled
    //     "totalPreparationTimeInSeconds": 0,  // total time spend on order prep. in seconds
    //     "createdAt": "2021-01-12",           // datetime when statistic was created ( default each day once @ 23:00 )
    //   }
    // ]

    const statuses = App.getModel('Order').getStatuses();
    // const datetime_t = App.DT.moment();
    // const baseDate = App.DT.moment('2021-01-01T00:00:00').add(1, 'days'); // .format('YYYY-MM-DD');
    // const baseDate = App.DT.moment(); // .format(App.getDateFormat())

    // [dev]
    // const dateFrom = App.DT.moment('2021-01-13T00:00:00').format('YYYY-MM-DDT01:00:00'); // 

    // [rem/prod]
    // const dateFrom = baseDate.format('YYYY-MM-DD');
    const dateFrom = App.DT.getStartOf( App.getISODate(), 'day' );
    const dateUpto = App.DT.getEndOf( App.getISODate(), 'day' );
    const mGlobalSummaryStatistic = await App.getModel('GlobalSummaryStatistic').getLatestStatistic();

    const createdAt = App.DT.moment(dateFrom).format(App.getDateFormat());
    const updatedAt = App.DT.moment(dateFrom).format(App.getDateFormat());

    if( await App.getModel('RestaurantStatistic').isset({
      createdAt: { [App.DB.Op.gte]: dateFrom },
    })) {
      job.debug(` statistic: already updated today`);
      job.ok(` statistic: done`);
      return ;
    }

    /*return*/ job.json({
      iso: App.getISODate(),
      dateFrom, 
      dateUpto, 
      // mGlobalSummaryStatistic
    });

    const mRestaurants = await App.getModel('Restaurant').findAll({
      where: {
        isVerified: true,
        isDeleted: false,
        isRestricted: false,
      },
      attributes: [
        'id',
        'totalOrders',
        'totalAcceptedOrders',
        'totalCanceledOrders',
        'totalIncomeInCent',
        'totalPreparationTimeInSeconds',
      ],
      order: [['id', 'asc']],
    });

    const dailyData = {
      totalOrders: 0,
      totalAcceptedOrders: 0,
      totalCanceledOrders: 0,
      totalIncomeInCent: 0,
      totalPreparationTimeInSeconds: 0,
      createdAt,
      // updatedAt,
    };

    for(const mRestaurant of mRestaurants){
      await console.sleep(500);

      try{

        const mOrders = await App.getModel('Order').findAll({
          where: { 
            status: { [App.DB.Op.in]: ['delivered','canceled','refunded'] },
            // isPaid: true,
            // isRefunded: false,
            // createdAt: {
            //   [App.DB.Op.between]: [ dateFrom, dateUpto ],
            // },
            createdAt: {
              [App.DB.Op.gte]: dateFrom,
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
            where: {
              // isOrderReady: true,
              restaurantId: mRestaurant.id,
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
              model: App.getModel('Restaurant'),
              attributes: [
                'id','name',
                'totalOrders','totalAcceptedOrders','totalCanceledOrders',
                'totalIncomeInCent','totalPreparationTimeInSeconds',
              ]
            }],
          }],
          order: [['id','asc']],
          // limit: 20,
        });

        job.warn(`#restaurantId: ${mRestaurant.id} => total-orders: ${mOrders.length}`);

        const mState =  {
          restaurantId: mRestaurant.id,
          totalOrders: 0,
          totalAcceptedOrders: 0,
          totalCanceledOrders: 0,
          totalIncomeInCent: 0,
          totalPreparationTimeInSeconds: 0,
          createdAt,
          // updatedAt,
        };

        job.debug(` mOrders => ${mOrders.length}`);

        for( const mOrder of mOrders ){
          for( const mOrderSupplier of mOrder.OrderSuppliers ){
            mState.totalOrders++;

            if( mOrderSupplier.isAcceptedByRestaurant )
              mState.totalAcceptedOrders++;

            if( mOrder.status === statuses.canceled && mOrderSupplier.isCanceledByRestaurant ){
              mState.totalCanceledOrders++;
            }else{
              if( mOrder.status === statuses.refunded ){
                // not statistic is required
              }else{
                // delivered
                if( mOrderSupplier.isOrderReady ){
                  mState.totalIncomeInCent += App.isNumber(mOrderSupplier.totalPrice)
                    ? mOrderSupplier.totalPrice
                    : 0;
                }
              }
            }

            const diffTime_t = mOrderSupplier.isOrderReady 
              ? Math.floor(((new Date(mOrderSupplier.orderReadyAt)) - (new Date(mOrder.paidAt)))/1000)
              : 0;

            mState.totalPreparationTimeInSeconds += App.isNumber(diffTime_t) 
              ? diffTime_t
              : 0;

          }
        }

        // job.json({create: {mState}});
        const mRestaurantStatistic = await App.getModel('RestaurantStatistic').create(mState);
        if( !App.isObject(mRestaurantStatistic) || !App.isPosNumber(mRestaurantStatistic.id) ){
          job.error(`#restaurantId: ${mRestaurant.id}:  failed to add mState`);
          job.json({mState});
          continue;
        }

        // job.json({mRestaurantStatistic});
        // job.json({mRestaurant});

        const updateRestaurant = await mRestaurant.update({
          totalOrders: (mRestaurant.totalOrders +mRestaurantStatistic.totalOrders),
          totalAcceptedOrders: (mRestaurant.totalAcceptedOrders +mRestaurantStatistic.totalAcceptedOrders),
          totalCanceledOrders: (mRestaurant.totalCanceledOrders +mRestaurantStatistic.totalCanceledOrders),
          totalIncomeInCent: (mRestaurant.totalIncomeInCent +mRestaurantStatistic.totalIncomeInCent),
          totalPreparationTimeInSeconds: (mRestaurant.totalPreparationTimeInSeconds +mRestaurantStatistic.totalPreparationTimeInSeconds),
        });

        if( !App.isObject(updateRestaurant) || !App.isPosNumber(updateRestaurant.id) ){
          job.error(`#restaurantId: ${mRestaurant.id}:  failed to update global resto state`);
          continue;
        }

        // job.json({updateRestaurant});

        dailyData.totalOrders += mState.totalOrders;
        dailyData.totalAcceptedOrders += mState.totalAcceptedOrders;
        dailyData.totalCanceledOrders +=mState.totalCanceledOrders;
        dailyData.totalIncomeInCent += mState.totalIncomeInCent;
        dailyData.totalPreparationTimeInSeconds += mState.totalPreparationTimeInSeconds;

      }catch(e){
        job.error(`restaurantId: ${mRestaurant.id}: ${e.message}`);
        await console.sleep(500);
      }

    }

    const mDailySummaryStatistic = await App.getModel('DailySummaryStatistic').create({
      ...dailyData,
      createdAt,
      // updatedAt,
    });

    if( !App.isObject(mDailySummaryStatistic) ){
      job.error(`mDailySummaryStatistic: error, could not create`);
      return;
    }

    // job.json({mDailySummaryStatistic});

    const updateGlobalStatistic = await mGlobalSummaryStatistic.update({
      totalOrders: App.DB.literal(`totalOrders + ${mDailySummaryStatistic.totalOrders}`),
      totalAcceptedOrders: App.DB.literal(`totalAcceptedOrders + ${mDailySummaryStatistic.totalAcceptedOrders}`),
      totalCanceledOrders: App.DB.literal(`totalCanceledOrders + ${mDailySummaryStatistic.totalCanceledOrders}`),
      totalIncomeInCent: App.DB.literal(`totalIncomeInCent + ${mDailySummaryStatistic.totalIncomeInCent}`),
      totalPreparationTimeInSeconds: App.DB.literal(`totalPreparationTimeInSeconds + ${mDailySummaryStatistic.totalPreparationTimeInSeconds}`),
    });

    if( !App.isObject(mGlobalSummaryStatistic) ){
      job.error(`mGlobalSummaryStatistic: error, could not upda`);
      return;
    }

    // job.json({updateGlobalStatistic});
    job.json({mGlobalSummaryStatistic: await App.getModel('GlobalSummaryStatistic').getLatestStatistic() });

    job.info(` done.`);

  });

  // Job.start();
  return Job;

}

