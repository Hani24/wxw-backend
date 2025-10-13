const express = require('express');
const router = express.Router();

module.exports = function(App, RPath) {
  router.use('', async (req, res) => {
    try {
      //const id = parseInt(req.params.id);
      const id = parseInt(req.body.id);

	    const { deliveryNotes } = req.body;

      // Input validation
      if (!id) {
        return App.json(res, {
          success: false,
          message: 'Order ID is required',
        });
      }

      // Validate that ID is a positive number
      if (!Number.isInteger(id) || id <= 0) {
        return App.json(res, {
          success: false,
          message: 'Invalid Order ID format',
        });
      }

      // Get current timestamp
      const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

      try {
        // Using Sequelize to update the order
        const Order = App.getModel('Order'); // Adjust this to match your model name
        const result = await Order.update(
          {
            status: 'delivered',
            isDeliveredByCourier: true,
            deliveredByCourierAt: currentTimestamp,
            updatedAt: currentTimestamp,
          },
          {
            where: {
              id
            },
          }
        );

        if (result[0] === 0) {
          return App.json(res, {
            success: false,
            message: 'Order not found or cannot be marked as delivered',
          });
        }

        App.logger.info(`[Order Delivery]: Order ${id} marked as delivered at ${currentTimestamp}`);

        return App.json(res, {
          success: true,
          message: 'Order marked as delivered successfully',
          data: {
            orderId: id,
            deliveredAt: currentTimestamp,
          },
        });
      } catch (dbError) {
        App.logger.error(`[Database Error]: Failed to mark order ${id} as delivered - ${dbError.message}`);
        throw dbError;
      }
    } catch (error) {
      App.logger.error(`[API Error]: Order delivery endpoint - ${error.message}`);
      return App.onRouteError(req, res, error);
    }
  });

  return {
    router,
    method: 'post',
    autoDoc: {
      description: 'Mark an order as delivered',
      params: {
        id: 'Order ID (required)',
      },
      body: {
        deliveryNotes: 'Optional delivery notes',
      },
    },
  };
};

