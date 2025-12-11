/**
 * Automated Second Payment Processing Job
 * Processes second payments (50%) for catering and on-site-presence orders
 * when the payment due date is reached (3 days before event)
 */

module.exports = async (App, params, BaseJob, jobName = 'n/a', config = {}) => {
  const Job = new BaseJob(App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // Ensure only one instance runs at a time
    isEnabled: true, // Enable for production
    runOnce: false,
    runAtStart: false,
    debug: config.debug || App.isEnv('dev'),
    runAt: [
      // Run every 6 hours to check for due second payments
      { each: 12, type: 'hours' },
      // Alternative: Run daily at 8 AM
      // { at: 8, type: 'hours' },
    ],
  });

  Job.on('task', async (job, { each = 0, type = 'n/a' }) => {
    if (job.isDebugOn()) {
      job.line();
      job.log(` #SecondPaymentProcessor: start-on: #nuid: ${App.getNodeUID()}, start at: ${App.getISODate()}`);
    }

    try {
      // Find all orders with due second payments
      const dueOrders = await App.payments['split-payment-processor'].findOrdersWithDueSecondPayments();

      if (!dueOrders || dueOrders.length === 0) {
        if (job.isDebugOn()) {
          job.debug(` No orders with due second payments found`);
        }
        return;
      }

      if (job.isDebugOn()) {
        job.info(` Found ${dueOrders.length} order(s) with due second payments`);
      }

      let processedCount = 0;
      let failedCount = 0;
      const results = [];

      // Process each order
      for (const orderInfo of dueOrders) {
        try {
          if (job.isDebugOn()) {
            job.debug(` Processing order #${orderInfo.orderId} (${orderInfo.orderType})`);
            job.debug(`   - Second payment amount: $${orderInfo.secondPaymentAmount}`);
            job.debug(`   - Due date: ${orderInfo.secondPaymentDueDate}`);
            job.debug(`   - Event date: ${orderInfo.eventDate}`);
          }

          // Process the second payment
          const result = await App.payments['split-payment-processor'].processSecondPayment(orderInfo.orderId);

          if (result.success) {
            processedCount++;
            if (job.isDebugOn()) {
              job.ok(` Order #${orderInfo.orderId}: Second payment processed successfully`);
            }

            // Send email notification to client
            try {
              const mOrder = await App.getModel('Order').findOne({
                where: { id: orderInfo.orderId },
                include: [{
                  model: App.getModel('Client'),
                  include: [{
                    model: App.getModel('User')
                  }]
                }]
              });

              if (mOrder && mOrder.Client && mOrder.Client.User) {
                const mUser = mOrder.Client.User;

                if (App.BrevoMailer && App.BrevoMailer.isEnabled) {
                  const validation = App.BrevoMailer.validateEmailRecipient(mUser);
                  if (validation.isValid) {
                    await App.BrevoMailer.sendOrderNotification({
                      to: validation.email,
                      clientName: mUser.fullName || mUser.firstName,
                      orderId: orderInfo.orderId,
                      type: 'payment_processed',
                      data: {
                        orderType: orderInfo.orderType,
                        paymentAmount: orderInfo.secondPaymentAmount.toFixed(2),
                        paymentType: 'second_payment',
                        eventDate: orderInfo.eventDate
                      }
                    });

                    if (job.isDebugOn()) {
                      job.ok(` Email notification sent to ${validation.email}`);
                    }
                  }
                }
              }
            } catch (emailError) {
              job.error(` Failed to send email notification: ${emailError.message}`);
            }
          } else {
            failedCount++;
            job.error(` Order #${orderInfo.orderId}: Failed to process second payment: ${result.message}`);
          }

          results.push({
            orderId: orderInfo.orderId,
            orderType: orderInfo.orderType,
            success: result.success,
            message: result.message
          });

        } catch (orderError) {
          failedCount++;
          job.error(` Order #${orderInfo.orderId}: Exception: ${orderError.message}`);
          results.push({
            orderId: orderInfo.orderId,
            orderType: orderInfo.orderType,
            success: false,
            message: orderError.message
          });
        }
      }

      // Summary
      if (job.isDebugOn()) {
        job.line();
        job.info(` Summary:`);
        job.info(`   - Total orders processed: ${dueOrders.length}`);
        job.ok(`   - Successful: ${processedCount}`);
        if (failedCount > 0) {
          job.error(`   - Failed: ${failedCount}`);
        }
        job.line();
      }

    } catch (e) {
      job.error(` #SecondPaymentProcessor: ${e.message}`);
      console.error(e);
    }

    if (job.isDebugOn()) {
      job.info(` job: done.`);
    }
  });

  return Job;
};
