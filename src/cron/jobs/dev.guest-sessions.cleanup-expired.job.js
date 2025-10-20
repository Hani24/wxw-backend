module.exports = async (App, params, BaseJob, jobName = 'n/a', config = {}) => {

  const Job = new BaseJob(App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // Prevent multiple cleanup instances
    isEnabled: true,
    runOnce: false,
    runAtStart: false, // Don't run immediately on startup
    debug: config.debug,
    runAt: [
      // Run daily at 3 AM
      { at: 3, type: 'hours' },
    ],
  });

  Job.on('task', async (job, {each = 0, type = 'n/a'}) => {

    try {

      if (job.isDebugOn()) {
        job.debug(`Starting guest session cleanup on: [${App.getNodeUID()}] at: ${App.getISODate()}`);
      }

      const statuses = App.getModel('Order').getStatuses();
      const now = App.getISODate();

      // Find all expired guest sessions that haven't been converted
      const expiredSessions = await App.getModel('GuestSession').findAll({
        where: {
          isDeleted: false,
          isConverted: false,
          expiresAt: {
            [App.DB.Op.lt]: now,
          }
        },
        include: [
          {
            model: App.getModel('User'),
            attributes: ['id', 'isGuest', 'firstName', 'lastName'],
          },
          {
            model: App.getModel('Client'),
            attributes: ['id'],
          }
        ]
      });

      if (!App.isArray(expiredSessions) || expiredSessions.length === 0) {
        if (job.isDebugOn()) {
          job.info('No expired guest sessions found');
          job.ok('Done');
        }
        return;
      }

      if (job.isDebugOn()) {
        job.debug(`Found ${expiredSessions.length} expired guest sessions`);
      }

      let deletedCount = 0;
      let extendedCount = 0;
      let errorCount = 0;

      for (const session of expiredSessions) {

        if (job.isDebugOn()) {
          job.log(`  Processing session ID: ${session.id}, userId: ${session.userId}, clientId: ${session.clientId}`);
        }

        try {

          // Check if guest has any active orders
          const activeOrdersCount = await App.getModel('Order').count({
            where: {
              clientId: session.clientId,
              status: {
                [App.DB.Op.or]: [
                  statuses.created,
                  statuses.processing,
                ]
              }
            }
          });

          if (activeOrdersCount > 0) {
            // Extend expiration by 24 hours if they have active orders
            const newExpiresAt = App.DT.moment().add(24, 'hours').format(App.getDateFormat());

            await session.update({
              expiresAt: newExpiresAt,
            });

            // Update user expiration as well
            if (App.isObject(session.User)) {
              await session.User.update({
                guestExpiresAt: newExpiresAt,
              });
            }

            extendedCount++;

            if (job.isDebugOn()) {
              job.info(`  Extended session ${session.id} due to ${activeOrdersCount} active order(s)`);
            }

          } else {

            // Check if they have any completed orders (keep their data for analytics)
            const completedOrdersCount = await App.getModel('Order').count({
              where: {
                clientId: session.clientId,
              }
            });

            // Soft delete the session
            await session.update({
              isDeleted: true,
              deletedAt: App.getISODate(),
            });

            // Soft delete user and client if they have no orders, or hard data requirements
            if (App.isObject(session.User)) {
              await session.User.update({
                isDeleted: true,
                deletedAt: App.getISODate(),
              });
            }

            if (App.isObject(session.Client)) {
              await session.Client.update({
                isDeleted: true,
                deletedAt: App.getISODate(),
              });
            }

            // Delete cart items for this guest
            const mCart = await App.getModel('Cart').getByClientId(session.clientId);
            if (App.isObject(mCart) && App.isPosNumber(mCart.id)) {
              await App.getModel('CartItem').destroy({
                where: {cartId: mCart.id}
              });

              if (job.isDebugOn()) {
                job.debug(`  Deleted cart items for client ${session.clientId}`);
              }
            }

            deletedCount++;

            if (job.isDebugOn()) {
              job.ok(`  Deleted session ${session.id} (${completedOrdersCount} completed orders)`);
            }
          }

        } catch (sessionError) {
          errorCount++;
          job.error(`  Error processing session ${session.id}: ${sessionError.message}`);
        }

      }

      if (job.isDebugOn()) {
        job.info(`Cleanup summary:`);
        job.info(`  - Deleted: ${deletedCount} sessions`);
        job.info(`  - Extended: ${extendedCount} sessions`);
        job.info(`  - Errors: ${errorCount} sessions`);
        job.ok('Done');
      }

    } catch (e) {
      job.error(`Guest session cleanup error: ${e.message}`);
      console.error(e);
    }

  });

  return Job;

};
