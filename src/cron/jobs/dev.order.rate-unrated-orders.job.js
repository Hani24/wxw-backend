module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: true, // each sub-"process" own order
    isEnabled: true,
    runOnce: false,
    runAtStart: false,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      // { each: 2, type: 'seconds' },
      { each: 1, type: 'minutes' },
      // { each: 1, type: 'hours' },
      // { each: 10, type: 'minutes' },
      // { each: 10, type: 'hours' },
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    const statuses = App.getModel('Order').getStatuses();

    // 20 minutes after delivery
    const minTimePastFromDeliveryDate = App.DT.subFromDate({amount: 20, of: 'minutes'});

    const mOrders = await App.getModel('Order').findAll({
      where: {
        status: statuses.delivered,
        // isCourierRatedByClient: false,
        isOrderRateRequestSent: false,
        isDeliveredByCourier: true,
        deliveredByCourierAt: { [App.DB.Op.lte]: minTimePastFromDeliveryDate },
      },
      attributes: [
        'id',
        'clientId',
        'courierId',
        'lastCourierId',
        'isOrderRateRequestSent',
        'orderRateRequestSentAt'
      ],
      order: [['id','asc']],
      limit: 20,
    });

    if( !App.isArray(mOrders) || !mOrders.length ) 
      return; // job.info(` no-orders`);

    job.info(` start`);

    for( const mOrder of mOrders ){

      try{

        const {id: orderId, courierId, clientId} = mOrder;

        job.debug(` #order: ${mOrder.id}: push to client: [${clientId}]`);

        // once: don't flood client with pop-ups and pushes....
        await mOrder.update({
          isOrderRateRequestSent: true,
          orderRateRequestSentAt: App.getISODate(),
        });

        const mOrderSupplier = await App.getModel('OrderSupplier').findOne({
          where: { orderId },
          attributes: ['id'],
          include: [{
            model: App.getModel('OrderSupplierItem'),
            attributes: ['id','menuItemId'],
            include: [{
              model: App.getModel('MenuItem'),
              attributes: ['id','image'],
            }]
          }]
        });

        const image = App.isObject(mOrderSupplier) 
          && App.isObject(mOrderSupplier.OrderSupplierItems[0])
          && App.isObject(mOrderSupplier.OrderSupplierItems[0].MenuItem)
            ? mOrderSupplier.OrderSupplierItems[0].MenuItem.image
            : false;

        const pushToClientRes = await App.getModel('ClientNotification')
          .pushToClientById( clientId, {
            type: App.getModel('ClientNotification').getTypes()['rateOrder'],
            title: `Order #${orderId}: ${ App.t(['Please rate your order.']) }`,
            message: ``,
            data: {
              image,
              orderId,
              clientId,
              courierId,
            }
          });

        if( !pushToClientRes.success ){
          job.json({pushToClientRes});
        }

      }catch(e){
        job.error(` #order: ${mOrder.id}: ${e.message}`);
      }

      await console.sleep(50);

    }

    job.info(` done`);

  });

  // Job.start();
  return Job;

}
