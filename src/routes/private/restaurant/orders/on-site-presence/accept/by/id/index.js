const express = require('express');
const router = express.Router();

// {
//   "orderId": "required: <number>: Ref. Order.id"
// }

// /private/restaurant/orders/on-site-presence/accept/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const orderId = req.getCommonDataInt('orderId', null);

      if(App.isNull(orderId))
        return App.json(res, 417, App.t(['Order ID is required'], req.lang));

      const statuses = App.getModel('Order').getStatuses();

      // Find the order (need to join through OrderSupplier to filter by restaurant)
      const mOrder = await App.getModel('Order').findOne({
        where: {
          id: orderId,
          orderType: 'on-site-presence',
          status: statuses['created'],
        },
        include: [
          {
            model: App.getModel('OrderOnSitePresenceDetails'),
            required: true,
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

      const details = mOrder.OrderOnSitePresenceDetail;

      // Check if already accepted or rejected
      if(details.restaurantAcceptedAt)
        return App.json(res, 417, App.t(['Order already accepted'], req.lang));

      if(details.restaurantRejectedAt)
        return App.json(res, 417, App.t(['Order already rejected'], req.lang));

      // Check if deadline has passed
      const now = new Date();
      const deadline = new Date(details.acceptanceDeadline);

      if(deadline < now)
        return App.json(res, 417, App.t(['Acceptance deadline has passed'], req.lang));

      // Accept the order
      const transaction = await App.DB.sequelize.transaction();

      try{

        // Mark as accepted
        await details.update({
          restaurantAcceptedAt: now,
        }, { transaction });

        // Update order status to processing
        await mOrder.update({
          status: statuses['processing'],
        }, { transaction });

        await transaction.commit();

        // TODO: Send notification to client about acceptance
        // TODO: Consider confirming the Stripe payment intent here

        await App.json(res, true, App.t(['Order accepted successfully'], req.lang), {
          orderId: mOrder.id,
          orderNumber: mOrder.orderNumber,
          status: 'processing',
          acceptedAt: details.restaurantAcceptedAt,
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

  return { router, method: '', autoDoc:{} };

};
