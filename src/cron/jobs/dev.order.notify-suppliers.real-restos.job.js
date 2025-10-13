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

  Job.on('task', async(job, {each=0}={})=>{

    // https://interexy-com.atlassian.net/wiki/spaces/MAI/pages/221839491/R03.03+Accept+or+decline+new+order

    const statuses = App.getModel('Order').getStatuses();
    const paymentTypes = App.getModel('OrderPaymentType').getTypes();
    const deliveryDays = App.getModel('OrderDeliveryTime').getDeliveryDays( /*{asArray: true} */ );
    const deliveryHours = App.getModel('OrderDeliveryTime').getDeliveryHours( /*{asArray: true} */ );
    const timeTypes = App.getModel('OrderDeliveryTime').getTimeTypes( /*{asArray: true} */ );

    const SIMULATE_AUTO_ACCEPT = false; // App.isEnv('dev');
    let ORDER_ID_LOCK = null;
    let mOrder = null;

    const ageOfOrderDateGte = App.getModel('Order').getDefaultMaxAgeOfOrder();

    const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

    if(job.isDebugOn()){
      job.debug(`start on: [${App.getNodeUID()}] at: ${App.getISODate()}`);
      job.debug(`ageOfOrderDateGte: lt: ${ageOfOrderDateGte}`);
    }

    try{

      mOrder = await App.getModel('Order').findOne({
        where: {
          status: statuses['processing'],
          courierId: null,
          allSuppliersHaveConfirmed: false,
          // isRejectedByClient: false,
          isCanceledByClient: false,
          isLocked: false,
          updatedAt: { [ App.DB.Op.gte ]: ageOfOrderDateGte },
        },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
        skipLocked: true,
        attributes: [
          'id','clientId','status', // 'courierId',
          'isRejectedByClient','isCanceledByClient',
          // 'allSuppliersHaveConfirmed', 'allSuppliersHaveConfirmedAt',OrderDeliveryTime
          'createdAt',
          'updatedAt',
          'isValidChecksum','checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        include: [
          {
            model: App.getModel('OrderDeliveryTime'),
            required: true,
            attributes: ['id'],
            where: {
              deliveryDay: deliveryDays.today,
              deliveryHour: deliveryHours.now,
            }
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              isRestaurantNotified: false,
              // isRestaurantAcknowledged: false,
              isAcceptedByRestaurant: false,
              isCanceledByRestaurant: false,
            },
            attributes: [
              'id','restaurantId',
              'isRestaurantNotified', 'isRestaurantAcknowledged',
              'isCanceledByRestaurant', 'isAcceptedByRestaurant',
              'isTakenByCourier','isOrderReady','isOrderDelayed',
              'createdAt',
              'isValidChecksum','checksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),
            ],
          }
        ],
        order: [['id','asc']],
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        throw Error(`no orders found ...`, {cause: 'no-orders'});

      ORDER_ID_LOCK = mOrder.id;

      if(job.isDebugOn())
        job.debug({ORDER_ID_LOCK});

      const takeOrderLock = await mOrder.update({
        isLocked: true,
        lockedAt: App.getISODate(),
        lockedByNuid: App.getNodeUID(),
      }, { transaction: tx });

      if( !App.isObject(takeOrderLock) || (! takeOrderLock.isLocked) )
        throw Error(`order-lock: could not take order soft-lock`);

      await tx.commit();

    }catch(e){
      if( !e.cause || e.cause !== 'no-orders' || job.isDebugOn() )
        job.debug(`#order: ${ORDER_ID_LOCK}: ${e.message}: rollback...`);
      return await tx.rollback();
    }

    // const mOrder = await App.getModel('Order').findOne({
    //   where: {
    //     status: statuses['processing'],
    //     courierId: null,
    //     allSuppliersHaveConfirmed: false,
    //     isRejectedByClient: false,
    //     isCanceledByClient: false,
    //     isLocked: false,
    //   },
    //   attributes: [
    //     'id','clientId', // 'courierId',
    //     'isRejectedByClient','isCanceledByClient',
    //     // 'allSuppliersHaveConfirmed', 'allSuppliersHaveConfirmedAt',
    //     'createdAt'
    //   ],
    //   include: [{
    //     model: App.getModel('OrderSupplier'),
    //     required: true,
    //     where: {
    //       isRestaurantNotified: false,
    //       // isRestaurantAcknowledged: false,
    //       isAcceptedByRestaurant: false,
    //       isCanceledByRestaurant: false,
    //     },
    //     attributes: [
    //       'id','restaurantId',
    //       'isRestaurantNotified', 'isRestaurantAcknowledged',
    //       'isCanceledByRestaurant', 'isAcceptedByRestaurant',
    //       'isTakenByCourier','isOrderReady','isOrderDelayed',
    //       'createdAt'
    //     ],
    //   }],
    //   order: [['id','asc']],
    // });

    // if( !App.isArray(mOrders) || !mOrders.length )
    //   return true;

    let totalSuppliersProcessed = 0;
    let totalNotified = 0;
    let totalAcked = 0;

    // const totalSuppliers = mOrder.OrderSuppliers.length;
    const mAllSuppliers = await App.getModel('OrderSupplier').findAll({
      where: {
        orderId: mOrder.id,
      },
      attributes: [
        'id','restaurantId',
        'isValidChecksum','checksum',
        ...App.getModel('OrderSupplier').getChecksumKeys(),
      ]
    });

    const totalSuppliers = (App.isArray(mAllSuppliers) ? mAllSuppliers.length : 0);

    const startTime_t = Date.now();
    const ackTimeout = (300*1000); // MAX OF AWAIT TIME/RESTO
    const event = App.getModel('RestaurantNotification').getEvents()['newUnpaidOrder'];
    const type = App.getModel('RestaurantNotification').getTypes()['newUnpaidOrder'];

    const notifyData = {
      ack: true, event, type, data: { orderId: mOrder.id }, 
    };

    if(job.isDebugOn()){
      job.line();
      job.log(`#order: ${mOrder.id}, event: ${event}, type: ${type}, ackTimeout: ${ackTimeout}: start`);
      job.log(`#order: ${mOrder.id}, suppliers: ${ totalSuppliers }`);      
    }

    for( const mOrderSupplier of mOrder.OrderSuppliers ){

      if(job.isDebugOn())
        job.info(`#order: ${mOrder.id}, supplier: ${ mOrderSupplier.id }, restaurant: ${mOrderSupplier.restaurantId}, start async sub-job: notify`);

      App.getModel('RestaurantNotification').notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout )
        .then( async( notifyRes )=>{

          try{

            // [simulated]
            if( SIMULATE_AUTO_ACCEPT ){
              // notifyRes.success = true;
              // notifyRes.message = 'success';
            }

            let isRestaurantNotified = false;
            let isRestaurantAcknowledged = false;

            if( notifyRes.success ){
              if(job.isDebugOn()) 
                job.ok(` #order: ${mOrder.id} => supplier: ${mOrderSupplier.id}: notify: ${notifyRes.message}`);
              totalNotified++;
              totalAcked++;
              isRestaurantNotified = true;
              isRestaurantAcknowledged = true;

            }else if( App.isObject(notifyRes.data) ){
              if( !App.isUndefined(notifyRes.data.emitted) ){
                isRestaurantNotified = ( notifyRes.data.emitted > 0 ? true : false );
                totalNotified += (+isRestaurantNotified);
              }
            }

            const updateSupplierRes = await mOrderSupplier.update({
              isRestaurantNotified,
              restaurantNotifiedAt: (isRestaurantNotified ? App.getISODate() : null),
              isRestaurantAcknowledged,
              restaurantAcknowledgedAt: (isRestaurantAcknowledged ? App.getISODate() : null),
              isRequestCreated: true,
              requestCreatedAt: App.getISODate(),
            });

            if( !App.isObject(updateSupplierRes) || !App.isPosNumber(updateSupplierRes.id) ){
              job.error(` #order: [${mOrder.id}]: update-supplier: ${mOrderSupplier.id}: could not update supplier notification state`);
              return;
            }

            if(job.isDebugOn())
              job.ok(` #order: [${mOrder.id}]: update-supplier: ${mOrderSupplier.id}: ok `);

            job[ isRestaurantNotified?'ok':'warn'](`   notified: ${isRestaurantNotified}`);
            job[ isRestaurantAcknowledged?'ok':'warn'](`   acked: ${isRestaurantAcknowledged}`);

          }catch(e){
            job.error(` #order: [${mOrder.id}]: update-supplier: ${mOrderSupplier.id}: ${e.message} `);

          }finally{
            totalSuppliersProcessed++;
          }

        });

    }

    // while( totalSuppliers !== totalSuppliersProcessed ){
    //   job.debug(' sleep ...');
    //   await console.sleep(1000);
    // }

    while( (startTime_t + ackTimeout) > Date.now() ){

      await console.sleep(5000);

      // TODO: resend [events] to not reachable restos in wait time ???
      // TODO: replace by once flag:field in DB: Order.allSuppliersProcessed => 

      // [simulated]
      // if( SIMULATE_AUTO_ACCEPT ){
      //   await App.getModel('OrderSupplier').update(
      //     {
      //       isAcceptedByRestaurant: true,
      //       acceptedByRestaurantAt: App.getISODate(),
      //     },
      //     { where: { orderId: mOrder.id } }
      //   );        
      // }

      const totalAcceptedOrCanceledSuppliers = await App.getModel('OrderSupplier').getTotalWhere({
        orderId: mOrder.id,
        [ App.DB.Op.and ]: {
          [App.DB.Op.or] : [
            { isAcceptedByRestaurant: true },
            { isCanceledByRestaurant: true },
          ]
        }
      });

      if(job.isDebugOn())
        job.debug({totalSuppliers, totalAcceptedOrCanceledSuppliers});

      if( totalSuppliers === totalAcceptedOrCanceledSuppliers ){
        if(job.isDebugOn())
          job.debug(` got responses from all suppliers: breakout ...`);
        break;
      }

      if(job.isDebugOn())
        job.debug(` await MAX OF TIME/RESTO: ${ +( ((startTime_t + ackTimeout) - Date.now())/1000 ).toFixed(2) }`);
    }

    if(job.isDebugOn())
      job.json({
        totalSuppliers, totalSuppliersProcessed, totalNotified, totalAcked,
      });

    const canceledSuppliers = [];

    for( const mOrderSupplier of mOrder.OrderSuppliers ){

      const mSupplier = await App.getModel('OrderSupplier').findOne({
        where: { id: mOrderSupplier.id },
        attributes: [
          'id', 'restaurantId',
          'isRestaurantNotified','restaurantNotifiedAt',
          'isRestaurantAcknowledged','restaurantAcknowledgedAt',
          'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
          'isCanceledByRestaurant', 'canceledByRestaurantAt', // + reason
          'updatedAt'
        ],
      });

      if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) ){
        job.error(` #order: ${mOrder.id} => supplier: ${mOrderSupplier.id}: could not get supplier`);
        continue;
      }

      if( mSupplier.isAcceptedByRestaurant ){
        if(job.isDebugOn())
          job.ok(` #order: ${mOrder.id} => supplier: ${mSupplier.id}: accepted`);
        continue;
      }

      if( mSupplier.isCanceledByRestaurant ){
        if(job.isDebugOn())
          job.warn(` #order: ${mOrder.id} => supplier: ${mSupplier.id}: canceled`);
        canceledSuppliers.push( mSupplier );
        continue;
      }

      // [auto-mode] 
      if( !mSupplier.isAcceptedByRestaurant && !mSupplier.isCanceledByRestaurant ){
        const updateSupplier = await mSupplier.update({
          isCanceledByRestaurant: true,
          canceledByRestaurantAt: App.getISODate(),
          cancellationReason: 'auto-cancel: supplier is not reachable',
        });
        canceledSuppliers.push( updateSupplier || mSupplier );
        // if( App.isObject(updateSupplier) && App.isPosNumber(updateSupplier.id) ){ }
      }
    }// /[for]

    if( canceledSuppliers.length ){

      const ackTimeout = (10*1000);
      const notifyData = {
        ack: false, // no-ack
        event: App.getModel('RestaurantNotification').getEvents()['supplierCanceledOrder'],
        type: App.getModel('RestaurantNotification').getTypes()['supplierCanceledOrder'],
        data: {
          orderId: mOrder.id,
          // restaurantId: mOrderSupplier.restaurantId,
          // reason: mOrderSupplier.cancellationReason || 'n/a',
        }, 
      };

      // notify all restos
      for( const mOrderSupplier of canceledSuppliers ){
        const notifyRes = await App.getModel('RestaurantNotification')
          .notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout );
        if(job.isDebugOn())
          job.log(` #order: ${mOrder.id} => mOrderSupplier: ${mOrderSupplier.id}: notify: [${notifyData.event}]: ${notifyRes.message}`);
      } // /[notify all restaurants]

      const orderHasBeenCanceledBySupplierPushRes = await App.getModel('ClientNotification')
        .pushToClientById( mOrder.clientId, {
          type: App.getModel('ClientNotification').getTypes()['supplierCanceledOrder'],
          title: `Order #${mOrder.id} ${App.t(['has been canceled'])}.`, 
          message: `${App.t(['Restaurant canceled order'])}`,
          data: {
            orderId: mOrder.id,
          }
        });

      if( !orderHasBeenCanceledBySupplierPushRes.success ){
        if(job.isDebugOn()){
          job.error(`#order: ${mOrder.id}: #orderHasBeenCanceledBySupplierPushRes: ${orderHasBeenCanceledBySupplierPushRes.message}`);
          job.debug({ orderHasBeenCanceledBySupplierPushRes });
        }
      }

    } // /[ if: canceledSuppliers.length ]

    const releaseOrderLock = await mOrder.update({
      status: (canceledSuppliers.length ? statuses.canceled : mOrder.status ),
      isLocked: false,
      lockedAt: null,
      lockedByNuid: null,
      checksum: true,
      // [simulated] data
      ...((SIMULATE_AUTO_ACCEPT) ? {
        // allSuppliersHaveConfirmed: true,
        // allSuppliersHaveConfirmedAt: App.getISODate(),
      } : {}),
    });

    if( !App.isObject(releaseOrderLock) || releaseOrderLock.isLocked )
      return job.error(`#order: ${mOrder.id}: order-lock: could not release order-lock`);

    if(job.isDebugOn()){
      job.debug(`#order: ${mOrder.id}:`);
      job.debug(`   status: ${releaseOrderLock.status}`);
      job.debug(`   isLocked: ${releaseOrderLock.isLocked}`);
      job.ok(`#order: ${mOrder.id}: done`);      
    }

  });

  // Job.start();
  return Job;

}
