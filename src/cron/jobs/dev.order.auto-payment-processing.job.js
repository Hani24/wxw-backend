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
      { each: 10, type: 'seconds' },
      // { each: 5, type: 'minutes' },
      // { each: 1, type: 'hours' },
      // { each: 10, type: 'minutes' },
      // { at: 10, type: 'hours' },
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    // NOTE: 2022-06-13: Updated: all order must be paid at order creation;
    return;

    const statuses = App.getModel('Order').getStatuses();

    const ageOfOrderDate = App.getModel('Order').getDefaultMaxAgeOfOrder();

    if(job.isDebugOn()){
      job.line();
      job.log(` start-on: #nuid: ${App.getNodeUID()}, start at: ${App.getISODate()}`);      
      job.debug(` query: createdAt:[gt] ${ageOfOrderDate}`);
    }

    const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

    let mOrder = await App.getModel('Order').findOne({
      where: {
        status: statuses['processing'],
        isPaid: false,
        isRefunded: false,
        // isLocked: true,
        // lockedByNuid: { [App.DB.Op.not]: null },
        courierId: { [App.DB.Op.not]: null },
        paymentIntentId: { [ App.DB.Op.not ]: null },
        isCanceledByClient: false,
        allSuppliersHaveConfirmed: true,
        isPaymentRequestAllowed: true,
        isPaymentRequested: false,
        isClientActionRequired: false,
        // createdAt: { [ App.DB.Op.gt ]: ageOfOrderDate },
        paymentRequestAllowedAt: { [ App.DB.Op.gt ]: ageOfOrderDate },
      },
      lock: tx.LOCK.UPDATE,
      transaction: tx,
      skipLocked: true,
      attributes: [
        'id',
        'status',
        'paymentIntentId',
        'clientId',
        'courierId',
        'isPaid', // 'paidAt',
        'isRefunded', // 'refundedAt',
        'isPaymentRequestAllowed', // 'paymentRequestAllowedAt',
        'isPaymentRequested', 'paymentRequestedAt',
        'isClientActionRequired', // 'clientActionRequiredAt',
        'isValidChecksum','checksum',
        ...App.getModel('Order').getChecksumKeys(),
      ],
      include: [
        {
          required: true,
          model: App.getModel('OrderPaymentType'),
          attributes: { exclude: ['createdAt','updatedAt'] },
          // include: [{
          //   required: false, // Can be null; if(GooglePay || ApplePay)
          //   model: App.getModel('PaymentCard'),
          // }],
        },
        {
          required: true,
          model: App.getModel('OrderSupplier'),
          attributes: [
            'id','restaurantId',
            'isValidChecksum','checksum',
            ...App.getModel('OrderSupplier').getChecksumKeys(),
          ]
        },
      ],
      order: [['id','asc']],
      // limit: 3,
    });

    if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) ){
      if(job.isDebugOn()) job.debug(` no order found`);
      await tx.rollback();
      return;
    }

    try{

      if(job.isDebugOn())
        job.debug(` #Order: ${mOrder.id}: exec: [intent-confirm]: ${mOrder.paymentIntentId}`);

      const paymentIntentConfirmRes = await App.payments.stripe.paymentIntentConfirm( mOrder.paymentIntentId );
      if( !paymentIntentConfirmRes.success ){
        job.error(` #Order: ${mOrder.id}: #stripe: paymentIntentConfirmRes: ${paymentIntentConfirmRes.message}`);

        mOrder = await mOrder.update({
          isPaymentRequested: true,
          paymentRequestedAt: App.getISODate(),
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) ){
          job.error(` #Order: ${mOrder.id}: failed update order`);
          await tx.rollback();
          return;
        }

        job.debug(` #Order: ${mOrder.id}: #stripe: [payment-confirm] failed, order update: ok`);
        return;
      }

      if(job.isDebugOn())
        job.ok(` #Order: ${mOrder.id}: #stripe: paymentIntentConfirmRes: ${paymentIntentConfirmRes.message}`);

      mOrder = await mOrder.update({
        // isClientActionRequired: false,
        // clientActionRequiredAt: null,
        isPaymentRequestAllowed: false,
        paymentRequestAllowedAt: null,
        isPaymentRequested: true,
        paymentRequestedAt: App.getISODate(),
        checksum: true,
      }, {transaction: tx});
      // job.debug({mOrder});

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) ){
        job.error(` #Order: ${mOrder.id}: failed update order: ${mOrder.id}`);
        job.json({mOrder});
        return await tx.rollback();
      }

      await tx.commit();
      if(job.isDebugOn())
        job.ok(` #Order: ${mOrder.id}: #stripe: [success], #order: [processed] ...`);

    }catch(e){
      job.error(` #Order: ${mOrder.id}: (payment-loop): ${e.message}`);
      await tx.rollback();
    }

    // const mOrderPaymentType = await App.getModel('OrderPaymentType').findOne({
    //   where: { orderId: mRequest.Order.id }
    // });

    // if( !App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id) ){
    //   job.error(` failed to get OrderPaymentType`);
    //   job.json({mRequest});
    //   return;
    // }

    if(job.isDebugOn())
      job.info(`job: done.`);

  });

  // Job.start();
  return Job;

}

