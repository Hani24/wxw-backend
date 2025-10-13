module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  if( !App.isNodeOfTypeEnabled('master') ){
    return false;
  }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // each sub-"process" own order
    isEnabled: true,
    runOnce: false,
    runAtStart: false,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      // dev
      { each: 30, type: 'seconds' },
      // prod
      // { each: 60, type: 'seconds' },
    ],
  });

  const lockNode = async(mNode)=>{
    try{
      const mState = await mNode.update({
        isLocked: true, 
        lockedAt: App.getISODate()
      });
      return App.isObject(mState) && App.isPosNumber(mState.id) && mState.isLocked;
    }catch(e){
      console.error(`lockNode: ${mNode.id} => ${mNode.nuid}: ${e.message}`);
      return false;
    }

  }
  const unlockNode = async(mNode)=>{
    try{
      const mState = await mNode.update({
        isLocked: false, 
        lockedAt: null
      });
      return App.isObject(mState) && App.isPosNumber(mState.id) && mState.isLocked;
    }catch(e){
      console.error(`unlockNode: ${mNode.id} => ${mNode.nuid}: ${e.message}`);
      return false;
    }
  }

  Job.on('task', async(job, {each=0,type='n/a'})=>{
    if( App.isEnv('dev') )
      await console.sleep(2000);

    // const maxNodeAge = App.isEnv('dev')
    //   ? App.getModel('Order').getDefaultMaxAgeOfOrder()
    //   : App.DT.subFromDate({amount: 2, of: 'minutes'});

    let maxNodeAge = App.DT.moment().tz( App.getServerTz() );

    ( App.isEnv('dev') )
      ? maxNodeAge.subtract(5, 'seconds')
      : maxNodeAge.subtract(5, 'minutes');

    maxNodeAge = maxNodeAge.format(App.getDateFormat());

    const mMasterNodes = await App.getModel('MasterNode').findAll({
      where: {
        lastSeenAt: { [ App.DB.Op.lt ]: maxNodeAge },
        // isDeleted: false,
        isLocked: false,
      },
      // attributes: [
      //   'id','name','image','isOpen','rating','type','lat','lon'
      // ],
      // lock: tx.LOCK.UPDATE,
      // transaction: tx,
      // skipLocked: true,
      order: [['id','asc']],
      limit: 20,
    });

    if( !App.isArray(mMasterNodes) || !mMasterNodes.length ){
      if(job.isDebugOn()) job.warn(` no [not-valid] nodes`);
      return;      
    }

    if(job.isDebugOn()){
      job.line();
      job.log(` start-on: #nuid: ${App.getNodeUID()}, start at: ${App.getISODate()}`);      
      job.debug(` query: lte: ${maxNodeAge}`);
    }

    const statuses = await App.getModel('Order').getStatuses();
    const ageOfOrderDate = App.getModel('Order').getDefaultMaxAgeOfOrder();

    for( const mMasterNode of mMasterNodes ){

      const lastSeen = App.DT.moment(mMasterNode.lastSeenAt).fromNow();

      if(job.isDebugOn()) 
        job.log(` #MasterNode: ${mMasterNode.id} => ${mMasterNode.nuid}: last-seen: ${lastSeen}`);

      if( !(await lockNode(mMasterNode)) )
        continue;

      const mOrders = await App.getModel('Order').findAndCountAll({ 
        where: {
          // isPaid: false,
          isLocked: true,
          lockedByNuid: mMasterNode.nuid,
          status: statuses['processing'],
          courierId: null, // must be [null] else, all assignement is completed and order can exist/run/be processed on any api-slave/master
          // createdAt: { [ App.DB.Op.gt ]: ageOfOrderDate },
        },
        attributes: [
          'id',
          'clientId',
          'lastCourierId',
          'courierId',
          'isLocked', 'lockedAt',
          'isPaid', // 'paidAt', 
          'isRefunded', // 'refundedAt', 
          // 'isDeliveredByCourier', // 'deliveredByCourierAt', 
          // 'isCourierRatedByClient', // 'courierRatedByClientAt', 
          // 'isOrderRatedByClient', // 'orderRatedByClientAt', 
          // 'isOrderRateRequestSent', // 'orderRateRequestSentAt', 
          // 'isRejectedByClient', // 'rejectedByClientAt', 
          // 'isCanceledByClient', // 'canceledByClientAt', 
          // 'isClientDidGetInTouch', // 'clientDidGetInTouchAt', 
          // 'isPaymentRequestAllowed', // 'paymentRequestAllowedAt', 
          // 'isPaymentRequested', // 'paymentRequestedAt', 
          // 'isClientActionRequired', // 'clientActionRequiredAt', 
          // 'isClientActionExecuted', // 'clientActionExecutedAt', 
          // 'isPushedToProcessing', // 'pushedToProcessingAt', 
        ],
        // limit: 10,
        order: [['id','asc']],
      });

      let destroyNode = true; // mOrders.count == 0;
      if(job.isDebugOn()) {
        job.log(`   #nuid: ${mMasterNode.nuid}: orders: (${mOrders.rows.length} of ${mOrders.count}) `);
        job.log(`   #nuid: ${mMasterNode.nuid}: destroy-node: ${destroyNode} `);
      }

      for( const mOrder of mOrders.rows ){

        // job.json({ mOrder });
        // destroyNode = false;

        try{

          const ORDER_ID = mOrder.id;
          const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

          // old case, it current job: [order.find-courier.job] will complete all data or nothing
          // order can only exists with [locked==true] without [courierId] if node has crashed
          // if( App.isPosNumber(mOrder.courierId) ){
          //   const mCourier = await App.getModel('Courier').findOne({
          //     where: {
          //       id: mOrder.courierId,
          //       // id: { [App.DB.Op.or]: [ mOrder.courierId, mOrder.lastCourierId ] },
          //       // orderRequestSentByNuid: mMasterNode.nuid,
          //       [ App.DB.Op.or ]: {
          //         hasActiveOrder: true,
          //         activeOrderId: mOrder.id,                  
          //       }
          //     },
          //     attributes:['id','hasActiveOrder','activeOrderId','orderRequestSentByNuid'],
          //   });
          //   // CourierOrderRequest.courierId
          //   // CourierOrderRequest.orderId
          //   // CourierOrderRequest.isAccepted
          //   // CourierOrderRequest.isRejected
          //   if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){
          //     if( mCourier.activeOrderId === mOrder.id ){
          //       const updateCourier = await mCourier.update({
          //         isOrderRequestSent: false,
          //         orderRequestSentAt: null,
          //         orderRequestSentByNuid: null,
          //         hasActiveOrder: false,
          //         activeOrderId: null,
          //         activeOrderAt: null,
          //       }, {transaction: tx});
          //       if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          //         job.error(` #Order: [${mOrder.id}]: Courier: [${mCourier.id}] failed to release courier from current order`);
          //         destroyNode = false;
          //         await tx.rollback();
          //         continue;
          //       }
          //       job.ok(` #Order: [${mOrder.id}]: Courier: [${mCourier.id}] has been released from current order`);
          //     }
          //   }
          // }

          // Release order and push it back to processing if [mMasterNode.nuid] has crashed/restarted
          const updateOrder = await mOrder.update({
            isLocked: false,
            lockedAt: null,
            lockedByNuid: null,
          }, {transaction: tx});

          if( !App.isObject(updateOrder) || !App.isPosNumber(updateOrder.id) ){
            job.error(` #Order: [${mOrder.id}]: failed to update`);
            destroyNode = false;
            await tx.rollback();
            continue;
          }

          await tx.commit();
          if(job.isDebugOn()) 
            job.ok(` #Order: [${mOrder.id}] => #node: [${mMasterNode.nuid}]: updated`);

        }catch(e){
          job.error(` #Order: [${mOrder.id}] => #node: [${mMasterNode.nuid}]: error: ${e.message}`);
          destroyNode = false;
          await tx.rollback();
        }

        await console.sleep(150);

      } // /for( Order of Orders ) ...

      if( (await unlockNode(mMasterNode)) ){
        job.error(`   #node: ${mMasterNode.nuid}: failed to unlock`);
        continue;
      }

      if( !destroyNode ){
        if(job.isDebugOn()) 
          job.warn(`   #node: ${mMasterNode.nuid}: will not be destroyed: orders: (${mOrders.rows.length} of ${mOrders.count}) `);
        continue;
      }

      const updateMasterNodeRes = await mMasterNode.destroy();
      if( !App.isObject(updateMasterNodeRes) || !App.isPosNumber(updateMasterNodeRes.id) ){
        job.error(` #node: ${mMasterNode.nuid}: failed to destroy `);
        continue;
      }

      if(job.isDebugOn()) 
        job.ok(`   #node: ${mMasterNode.nuid}: has been destroyed `);

    } // /for( MasterNode of MasterNodes )

    if(job.isDebugOn()) {
      job.log(` done-on: #nuid: ${App.getNodeUID()}`);
      job.log(``);      
    }

  });

  // Job.start();
  return Job;

}
