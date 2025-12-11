module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // Prevent concurrent executions
    isEnabled: true, // Enable this job
    runOnce: false,
    runAtStart: false,
    debug: config.debug,
    runAt: [
      { each: 15, type: 'minutes' }, // Run every 15 minutes to check for expired orders
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    const statuses = App.getModel('Order').getStatuses();
    const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

    try{

      const now = new Date();

      if(job.isDebugOn()){
        job.debug(`start on: [${App.getNodeUID()}] at: ${App.getISODate()}`);
        job.debug(`checking for expired on-site presence orders...`);
      }

      // Find all on-site presence orders that:
      // 1. Are in 'created' status (awaiting restaurant response)
      // 2. Have passed their acceptance deadline
      // 3. Have not been accepted or rejected yet
      const expiredOrders = await App.getModel('Order').findAll({
        transaction: tx,
        lock: tx.LOCK.UPDATE,
        skipLocked: true,
        where: {
          orderType: 'on-site-presence',
          status: statuses.created,
        },
        include: [
          {
            required: true,
            model: App.getModel('OrderOnSitePresenceDetails'),
            as: 'OrderOnSitePresenceDetails',
            where: {
              restaurantAcceptedAt: null,
              restaurantRejectedAt: null,
              acceptanceDeadline: {
                [App.DB.Op.lt]: now, // Deadline has passed
              }
            }
          },
          {
            required: true,
            model: App.getModel('Client'),
            attributes: ['id', 'userId'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id', 'email', 'firstName', 'lastName'],
            }],
          },
          {
            required: false, // Changed to false to avoid join issues
            model: App.getModel('OrderSupplier'),
            attributes: ['id', 'restaurantId'],
            include: [{
              model: App.getModel('Restaurant'),
              attributes: ['id', 'name'],
            }],
          }
        ],
        order: [['id', 'asc']],
        limit: 10, // Process 10 at a time to avoid overload
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
          job.log(`   #order: [${mOrder.id}]: processing auto-rejection`);

        const details = mOrder.OrderOnSitePresenceDetails;
        const client = mOrder.Client;

        // Get OrderSupplier - it should exist, but handle gracefully if not
        let orderSuppliers = mOrder.OrderSuppliers;
        if(!App.isArray(orderSuppliers) || !orderSuppliers.length){
          // Fallback: fetch OrderSupplier separately if not included
          orderSuppliers = await App.getModel('OrderSupplier').findAll({
            where: { orderId: mOrder.id },
            include: [{
              model: App.getModel('Restaurant'),
              attributes: ['id', 'name'],
            }],
            transaction: tx,
          });
        }

        const orderSupplier = orderSuppliers && orderSuppliers.length > 0 ? orderSuppliers[0] : null;
        const restaurant = orderSupplier && orderSupplier.Restaurant ? orderSupplier.Restaurant : { id: null, name: 'Unknown' };

        const metadata = {
          orderId: mOrder.id,
          orderNumber: mOrder.orderNumber,
          userId: client.User.id,
          clientId: client.id,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          eventDate: details.eventDate,
          autoRejected: true,
          reason: 'Restaurant did not respond within 24 hours',
        };

        if(job.isDebugOn())
          job.json({metadata});

        // Mark details as rejected
        await details.update({
          restaurantRejectedAt: now,
          rejectionReason: 'Restaurant did not respond within the 24-hour acceptance window',
        }, {transaction: tx});

        // Process refund if payment was made
        let refundProcessed = false;

        if(mOrder.isPaid && mOrder.stripePaymentIntentId){

          if(job.isDebugOn())
            job.debug(`   #order: [${mOrder.id}]: processing refund for payment intent: ${mOrder.stripePaymentIntentId}`);

          try{
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

            // Create a refund
            const refund = await stripe.refunds.create({
              payment_intent: mOrder.stripePaymentIntentId,
              reason: 'requested_by_customer',
              metadata: metadata,
            });

            // Update order with refund information
            await mOrder.update({
              status: statuses.refunded,
              stripeRefundId: refund.id,
            }, {transaction: tx});

            refundProcessed = true;

            if(job.isDebugOn())
              job.ok(`   #order: [${mOrder.id}]: refund created: ${refund.id}`);

          }catch(stripeError){
            job.error(`   #order: [${mOrder.id}]: stripe refund error: ${stripeError.message}`);

            // Even if refund fails, mark order as canceled
            // Manual refund can be processed later
            await mOrder.update({
              status: statuses.canceled,
            }, {transaction: tx});
          }

        } else {
          // No payment made, just mark as canceled
          await mOrder.update({
            status: statuses.canceled,
          }, {transaction: tx});
        }

        // TODO: Send notification to client about auto-rejection
        // TODO: Send email with refund confirmation
        // Example:
        // App.getModel('ClientNotification').notifyById(client.id, {
        //   event: 'onSitePresenceOrderAutoRejected',
        //   data: metadata,
        // });

        if(job.isDebugOn())
          job.ok(`   #order: [${mOrder.id}]: auto-rejected, refund: ${refundProcessed ? 'processed' : 'not applicable'}`);

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
