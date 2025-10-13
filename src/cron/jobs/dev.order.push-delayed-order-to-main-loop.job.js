module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  if( !App.isNodeOfTypeEnabled('master') ){
    return false;
  }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: true, // do not wait for prev. instance to end.
    isEnabled: true, // App.isEnv('dev'),
    runOnce: false,
    runAtStart: false, // true,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      { each: 10, type: 'seconds' },
    ],
  });

  const statuses = App.getModel('Order').getStatuses();
  const deliveryDays = App.getModel('OrderDeliveryTime').getDeliveryDays( /*{asArray: true} */ );
  const deliveryHours = App.getModel('OrderDeliveryTime').getDeliveryHours( /*{asArray: true} */ );
  const timeTypes = App.getModel('OrderDeliveryTime').getTimeTypes( /*{asArray: true} */ );

  const cancelOrderAndNotifyClient = async (mOrder)=>{
    try{

      const metadata_t = {
        orderId: mOrder.id,
        userId: mOrder.Client.User.id,
        clientId: mOrder.Client.id,
        courierId: null,
      };

      const updateOrder = await mOrder.update({
        status: statuses.canceled,
        // courierId: null,
        // isCanceledByClient: true,
        // canceledByClientAt: App.getISODate(),
        // cancellationReason,
        // // paymentIntentId: null,
        // // clientSecret: null,
        cancellationReason: 'Server could not process your order',
        checksum: true,
      });

      if( mOrder.isPaid /* && !mOrder.isRefunded */ ){}

      // refund && notify client (even if not paid)
      const paymentIntentRefundRes = await App.payments.stripe.paymentIntentRefund(
        mOrder.paymentIntentId, metadata_t 
      );

      const pushToClientRes = await App.getModel('ClientNotification')
        .pushToClient( mOrder.clientId, {
          type: App.getModel('ClientNotification').getTypes()['clientCanceledOrder'],
          title: `Order #${mOrder.id} ${ App.t(['has been canceled']) }.`,
          message: `${ App.t(['Your order could not be processed']) }`,
          data: metadata_t,
        });

      if( !pushToClientRes.success ){
        console.error('pushToClientRes');
        console.json({pushToClientRes});
      }

      return true;
    }catch(e){
      console.error(` #cancelOrderAndNotifyClient: ${e.message}`);
      return false;
    }
  }

  Job.on('task', async(job, {each=0}={})=>{

    // const ageOfOrderDate = App.getModel('Order').getDefaultMaxAgeOfOrder();
    // allow resto start-up if it is right at the start of working day
    const datetime = App.DT.moment().tz( App.getServerTz() )
      // .subtract(10, 'minutes')
      // .add(10, 'minutes')
      .format( App.getDateFormat() );

    if(job.isDebugOn()){
      job.debug(`start on: [${App.getNodeUID()}] at: ${App.getISODate()} => req-datetime: ${datetime}`);
    }

    const _mOrder = await App.getModel('Order').findOne({
      attributes: ['id','pushToProcessingAt'],
      order: [['id','desc']]
    });

    const mOrders = await App.getModel('Order').findAll({
      where: {
        status: {
          [ App.DB.Op.or ]: [
            App.DB.where(App.DB.col('Order.status'), statuses['processing']),
            App.DB.where(App.DB.col('Order.status'), statuses['created']),
          ]
        },
        courierId: null,
        allSuppliersHaveConfirmed: false,
        // isRejectedByClient: false,
        isCanceledByClient: false,
        isLocked: false,
        // isPaid: ( ! App.isEnv('dev')),
        isPaid: true,
        isPushedToProcessing: false,
        pushToProcessingAt: {
          [ App.DB.Op.lte ]: datetime,
        },
      },
      distinct: true,
      attributes: [
        'id', 'clientId', 'isPaid', 'isRefunded',
        'isPushedToProcessing', 'pushedToProcessingAt', 'pushToProcessingAt',
        'paymentIntentId', 'clientSecret',
        'createdAt',
        // 'courierId',
        'isValidChecksum','checksum',
        ...App.getModel('Order').getChecksumKeys(),
      ],
      include: [
        {
          required: true,
          model: App.getModel('Client'),
          attributes: ['id','userId'],
          include: [{
            model: App.getModel('User'),
            attributes: ['id'],
          }],
        },
        {
          required: true,
          model: App.getModel('OrderDeliveryTime'),
          attributes: [
            'id','deliveryDay','deliveryHour','deliveryTimeValue', 'deliveryTimeType'
          ],
          where: {
            [ App.DB.Op.or ]: [
              App.DB.where(App.DB.col('OrderDeliveryTime.deliveryDay'), deliveryDays.tomorrow),
              App.DB.where(App.DB.col('OrderDeliveryTime.deliveryDay'), deliveryDays.today),
            ],
            deliveryHour: deliveryHours['set-by-user'],
          }
        },
        {
          required: true,
          model: App.getModel('OrderSupplier'),
          where: {
            isRestaurantNotified: false,
            // isRestaurantAcknowledged: false,
            isAcceptedByRestaurant: false,
            isCanceledByRestaurant: false,
          },
          // attributes: [],
          attributes: [
            'id',
            'isValidChecksum','checksum',
            ...App.getModel('OrderSupplier').getChecksumKeys(),
          ],
          // include: [{
          //   model: App.getModel('Restaurant'),
          //   attributes: ['id','timezone','orderPrepTime'],
          // }],
        }
      ],
      order: [['id','asc']],
      offset: 0,
      limit: 10,
    });

    if( !App.isArray(mOrders) || !mOrders.length ){
      if(job.isDebugOn())
        job.debug(`no orders found ...`, {cause: 'no-orders'});
    }

    for( const mOrder of mOrders ){

      console.json({ orderId: mOrder.id, pushToProcessingAt: mOrder.pushToProcessingAt, OrderDeliveryTime: mOrder.OrderDeliveryTime });
      // continue;

      if( 
        !App.isObject(mOrder.OrderDeliveryTime)
        ||
        !App.isArray(mOrder.OrderSuppliers) 
        || 
        !mOrder.OrderSuppliers.length
      ){
        await cancelOrderAndNotifyClient(mOrder);
        continue;
      }

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        // push order to current orders stack to notify resto and find courier
        const updateOrderDeliveryTime = await mOrder.OrderDeliveryTime.update({
          deliveryDay: deliveryDays.today,
          deliveryHour: deliveryHours.now,
          deliveryTimeType: App.getModel('OrderDeliveryTime').getTimeTypes({asArray: true})[0],
          deliveryTimeValue: 0,
        }, { transaction: tx });

        if( !App.isObject(updateOrderDeliveryTime) || !App.isPosNumber(updateOrderDeliveryTime.id) )
          throw Error(`failed to update order-delivery-time`);

        const updateOrder = await mOrder.update({
          status: statuses['processing'], // push...
          isPushedToProcessing: true,
          pushedToProcessingAt: App.getISODate(),
          checksum: true,
        }, { transaction: tx });

        if( !App.isObject(updateOrder) || !App.isPosNumber(updateOrder.id) )
          throw Error(`failed to update order`);

        job.ok(`order updated => push to main stack`);
        await tx.commit();

      }catch(e){
        console.error(` #rollback: [${tx.id}] #${mOrder.id}: ${e.message}`);
        await tx.rollback();
        await cancelOrderAndNotifyClient(mOrder);
      }

    }

    // const mOrderSupplier = mOrder.OrderSuppliers[0];
    // const mRestaurant = mOrderSupplier.Restaurant;

    // mOrderSupplier.deliveryTimeType;
    // mOrderSupplier.deliveryTimeValue;

    // App.DT.applyTimezone( user_t.birthday, mRestaurant.timezone );
    // const datetime_t = App.DT.getStartOf( App.DT.moment(), 'day', true );
    // App.DT.subFromDate({amount, of:'hours', format:App.getDateFormat()});



    // console.json({mOrder});

    // {
    //   "mOrder": {
    //     "id": 10000000271,
    //     "OrderDeliveryTime": {
    //       "id": 222,
    //       "deliveryTimeValue": 6,
    //       "deliveryTimeType": "AM"
    //     },
    //     "OrderSuppliers": [
    //       {
    //         "id": 318,
    //         "Restaurant": {
    //           "id": 2,
    //           "timezone": "America/Los_Angeles",
    //           "orderPrepTime": 45
    //         }
    //       }
    //     ]
    //   }
    // }

    if(job.isDebugOn()) job.ok(`done`);      

  });

  // Job.start();
  return Job;

}
