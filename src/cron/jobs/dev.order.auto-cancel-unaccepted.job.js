module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // Prevent concurrent executions
    isEnabled: false, // Enable this job
    runOnce: false,
    runAtStart: false,
    debug: config.debug,
    runAt: [
      { each: 15, type: 'minutes' }, // Run every 15 minutes to check for expired orders
    ],
  });

  Job.on('task', async(job)=>{

    const statuses = App.getModel('Order').getStatuses();
    const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

    try{

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - (15 * 60 * 1000)); // 10 minutes ago

      if(job.isDebugOn()){
        job.debug(`start on: [${App.getNodeUID()}] at: ${App.getISODate()}`);
        job.debug(`checking for orders created before: ${fiveMinutesAgo.toISOString()}`);
      }

      // Find all orders that:
      // 1. Are in 'created' or 'processing' status (awaiting restaurant response)
      // 2. Were created more than 5 minutes ago
      // 3. Have not been accepted by restaurant yet
      // 4. Have not been canceled or rejected
      // 5. Apply to ALL order types (order-now, catering, on-site-presence)
      const expiredOrders = await App.getModel('Order').findAll({
        transaction: tx,
        lock: tx.LOCK.UPDATE,
        skipLocked: true,
        where: {
          status: {
            [App.DB.Op.in]: [statuses.created, statuses.processing]
          },
          createdAt: {
            [App.DB.Op.lt]: fiveMinutesAgo, // Created more than 5 minutes ago
          },
          isCanceledByClient: false,
          isRejectedByClient: false,
        },
        include: [
          {
            required: true,
            model: App.getModel('OrderSupplier'),
            where: {
              isAcceptedByRestaurant: false, // Not accepted yet
              isCanceledByRestaurant: false, // Not canceled yet
            },
            attributes: [
              'id',
              'restaurantId',
              'isRestaurantNotified',
              'isRestaurantAcknowledged',
              'isAcceptedByRestaurant',
              'isCanceledByRestaurant',
              'createdAt'
            ],
            include: [{
              model: App.getModel('Restaurant'),
              attributes: ['id', 'name'],
            }],
          },
          {
            required: true,
            model: App.getModel('Client'),
            attributes: ['id', 'userId'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id', 'email', 'firstName', 'lastName'],
            }],
          }
        ],
        attributes: [
          'id',
          'clientId',
          'status',
          'orderType',
          'finalPrice',
          'isPaid',
          'paymentIntentId',
          'clientSecret',
          'createdAt',
          'isValidChecksum',
          'checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        order: [['id', 'asc']],
        limit: 20, // Process 20 at a time to avoid overload
      });

      if( !App.isArray(expiredOrders) || !expiredOrders.length ){
        await tx.rollback();
        if(job.isDebugOn()){
          job.info(`no expired orders found`);
          job.ok(`done`);
        }
        return;
      }

      if(job.isDebugOn())
        job.debug(` found ${expiredOrders.length} expired order(s)`);

      for( const mOrder of expiredOrders ){

        if(job.isDebugOn())
          job.log(`   #order: [${mOrder.id}] (${mOrder.orderType}): processing auto-cancellation`);

        const client = mOrder.Client;
        const orderSuppliers = mOrder.OrderSuppliers;

        if(!App.isArray(orderSuppliers) || !orderSuppliers.length){
          job.warn(`   #order: [${mOrder.id}]: no order suppliers found, skipping`);
          continue;
        }

        const orderSupplier = orderSuppliers[0];
        const restaurant = orderSupplier && orderSupplier.Restaurant ? orderSupplier.Restaurant : { id: null, name: 'Unknown' };

        const metadata = {
          orderId: mOrder.id,
          orderType: mOrder.orderType,
          userId: client.User.id,
          clientId: client.id,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          finalPrice: mOrder.finalPrice,
          autoRejected: true,
          reason: 'Restaurant did not accept the order within 5 minutes',
          createdAt: mOrder.createdAt,
        };

        if(job.isDebugOn())
          job.json({metadata});

        // Mark all OrderSuppliers as canceled with reason
        for( const orderSupplier of orderSuppliers ){
          await orderSupplier.update({
            isCanceledByRestaurant: true,
            canceledByRestaurantAt: now,
            cancellationReason: 'auto-cancel: restaurant did not respond within 5 minutes',
          }, {transaction: tx});

          if(job.isDebugOn())
            job.warn(`   #order: [${mOrder.id}]: supplier [${orderSupplier.id}] marked as canceled`);
        }

        // Process refund if payment was made
        let refundProcessed = false;
        let newStatus = statuses.canceled;

        if(mOrder.isPaid && App.isString(mOrder.paymentIntentId)){

          if(job.isDebugOn())
            job.debug(`   #order: [${mOrder.id}]: processing refund for payment intent: ${mOrder.paymentIntentId}`);

          try{
            // Cancel the payment intent first
            const paymentIntentCancelRes = await App.payments.stripe.paymentIntentCancel(
              mOrder.paymentIntentId,
              {}
            );

            if(job.isDebugOn())
              job.debug(`   #order: [${mOrder.id}]: payment intent cancel result: ${paymentIntentCancelRes.message}`);

            // Then refund if it was already captured
            const paymentIntentRefundRes = await App.payments.stripe.paymentIntentRefund(
              mOrder.paymentIntentId,
              {
                reason: 'requested_by_customer',
                metadata: metadata,
              }
            );

            if(job.isDebugOn())
              job.ok(`   #order: [${mOrder.id}]: refund processed: ${paymentIntentRefundRes.message}`);

            refundProcessed = true;
            newStatus = statuses.refunded;

          }catch(stripeError){
            job.error(`   #order: [${mOrder.id}]: stripe refund error: ${stripeError.message}`);
            // Continue with cancellation even if refund fails
            // Manual refund can be processed later
          }

        }

        // Update order status
        await mOrder.update({
          status: newStatus,
          cancellationReason: 'Restaurant did not accept the order within 5 minutes (auto-canceled)',
          checksum: true,
        }, {transaction: tx});

        if(job.isDebugOn())
          job.ok(`   #order: [${mOrder.id}]: status updated to [${newStatus}]`);

        // Send notifications to restaurant about cancellation
        const ackTimeout = (10*1000); // 10 seconds
        const restaurantNotifyData = {
          ack: false,
          event: App.getModel('RestaurantNotification').getEvents()['orderCanceled'],
          type: App.getModel('RestaurantNotification').getTypes()['orderCanceled'],
          data: metadata,
        };

        for( const orderSupplier of orderSuppliers ){
          App.getModel('RestaurantNotification')
            .notifyById( orderSupplier.restaurantId, restaurantNotifyData, ackTimeout )
            .then((notifyRes)=>{
              if(job.isDebugOn())
                job.log(` #order: [${mOrder.id}]: restaurant [${orderSupplier.restaurantId}]: event: [${restaurantNotifyData.event}], notify: ${notifyRes.message}`);
            })
            .catch((err)=>{
              job.error(` #order: [${mOrder.id}]: restaurant notification error: ${err.message}`);
            });
        }

        // Send notification to client about auto-cancellation
        try{
          const clientNotifyRes = await App.getModel('ClientNotification').pushToClientById(
            client.id,
            {
              type: App.getModel('ClientNotification').getTypes()['supplierCanceledOrder'],
              title: `Order #${mOrder.id} has been canceled`,
              message: refundProcessed
                ? `Your order has been automatically canceled because the restaurant did not respond within 5 minutes. A full refund has been processed.`
                : `Your order has been automatically canceled because the restaurant did not respond within 5 minutes.`,
              data: {
                orderId: mOrder.id,
                refunded: refundProcessed,
                reason: 'Restaurant did not respond within 5 minutes',
              }
            }
          );

          if(job.isDebugOn()){
            if(clientNotifyRes.success){
              job.ok(`   #order: [${mOrder.id}]: client notification sent`);
            } else {
              job.error(`   #order: [${mOrder.id}]: client notification failed: ${clientNotifyRes.message}`);
            }
          }

        }catch(notifyError){
          job.error(`   #order: [${mOrder.id}]: client notification error: ${notifyError.message}`);
        }

        if(job.isDebugOn())
          job.ok(`   #order: [${mOrder.id}]: auto-canceled successfully, refund: ${refundProcessed ? 'processed' : 'not applicable'}`);

        // Small delay between orders
        if( expiredOrders.length > 1 )
          await console.sleep(150);

      } // /for(order of expiredOrders)

      await tx.commit();

      if(job.isDebugOn())
        job.ok(` processed ${expiredOrders.length} expired order(s) successfully`);

    }catch(e){
      job.error(`Error: ${e.message}`);
      job.error(e.stack);
      await tx.rollback();
    }

    if(job.isDebugOn()) {
      job.info(` done.`);
      job.log(``);
    }

  });

  return Job;

};
