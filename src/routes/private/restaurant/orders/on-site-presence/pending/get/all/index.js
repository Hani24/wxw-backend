const express = require('express');
const router = express.Router();

// Returns all pending on-site presence orders awaiting restaurant response
// Filters for:
// - orderType = 'on-site-presence'
// - status = 'created' (not yet accepted/rejected)
// - acceptanceDeadline not passed
// - ordered by acceptance deadline (most urgent first)

// /private/restaurant/orders/on-site-presence/pending/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const statuses = App.getModel('Order').getStatuses();

      // Get all pending on-site presence orders for this restaurant
      const orders = await App.getModel('Order').findAll({
        where: {
          orderType: 'on-site-presence',
          status: statuses['created'], // Only orders awaiting acceptance
        },
        include: [
          {
            model: App.getModel('OrderOnSitePresenceDetails'),
            required: true,
            where: {
              restaurantAcceptedAt: null,
              restaurantRejectedAt: null,
            }
          },
          {
            model: App.getModel('Client'),
            required: true,
            attributes: ['id', 'userId'],
            include: [{
              model: App.getModel('User'),
              required: true,
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            }]
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
            },
            attributes: ['id', 'restaurantId'],
          }
        ],
        order: [
          [App.getModel('OrderOnSitePresenceDetails'), 'acceptanceDeadline', 'ASC'] // Most urgent first
        ]
      });

      // Filter out orders where deadline has passed
      const now = new Date();
      const activeOrders = orders.filter(order => {
        const deadline = new Date(order.OrderOnSitePresenceDetail.acceptanceDeadline);
        return deadline > now;
      });

      // Format response
      const formattedOrders = activeOrders.map(order => {
        const details = order.OrderOnSitePresenceDetail;
        const client = order.Client;
        const user = client.User;

        const deadline = new Date(details.acceptanceDeadline);
        const timeRemaining = Math.max(0, Math.floor((deadline - now) / 1000 / 60)); // Minutes remaining

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          eventDate: details.eventDate,
          eventStartTime: details.eventStartTime || null,
          eventEndTime: details.eventEndTime || null,
          numberOfPeople: details.numberOfPeople,
          numberOfHours: details.numberOfHours,
          specialRequests: details.specialRequests || null,
          estimatedTotalPrice: parseFloat(details.estimatedTotalPrice),
          estimatedBasePrice: parseFloat(details.estimatedBasePrice),
          estimatedServiceFee: parseFloat(details.estimatedServiceFee),
          acceptanceDeadline: details.acceptanceDeadline,
          timeRemainingMinutes: timeRemaining,
          createdAt: order.createdAt,
          client: {
            id: client.id,
            userId: client.userId,
          },
          user: {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
          }
        };
      });

      await App.json(res, true, App.t(['Pending orders retrieved successfully'], req.lang), {
        orders: formattedOrders,
        totalPending: formattedOrders.length,
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
