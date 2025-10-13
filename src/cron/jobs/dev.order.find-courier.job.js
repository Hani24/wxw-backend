module.exports = async (App, params, BaseJob, jobName = 'n/a', config = {}) => {

  if (!App.isNodeOfTypeEnabled('master')) {
    return false;
  }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob(App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: true, // each sub-"process" own order
    isEnabled: true,
    runOnce: false,
    runAtStart: false,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      { each: 7, type: 'seconds' },
      // { each: 30, type: 'minutes' },
      // { each: 1, type: 'hours' },
      // { each: 10, type: 'minutes' },
      // { each: 10, type: 'hours' },
    ],
  });

  // take order-lock
  // create courier-request record for current order
  // await (**time) and check courier-response
  // if: negative
  //   find-next: (courier)
  //     if: negative:
  //       release: order-lock => could not find any couriers
  // if: positive:
  //    assign: (courier) to current-order
  //    update: order: state, etc ...
  //    notify:
  //      courier: new order is taken
  //      client: new order is processing ....
  //    release: order-lock => success

  // p2:
  //   simulate Restaraunt => OrderSupplier
  //     notify Courier => {isOrderReady || isOrderDelayed || isCanceledByRestaurant}
  //     if: {isOrderReady}:
  //       await Courier to pick it up
  //       Restaurant updates flag: => {isTakenByCourier}
  //         notify Client => order updated
  //   .....
  //   client: => {isCanceledByClient} ???
  //   .....
  //   delivery to final destination:
  //     : => {isDeliveredByCourier}
  //     : => {isCourierRatedByClient}
  //     : => {isRejectedByClient}: food was not accepted by the client "at the delivery address"

  const AWAIT_COURIER_RESPONSE = App.isEnv('dev') ? (45 * 1000) : (45 * 1000); // 45 *1000; // sec
  const AWAIT_NEXT_LOOP = App.isEnv('dev') ? (5 * 1000) : (30 * 1000); // 30 * 1000; // sec
  const TICK_MSEC = 500; // 1000 mSec
  const DEBUG = false; // false

  const statuses = App.getModel('Order').getStatuses();
  const paymentTypes = App.getModel('OrderPaymentType').getTypes();

  const findNextOrder = async (where = {}, tx = false, job = {}) => {

    const ageOfOrderDate = App.getModel('Order').getDefaultMaxAgeOfOrder();
    const deliveryDays = App.getModel('OrderDeliveryTime').getDeliveryDays( /*{asArray: true} */);
    const deliveryHours = App.getModel('OrderDeliveryTime').getDeliveryHours( /*{asArray: true} */);

    // if(job.isDebugOn())
    //   job.debug(` query: createdAt:[gt] ${ageOfOrderDate}`);

    // find oldest order without [soft-lock] + no assigned courier && processing + (max age of 20 minutes)
    const params = {
      where: {
        status: statuses['processing'],
        courierId: null,
        allSuppliersHaveConfirmed: true,
        isRejectedByClient: false,
        isCanceledByClient: false,
        isLocked: false,
        createdAt: { [App.DB.Op.gte]: ageOfOrderDate },
        ...(App.isObject(where) ? where : {}),
      },
      distinct: true,
      attributes: [
        'id',
        'clientId',
        'courierId',
        'lastCourierId',
        'isPaid',
        'isLocked',
        'isCanceledByClient',
        'allSuppliersHaveConfirmed', // 'allSuppliersHaveConfirmedAt',
        // 'isRejectedByClient',
        'createdAt',
        // [simulated]
        'paymentIntentId',
      ],
      include: [
        {
          model: App.getModel('Client'),
          required: true,
          attributes: ['id', 'lat', 'lon', 'userId'],
        },
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
          attributes: [
            'id',
            'restaurantId',
            'isRestaurantNotified',
            'isRestaurantAcknowledged',
            'isAcceptedByRestaurant',
            'isCanceledByRestaurant',
            // 'isTakenByCourier','isOrderReady','isOrderDelayed',
            // 'createdAt'
          ],
          where: {
            isRestaurantNotified: true,
            // isRestaurantAcknowledged: true,
            isAcceptedByRestaurant: true,
            isCanceledByRestaurant: false,
          },
          include: [{
            model: App.getModel('Restaurant'),
            // required: true,
            attributes: [
              'id', 'name', 'isOpen', 'type', 'zip', 'street', 'cityId', 'image',
              'lat', 'lon'
            ]
          }],
        }
      ],
      order: [['id', 'asc']],
      limit: 1,
    };

    if (tx) {
      params.transaction = tx;
      params.lock = tx.LOCK.UPDATE;
      params.skipLocked = true;
    }

    return await App.getModel('Order').findOne(params);

  }

  Job.on('task', async (job, { each = 0, type = 'n/a' }) => {

    const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
    if (!App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id))
      return job.error(`failed-to get system settings`);

    const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());
    let mOrder = null;
    let ORDER_ID_LOCK = null;

    try {

      // Take custom lock on Order:Row in DB
      mOrder = await findNextOrder({}, tx, job);
      if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
        if (job.isDebugOn()) job.debug(` no order found`);
        return await tx.rollback();
      }

      ORDER_ID_LOCK = mOrder.id;

      if (job.isDebugOn()) {
        job.line();
        job.log(` start-on: #nuid: ${App.getNodeUID()}, start at: ${App.getISODate()}`);
        job.log(` #order: ${ORDER_ID_LOCK}`);
      }

      const takeOrderLock = await mOrder.update({
        isLocked: true,
        lockedAt: App.getISODate(),
        lockedByNuid: App.getNodeUID(),
      }, { transaction: tx });

      if (!App.isObject(takeOrderLock) || (!takeOrderLock.isLocked))
        throw Error(`order-lock: could not take order-lock`);

      await tx.commit();

    } catch (e) {
      job.error(`#order: ${ORDER_ID_LOCK}: ${e.message}`);
      return await tx.rollback();
    }

    // get (soft-locked) Order without (tx) and row-lock
    mOrder = await findNextOrder({
      status: statuses['processing'],
      id: ORDER_ID_LOCK,
      isLocked: true,
      lockedByNuid: App.getNodeUID(),
      isCanceledByClient: false,
    }, false, job);

    if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id))
      return job.error(`#order: ${ORDER_ID_LOCK}: LOCKED ORDER: could not get it back ...`);

    while (App.isObject(mOrder) && App.isPosNumber(mOrder.id)) {

      try {

        const mClient = mOrder.Client;

        if (job.isDebugOn()) {
          job.line();
          job.log(`#order: ${ORDER_ID_LOCK}: start`);
          job.warn(`#order: ${ORDER_ID_LOCK}: isLocked: => ${mOrder.isLocked}, #client: ${mClient.id} => userId: ${mClient.userId}`);
        }

        // TODO: NOTE: rank/order/sort suppliers ???

        for (const mOrderSupplier of mOrder.OrderSuppliers) {

          // TODO: add validations ...
          const mRestaurant = mOrderSupplier.Restaurant;
          const { lat, lon } = mRestaurant;

          if (job.isDebugOn())
            job.warn(`#order: ${ORDER_ID_LOCK}: #supplier: ${mOrderSupplier.id}: #restaurant: ${mRestaurant.id} => ${mRestaurant.name}: [lat: ${lat}, lon: ${lon}]`);

          // search within: square area ( position (+-) => R (== Y/X) )
          const mCouriers = await App.getModel('Courier').findAll({
            where: {
              [App.DB.Op.and]: [
                { lat: { [App.DB.Op.gte]: App.geo.lib.fixCoord(lat - mDeliveryPriceSettings.maxSearchSquareInDegrees) } },
                { lat: { [App.DB.Op.lte]: App.geo.lib.fixCoord(lat + mDeliveryPriceSettings.maxSearchSquareInDegrees) } },
                { lon: { [App.DB.Op.gte]: App.geo.lib.fixCoord(lon - mDeliveryPriceSettings.maxSearchSquareInDegrees) } },
                { lon: { [App.DB.Op.lte]: App.geo.lib.fixCoord(lon + mDeliveryPriceSettings.maxSearchSquareInDegrees) } },
                { hasActiveOrder: false },
                { activeOrderId: null },
                { isOnline: true },
                { isRestricted: false },
                { isKycCompleted: true },
                { isVerified: true },
                { isOrderRequestSent: false },
              ]
            },
            attributes: ['id', 'lat', 'lon', 'userId'],
            // include: [{
            //   model: App.getModel('CourierOrderRequest'),
            //   where: {
            //     orderId: mOrder.id,
            //   },
            //   attributes: [
            //     'id',
            //     'isAccepted', // 'acceptedAt',
            //     'isRejected', //'rejectedAt',
            //   ]
            // }],
            // order: [['id','asc']], // change to distance ???
            limit: 10,
          });

          if (!mCouriers.length) {
            if (job.isDebugOn()) {
              job.warn(`#order: ${ORDER_ID_LOCK}: no [couriers] available in the radius of [restaurant] at the moment...`);
              job.info(`#order: ${ORDER_ID_LOCK}: abord searching and wait (${(AWAIT_NEXT_LOOP / 1000).toFixed(2)}) sec`);
            }
            // try to find courier near other suppliers
            continue;
          }

          for (const mCourier of mCouriers) {

            const issetRes = await App.getModel('CourierOrderRequest').isset({
              orderId: mOrder.id,
              courierId: mCourier.id,
              [App.DB.Op.and]: {
                [App.DB.Op.or]: [
                  { isAccepted: true },
                  { isRejected: true },
                ]
              }
            });

            if (issetRes) {
              if (job.isDebugOn())
                job.log(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}, #user: ${mCourier.userId}: has already [accepter or rejected]`);
              continue;
            }

            const distanceRes = App.geo.lib.getDistance(mCourier, mRestaurant, mDeliveryPriceSettings.unitType);

            if (job.isDebugOn()) {
              job.log(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}, #user: ${mCourier.userId}: find: [courier-order-request]`);
              job.log(`#restaurant: ${mRestaurant.id}: distance: ${distanceRes.data.distance} ${distanceRes.data.units}`);
            }

            let mRequest = await App.getModel('CourierOrderRequest').findOne({
              where: {
                orderId: mOrder.id,
                courierId: mCourier.id,
                [App.DB.Op.and]: {
                  [App.DB.Op.or]: [
                    { isAccepted: false },
                    { isRejected: false },
                  ]
                }
              },
              attributes: [
                'id',
                'isAccepted', // 'acceptedAt',
                'isRejected', //'rejectedAt',
              ]
            });

            if (!App.isObject(mRequest) || !App.isPosNumber(mRequest.id)) {

              mRequest = await App.getModel('CourierOrderRequest').create({
                orderId: mOrder.id,
                courierId: mCourier.id,
                isAccepted: false, // default
                isRejected: false, // default
              });

              if (!App.isObject(mRequest) || !App.isPosNumber(mRequest.id)) {
                job.warn(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id} => userId: ${mCourier.userId}`);
                job.error(`#order: ${ORDER_ID_LOCK}: could not create CourierOrderRequest `);
                continue;
              }

            }

            if (job.isDebugOn()) {
              job.log(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}, #user: ${mCourier.userId}: using: [courier-order-request]: ${mRequest.id}`);
              // job.debug({mRequest});
            }

            {
              const mOrderRequestSentRes = await mCourier.update({
                isOrderRequestSent: true,
                orderRequestSentAt: App.getISODate(),
                orderRequestSentByNuid: App.getNodeUID(),
              });

              if (!App.isObject(mOrderRequestSentRes) || !App.isPosNumber(mOrderRequestSentRes.id)) {
                job.error(`#order: ${ORDER_ID_LOCK}: [A] #courier: ${mCourier.id}: failed to set: [isOrderRequestSent + NUID]`);
                await mRequest.destroy();
                continue;
              }
            }

            const newRequestPushRes = await App.getModel('CourierNotification')
              .pushToCourier(mCourier, {
                type: App.getModel('CourierNotification').getTypes()['courierOrderRequest'],
                title: `New Order #${ORDER_ID_LOCK}.`,
                message: `Request #${mRequest.id}`,
                data: {
                  orderId: mOrder.id,
                  requestId: mRequest.id,
                }
              });

            if (!newRequestPushRes.success) {
              job.error(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}: #new-request-push: ${newRequestPushRes.message}`);

              {
                const mOrderRequestSentRes = await mCourier.update({
                  isOrderRequestSent: false,
                  orderRequestSentAt: null,
                  orderRequestSentByNuid: null,
                });

                if (!App.isObject(mOrderRequestSentRes) || !App.isPosNumber(mOrderRequestSentRes.id)) {
                  job.error(`#order: ${ORDER_ID_LOCK}: [A] #courier: ${mCourier.id}: failed to unset: [isOrderRequestSent + NUID]`);
                }
              }

              const forceAutoRejectRes = await mRequest.update({
                isRejected: true,
                rejectedAt: App.getISODate(),
              });

              if (job.isDebugOn())
                job.warn(`#order: ${ORDER_ID_LOCK}: #request: ${mRequest.id}: force [auto-reject] request`);

              if (!App.isObject(forceAutoRejectRes) || !App.isPosNumber(forceAutoRejectRes.id)) {
                job.error(`#order: ${ORDER_ID_LOCK}: #request: ${mRequest.id}: failed [auto-reject] request`);
              }

              continue;
            }

            // [simulated]
            // if( false /* App.isEnv('dev') */ ){
            //   // courier has [rejected] order
            //   // const mR = await mRequest.update({ isRejected: true, acceptedAt: App.getISODate() });
            //   // job.debug({simulate:{isRejected: true}});
            //   // courier has [accepted] order
            //   const mR = await mRequest.update({ 
            //     isAccepted: true, 
            //     acceptedAt: App.getISODate(),
            //   });
            //   job.debug({simulate:{isAccepted: true}});
            //   if( mR.isAccepted ){
            //     // "push" order to [auto] payment processing
            //     const updateOrderActionRes = await mOrder.update({
            //       isPaymentRequestAllowed: true,
            //       paymentRequestAllowedAt: App.getISODate(),
            //     });                
            //     if( !App.isObject(updateOrderActionRes) ){
            //       job.error(`#order: ${ORDER_ID_LOCK}: [simulated]: updateOrderActionRes is null`);
            //     }else{
            //       job.ok(`#order: ${ORDER_ID_LOCK}: [simulated]: isAccepted: ${updateOrderActionRes.isAccepted}`);
            //     }
            //   }
            // }

            if (job.isDebugOn())
              job.debug(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}: await courier repsonse: ${AWAIT_COURIER_RESPONSE} mSec`);

            for (let awaitTick = TICK_MSEC; awaitTick <= AWAIT_COURIER_RESPONSE; awaitTick += TICK_MSEC) {

              if (job.isDebugOn())
                job.debug(`#order: ${ORDER_ID_LOCK}: @tick: ${awaitTick} of ${AWAIT_COURIER_RESPONSE}`);

              if ((await App.getModel('CourierOrderRequest').isset({
                orderId: mOrder.id,
                courierId: mCourier.id,
                [App.DB.Op.and]: {
                  [App.DB.Op.or]: [
                    { isAccepted: true },
                    { isRejected: true },
                  ]
                }
              }))) {
                if (job.isDebugOn())
                  job.debug(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}: break out of waiting courier-response`);
                break;
              }

              await console.sleep(TICK_MSEC);
            }

            if (job.isDebugOn())
              job.debug(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}: verify courier repsonse:`);

            {
              const mOrderRequestSentRes = await mCourier.update({
                isOrderRequestSent: false,
                orderRequestSentAt: null,
                orderRequestSentByNuid: null,
              });

              if (!App.isObject(mOrderRequestSentRes) || !App.isPosNumber(mOrderRequestSentRes.id)) {
                job.error(`#order: ${ORDER_ID_LOCK}: [B] #courier: ${mCourier.id}: failed to unset: [isOrderRequestSent + NUID]`);
              }
            }

            const mCourierOrderRequest = await App.getModel('CourierOrderRequest').findOne({
              where: {
                // orderId: mOrder.id,
                // courierId: mCourier.id,
                id: mRequest.id,
              },
              attributes: ['id', 'isAccepted', 'isRejected', 'orderId', 'courierId']
            });

            if (!App.isObject(mCourierOrderRequest) || !App.isPosNumber(mCourierOrderRequest.id)) {
              job.warn(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}, #user: ${mCourier.userId}:`);
              job.error(`#order: ${ORDER_ID_LOCK}: could not find CourierOrderRequest after [wait:**time] `);
              continue;
            }

            if (!mCourierOrderRequest.isAccepted || mCourierOrderRequest.isRejected) {
              // [auto-reject] => no respose from courier
              if (job.isDebugOn())
                job.warn(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}, #user: ${mCourier.userId}: isRejected: [${mCourierOrderRequest.isRejected}]: => [auto:reject]: true`);

              if (!mCourierOrderRequest.isRejected) {
                const autoRejectRes = await mCourierOrderRequest.update({
                  isRejected: true,
                  rejectedAt: App.getISODate(),
                });
                if (!App.isObject(autoRejectRes) || !App.isPosNumber(autoRejectRes.id)) {
                  job.error(`#order: ${ORDER_ID_LOCK}: [auto:reject]: failed to reject order in auto mode`);
                }
              } else {
                if (job.isDebugOn())
                  job.debug(`#order: ${ORDER_ID_LOCK}: [auto:reject]: already rejected: [manual]`);
              }
              continue;
            }

            let isTxExecuted = false;
            const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());
            // const tx0 = await App.DB.sequelize.transaction( App.DB.getTxOptions() );
            const lastCourierId = mOrder.lastCourierId;

            try {

              // [order]
              if (job.isDebugOn())
                job.info(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id} => isAccepted: [manual]: true`);
              const assignCourierToOrder = await mOrder.update({
                isLocked: false,
                lockedAt: null,
                lockedByNuid: null,
                courierId: mCourier.id,
                lastCourierId: mCourier.id,
                // status: statuses['processing'],
              }, { transaction: tx });

              if (!App.isObject(assignCourierToOrder) || !App.isPosNumber(assignCourierToOrder.id))
                throw Error(`failed assign courier: [${mCourier.id}] and unlock the order`);

              // if( App.Telegram && job.isDebugOn() ){
              //   App.Telegram.onInfo(`#${ORDER_ID_LOCK}: ${assignCourierToOrder.lastCourierId}`);
              // }

              if (job.isDebugOn())
                job.ok(`#order: ${ORDER_ID_LOCK}: order-lock: has been released and courier has been assigned to the order`);

              // double check if client hast canceled in wait time
              if (assignCourierToOrder.status === statuses.canceled) {
                throw Error(`clientId: ${mClient.id}: has canceled order: ${mOrder.id}: aborting tx and rolling back`);
              }

              // [courier]
              if (job.isDebugOn())
                job.info(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id} => assign order as C.activeOrderId`);
              const setActiveOrderRes = await mCourier.update({
                hasActiveOrder: true,
                activeOrderAt: App.getISODate(),
                activeOrderId: mOrder.id,
                // isOrderRequestSent: false, // can it be reseted ?
                // orderRequestSentAt: null, // can it be reseted ?
                // orderRequestSentByNuid: null,
              }, { transaction: tx });

              if (!App.isObject(setActiveOrderRes) || !App.isPosNumber(setActiveOrderRes.id))
                throw Error(`failed update courier: [${mCourier.id}]: and set: [hasActiveOrder + activeOrderId]`);

              if (job.isDebugOn())
                job.ok(`#order: ${ORDER_ID_LOCK}: #courier: ${mCourier.id}: has been updated`);

              await tx.commit();
              isTxExecuted = true;
              if (job.isDebugOn())
                job.ok(`#order: ${ORDER_ID_LOCK}: #tx: commited`);

            } catch (e) {
              job.error(`#order: ${ORDER_ID_LOCK}: #tx: ${e.message}`);

              try {
                // reset courier request/response bcs of failed update/set queries
                await mCourierOrderRequest.update({
                  isAccepted: false,
                  acceptedAt: null,
                  isRejected: false,
                  rejectedAt: null,
                }, /* {transaction: tx} */); // do not include in current tx
              } catch (e) { }

              if (App.Telegram && job.isDebugOn()) {
                App.Telegram.onError(`#${ORDER_ID_LOCK}: ${e.message}`);
              }

              await tx.rollback();

            } finally {

              if (!isTxExecuted) {
                job.error(`#order: ${ORDER_ID_LOCK}: #tx: failed to execute transaction`);
                continue;
              }

            }

            if (job.isDebugOn()) {
              job.info(`#order: ${ORDER_ID_LOCK}: transaction has been executed`);
              job.ok(`#order: ${ORDER_ID_LOCK}: assigned to Courier: ${mCourier.id}`);
            }

            {
              // pushes ...
              const courierAcceptedOrderPushRes = await App.getModel('CourierNotification')
                .pushToCourier(mCourier, {
                  type: App.getModel('CourierNotification').getTypes()['courierAcceptedOrder'],
                  title: `Order #${ORDER_ID_LOCK} Order Accepted.`,
                  message: `${App.t(['You have accepted order'])}`,
                  data: {
                    orderId: mOrder.id,
                    requestId: mRequest.id,
                  }
                });

              if (!courierAcceptedOrderPushRes.success) {
                job.error(`#order: ${ORDER_ID_LOCK}: #courierAcceptedOrderPushRes: ${courierAcceptedOrderPushRes.message}`);
                // keep processing, if this push is not delivered, is not critical 
              }

              // is it first courier in current order ? if it is, push info
              if (App.isNull(lastCourierId) || true /* push anyway */) {
                const mCourierUser = await App.getModel('User').findOne({
                  where: {
                    id: mCourier.userId,
                  },
                  attributes: [
                    'id', 'firstName', 'lastName', 'phone'
                  ]
                });

                const clientAcceptedOrderPushRes = await App.getModel('ClientNotification')
                  .pushToClient(mOrder.Client, {
                    type: App.getModel('ClientNotification').getTypes()['courierAcceptedOrder'],
                    title: `Order #${ORDER_ID_LOCK} Updated.`,
                    // message: `Your Drivers has accepted order`, // NOTE: TMP: verify @PM
                    message: `We found a driver to deliver your order. Will get there soon!`,
                    data: {
                      Courier: {
                        courierId: mCourier.id,
                        orderId: mOrder.id,
                        lat: mCourier.lat,
                        lon: mCourier.lon,
                        User: {
                          ...({
                            id=0,
                            firstName='n/a',
                            lastName='n/a',
                            phone='n/a',
                          } = App.isObject(mCourierUser) ? mCourierUser.toJSON() : {})
                        },
                      }
                    }
                  });

                if (!clientAcceptedOrderPushRes.success) {
                  job.error(`#order: ${ORDER_ID_LOCK}: #clientAcceptedOrderPushRes: ${clientAcceptedOrderPushRes.message}`);
                  // keep processing, if this push is not delivered, is not critical 
                }
              }
            }
            // success: done
            break;

          } // for Courier

          // if( process only one order-supplier): 
          // break;

        } // for Suppliers

      } catch (e) {
        job.error(`#order: ${ORDER_ID_LOCK}: [error]: ${e.message}`);
      } finally {
        mOrder = await findNextOrder({
          id: ORDER_ID_LOCK,
          isLocked: true,
          status: statuses['processing'],
          lockedByNuid: App.getNodeUID(),
          isCanceledByClient: false,
        }, false, job);

        if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
          if (job.isDebugOn())
            job.ok(`#order: ${ORDER_ID_LOCK}: finally: order has been processed ...`);
          break;

        } else {
          if (job.isDebugOn())
            job.debug(`#order: ${ORDER_ID_LOCK}: finally: no courier has been found, sleep: ${AWAIT_NEXT_LOOP} mSec`);
          // await 1 minute if non of all Courier could/can take it
          await console.sleep(AWAIT_NEXT_LOOP);
        }

      }

    } // while

    // const releaseOrderLock = await mOrder.update({isLocked: false});
    // if( !App.isObject(releaseOrderLock) || releaseOrderLock.isLocked ){
    //   job.error(`#order: ${ORDER_ID_LOCK}: order-lock: could not release`);
    //   return await console.sleep(2000);
    // }

    if (job.isDebugOn())
      job.info(`#order: ${ORDER_ID_LOCK}: done`);

  });

  // Job.start();
  return Job;

}
