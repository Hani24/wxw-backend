module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  // if( !App.isNodeOfTypeEnabled('master') ){
  //   return false;
  // }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: true, // do not wait for prev. instance to end.
    isEnabled: false, // App.isEnv('rem'), // true,
    runOnce: false,
    runAtStart: false, // true,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      { each: 5, type: 'seconds' },
      // { each: 5, type: 'minutes' },
      // { each: 1, type: 'hours' },
      // { each: 1, type: 'minutes' },
      // { at: 23, type: 'hours' },
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    // NOT IN USE AT THE MOMENT
    return; 
    // TODO: Apply extra filters [=>delayed delivery]

    const statuses = App.getModel('Order').getStatuses();
    const ageOfOrderDate = App.getModel('Order').getDefaultMaxAgeOfOrder();
    const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

    try{


      if(job.isDebugOn()){
        job.debug(`start on: [${App.getNodeUID()}] at: ${App.getISODate()}`);
        job.debug(`ageOfOrderDate: lt: ${ageOfOrderDate}`);
      }

      // return console.json({
      //   last: await App.getModel('Order').findOne({
      //     where: {
      //       status: statuses.processing,
      //       id: 10000000236,
      //       // createdAt <= '2022-04-23T18:22:25' and id=10000000236
      //       createdAt: { [ App.DB.Op.lt ]: ageOfOrderDate },
      //     },
      //     // order: [['id','desc']]
      //   }),
      // });

      const mOrders = await App.getModel('Order').findAll({
        transaction: tx,
        lock: tx.LOCK.UPDATE,
        skipLocked: true,
        where: {
          status: statuses.processing,
          // courierId: null,
          isPaid: false,
          // [ App.DB.Op.or ]: {
          //   courierId: null,
          //   isPaid: false,
          // },
          // allSuppliersHaveConfirmed: true, // else: it will be auto-canceled within: 45 seconds
          isRejectedByClient: false, // ...
          isCanceledByClient: false, // ...
          // isLocked: false,
          createdAt: { [ App.DB.Op.lt ]: ageOfOrderDate },
          // ...( App.isObject(where) ? where : {} ),
        },
        distinct: true,
        attributes: [
          'id',
          'status',
          'clientId',
          'courierId',
          'lastCourierId',
          'paymentIntentId',
          'clientSecret',
          'isPaid', // 'paidAt',
          'isRefunded', // 'refundedAt',
          'isLocked', 'lockedByNuid',
          'isRejectedByClient', // 'rejectedByClientAt',
          'isCanceledByClient', // 'canceledByClientAt',
          'allSuppliersHaveConfirmed', // 'allSuppliersHaveConfirmedAt',
          'isPaymentRequestAllowed', // 'paymentRequestAllowedAt',
          'isPaymentRequested', // 'paymentRequestedAt',
          'isClientActionRequired', // 'clientActionRequiredAt',
          'isClientActionExecuted', // 'clientActionExecutedAt',
          'createdAt',
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
            required: false,
            model: App.getModel('Courier'),
            attributes: ['id','userId'],
          },
          {
            required: true,
            model: App.getModel('OrderSupplier'),
            attributes: [
              'id',
              'restaurantId',
              'isRestaurantNotified', 
              'isRestaurantAcknowledged',
              'isAcceptedByRestaurant',
              'isCanceledByRestaurant',
              'isTakenByCourier',
              'isOrderReady',
              'isValidChecksum','checksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),
            ],
            where: {
              // isRestaurantNotified: true,
              // isRestaurantAcknowledged: true,
              // isAcceptedByRestaurant: true,
              // isCanceledByRestaurant: false,
              isTakenByCourier: false,
              isOrderReady: false,
            },
            include:[{
              // required: true,
              model: App.getModel('Restaurant'),
              attributes: [
                'id','name'
              ]
            }],
          }
        ],
        order: [['id','asc']],
        limit: 1, 
      });

      if( !App.isArray(mOrders) || !mOrders.length ){
        await tx.rollback();
        if(job.isDebugOn()){
          job.info(`no order found`);
          job.ok(`done`);
        }
        return; 
      }

      if(job.isDebugOn()) 
        job.debug(` found total-orders: ${mOrders.length}`);

      for( const mOrder of mOrders ){

        if(job.isDebugOn()) 
          job.log(`   #order: [${mOrder.id}]: start`);

        // mOrder.id;
        // mOrder.clientId;
        // mOrder.courierId;
        // mOrder.paymentIntentId;
        // mOrder.isPaid;
        // mOrder.isRefunded;
        // mOrder.isLocked;
        // mOrder.lockedByNuid;
        // mOrder.isRejectedByClient;
        // mOrder.isCanceledByClient;
        // mOrder.allSuppliersHaveConfirmed;
        // mOrder.isPaymentRequestAllowed
        // mOrder.isPaymentRequested
        // mOrder.isClientActionRequired
        // mOrder.isClientActionExecuted
        // mOrder.createdAt;

        const metadata = {
          orderId: mOrder.id,
          userId: mOrder.Client.User.id,
          clientId: mOrder.clientId,
          courierId: (mOrder.courierId || 0),
          lastCourierId: (mOrder.lastCourierId || 0),
          isPaid: mOrder.isPaid,
          isRefunded: mOrder.isRefunded,
        };

        if(job.isDebugOn()) 
          job.json({metadata});

        const updateOrder = await mOrder.update({
          status: statuses.canceled, // statuses.discarded,
          isLocked: false,
          lockedByNuid: null,
          courierId: null,
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateOrder) || !App.isPosNumber(updateOrder.id) ){
          job.error(` #order: [${mOrder.id}]: failed to update status from: [${mOrder.status}] to: [${statuses.canceled}] with [row-lock]: tx: [${tx.id}]`);
          await tx.rollback();
          return false;
        }

        if( App.isPosNumber(metadata.courierId) && App.isObject(mOrder.Courier) ){

          if( mOrder.Courier.activeOrderId === mOrder.id ){
            const releaseCourier = await mOrder.Courier.update({
              isOrderRequestSent: false,
              orderRequestSentAt: null,
              orderRequestSentByNuid: null,
              hasActiveOrder: null,
              activeOrderId: null,
              activeOrderAt: null,
            }, {transaction: tx});

            if( !App.isObject(releaseCourier) || !App.isPosNumber(releaseCourier.id) ){
              job.error(` #order: [${mOrder.id}]: failed to release courier: [${mOrder.Courier.id}] tx: [${tx.id}]`);
              await tx.rollback();
              return false;
            }

            if(job.isDebugOn()) 
              job.ok(` #order: [${mOrder.id}]: courier: [${mOrder.Courier.id}]: has been released, tx: [${tx.id}]`);

          }

        }

        if( App.isString(mOrder.paymentIntentId) /*&& mOrder.isPaid && !mOrder.isRefunded*/ ){
          /* const paymentIntentCancelRes = await */ App.payments.stripe.paymentIntentCancel( mOrder.paymentIntentId, {})
            .then((paymentIntentCancelRes)=>{
              if(job.isDebugOn()) 
                job.debug(`#order: [cancel payment-intent] [${mOrder.id}]: paymentIntentCancelRes: ${paymentIntentCancelRes.message}`);
            });
        }

        // request refunded anyway ...
        if( App.isString(mOrder.paymentIntentId) /*&& mOrder.isPaid && !mOrder.isRefunded*/ ){
          if(job.isDebugOn()) 
            job.debug(`#${mOrder.id}: [refund] paymentIntentId: ${mOrder.paymentIntentId}, clientSecret: ${mOrder.clientSecret} `);
          /* const paymentIntentRefundRes = await */ App.payments.stripe.paymentIntentRefund( mOrder.paymentIntentId, {
            // reason: cancellationReason,
            metadata,
          }).then((paymentIntentRefundRes)=>{
            if(job.isDebugOn()) 
              job.debug(`#order: [${mOrder.id}]: paymentIntentRefundRes: ${paymentIntentRefundRes.message}`);
          });
        }

        // if( mOrder.isPaid ){
        //   if( mOrder.isRefunded ){
        //   }
        // }

        if( App.isArray(mOrder.OrderSuppliers) && mOrder.OrderSuppliers.length ){

          const ackTimeout = (10*1000);
          const notifyData = {
            ack: false,
            event: App.getModel('RestaurantNotification').getEvents()['orderCanceled'], // orderCanceled, orderDiscarded
            type: App.getModel('RestaurantNotification').getTypes()['orderCanceled'], // orderCanceled, orderDiscarded
            data: metadata, 
          };

          // job.json({notifyData});

          for( const mOrderSupplier of mOrder.OrderSuppliers ){

            if( !mOrderSupplier.isAcceptedByRestaurant && mOrderSupplier.isCanceledByRestaurant )
              continue;
            // mOrderSupplier.id;
            // mOrderSupplier.restaurantId;
            // mOrderSupplier.isRestaurantNotified;
            // mOrderSupplier.isRestaurantAcknowledged;
            // mOrderSupplier.isAcceptedByRestaurant;
            // mOrderSupplier.isCanceledByRestaurant;
            // mOrderSupplier.isTakenByCourier;
            // mOrderSupplier.isOrderReady;

            /* const notifyRes = await */ App.getModel('RestaurantNotification')
              .notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout )
              .then((notifyRes)=>{
                if(job.isDebugOn()) 
                  job.log(` #order: [${mOrder.id}]: mOrderSupplier: ${mOrderSupplier.id}: event: [${notifyData.event}], notify: ${notifyRes.message}`);
              });

          }
        }

        if( mOrders.length > 1 ) await console.sleep(150);
        if(job.isDebugOn()) 
          job.info(`   #order: [${mOrder.id}]: done`);

      } // /for(order of orders)

      await tx.commit();

    }catch(e){
      job.error(`${e.message}`);
      await tx.rollback();
    }

    if(job.isDebugOn()) {
      job.info(` done.`);
      job.log(``);
    }

  });

  // Job.start();
  return Job;

}

