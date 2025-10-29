const express = require('express');
const router = express.Router();

// {
//   "orderId": "required: <number>: Ref. Order.id",
//   "rejectionReason": "required: <string>: Reason for rejection"
// }

// /private/restaurant/orders/on-site-presence/reject/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const orderId = req.getCommonDataInt('orderId', null);
      const rejectionReason = req.getCommonDataString('rejectionReason', '').substr(0, 1000);

      if(App.isNull(orderId))
        return App.json(res, 417, App.t(['Order ID is required'], req.lang));

      if(App.isNull(rejectionReason) || rejectionReason.trim().length === 0)
        return App.json(res, 417, App.t(['Rejection reason is required'], req.lang));

      const statuses = App.getModel('Order').getStatuses();
      const orderTypes = App.getModel('Order').getOrderTypes();

      // Find the order (support both on-site-presence and catering)
      const mOrder = await App.getModel('Order').findOne({
        where: {
          id: orderId,
          orderType: [orderTypes['on-site-presence'], orderTypes['catering']],
          status: statuses['created'],
        },
        include: [
          {
            model: App.getModel('OrderOnSitePresenceDetails'),
            required: false,
          },
          {
            model: App.getModel('OrderCateringDetails'),
            required: false,
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
            },
          }
        ]
      });

      if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id))
        return App.json(res, 404, App.t(['Order not found'], req.lang));

      // Get details based on order type
      const isOnSitePresence = mOrder.orderType === orderTypes['on-site-presence'];
      const isCatering = mOrder.orderType === orderTypes['catering'];

      const details = isOnSitePresence
        ? mOrder.OrderOnSitePresenceDetail
        : isCatering
          ? mOrder.OrderCateringDetail
          : null;

      if(!details)
        return App.json(res, 404, App.t(['Order details not found'], req.lang));

      // Check if already accepted or rejected
      if(details.restaurantAcceptedAt)
        return App.json(res, 417, App.t(['Cannot reject an already accepted order'], req.lang));

      if(details.restaurantRejectedAt)
        return App.json(res, 417, App.t(['Order already rejected'], req.lang));

      // Reject the order and process refund
      const transaction = await App.DB.sequelize.transaction();

      try{

        const now = new Date();

        // Mark as rejected
        await details.update({
          restaurantRejectedAt: now,
          rejectionReason: rejectionReason,
        }, { transaction });

        // Update order status to canceled
        await mOrder.update({
          status: statuses['canceled'],
        }, { transaction });

        // Process refund if payment was made
        if(mOrder.isPaid && mOrder.stripePaymentIntentId){

          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

          try{
            // Create a refund for the payment intent
            const refund = await stripe.refunds.create({
              payment_intent: mOrder.stripePaymentIntentId,
              reason: 'requested_by_customer', // Restaurant rejection = customer request in Stripe terms
            });

            // Update order with refund information
            await mOrder.update({
              status: statuses['refunded'],
              stripeRefundId: refund.id,
            }, { transaction });

          }catch(stripeError){
            console.error('Stripe refund error:', stripeError);
            // Continue with order rejection even if refund fails
            // Manual refund can be processed later
            await mOrder.update({
              status: statuses['canceled'],
              // Log the refund failure for manual processing
            }, { transaction });
          }
        }

        await transaction.commit();

        // TODO: Send notification to client about rejection with reason
        // TODO: Send email with refund confirmation

        await App.json(res, true, App.t(['Order rejected successfully'], req.lang), {
          orderId: mOrder.id,
          orderNumber: mOrder.orderNumber,
          status: mOrder.status,
          rejectedAt: details.restaurantRejectedAt,
          rejectionReason: details.rejectionReason,
          refundProcessed: mOrder.status === statuses['refunded'],
        });

      }catch(err){
        await transaction.rollback();
        throw err;
      }

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
