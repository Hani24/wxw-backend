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
            as: 'OrderOnSitePresenceDetails',
            required: false,
          },
          {
            model: App.getModel('OrderCateringDetails'),
            as: 'OrderCateringDetails',
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
        ? mOrder.OrderOnSitePresenceDetails
        : isCatering
          ? mOrder.OrderCateringDetails
          : null;

      if(!details)
        return App.json(res, 404, App.t(['Order details not found'], req.lang));

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

        // Update order status to processing and mark all suppliers confirmed
        // For catering/on-site-presence orders, there's only one supplier (the restaurant)
        // so when they accept, all suppliers have confirmed
        await mOrder.update({
          status: statuses['processing'],
          allSuppliersHaveConfirmed: true,
          checksum: true, // Recalculate checksum after status change
        }, { transaction });

        // Update OrderSupplier to mark as accepted by restaurant
        await App.getModel('OrderSupplier').update(
          {
            isAcceptedByRestaurant: true,
          },
          {
            where: {
              orderId: mOrder.id,
              restaurantId: mRestaurant.id,
            },
            transaction,
          }
        );

        await transaction.commit();

        // TODO: Consider confirming the Stripe payment intent here

        await App.json(res, true, App.t(['Order accepted successfully'], req.lang), {
          orderId: mOrder.id,
          orderNumber: mOrder.orderNumber,
          status: 'processing',
          acceptedAt: details.restaurantAcceptedAt,
        });

        // Send email notification to client asynchronously (don't block response)
        (async () => {
          try {
            if (App.BrevoMailer && App.BrevoMailer.isEnabled) {
              // Fetch client with user details (include isGuest for validation)
              const mOrderWithClient = await App.getModel('Order').findByPk(mOrder.id, {
                include: [{
                  model: App.getModel('Client'),
                  required: true,
                  include: [{
                    model: App.getModel('User'),
                    attributes: ['email', 'fullName', 'firstName', 'isGuest']
                  }]
                }]
              });

              if (mOrderWithClient && mOrderWithClient.Client && mOrderWithClient.Client.User) {
                const clientUser = mOrderWithClient.Client.User;

                // Validate email recipient (skip guest users and invalid emails)
                const validation = App.BrevoMailer.validateEmailRecipient(clientUser);
                if (!validation.isValid) {
                  console.warn(` #OrderAccepted: Skipping email for order #${mOrder.id} - ${validation.reason}`);
                  return;
                }

                await App.BrevoMailer.sendOrderNotification({
                  to: validation.email,
                  clientName: clientUser.fullName || clientUser.firstName,
                  orderId: mOrder.id,
                  type: 'accepted',
                  data: {
                    restaurantName: mRestaurant.name,
                    eventDate: details.eventDate,
                    orderType: mOrder.orderType
                  }
                });
                console.ok(` #OrderAccepted: Email notification sent to ${validation.email} for order #${mOrder.id}`);
              }
            }
          } catch (emailError) {
            console.error(` #OrderAccepted: Failed to send email notification: ${emailError.message}`);
          }
        })();

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
