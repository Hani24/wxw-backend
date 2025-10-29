const express = require('express');
const router = express.Router();

// Returns all pending orders (on-site-presence and catering) awaiting restaurant response
// Filters for:
// - orderType = 'on-site-presence' OR 'catering'
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
      const orderTypes = App.getModel('Order').getOrderTypes();

      // Get all pending orders (on-site-presence and catering) for this restaurant
      const orders = await App.getModel('Order').findAll({
        where: {
          orderType: [orderTypes['on-site-presence'], orderTypes['catering']],
          status: statuses['created'], // Only orders awaiting acceptance
        },
        include: [
          {
            model: App.getModel('OrderOnSitePresenceDetails'),
            required: false,
            where: {
              restaurantAcceptedAt: null,
              restaurantRejectedAt: null,
            }
          },
          {
            model: App.getModel('OrderCateringDetails'),
            required: false,
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
        ]
      });

      // Filter out orders where deadline has passed and format response
      const now = new Date();
      const formattedOrders = [];

      for(const order of orders) {
        const isOnSitePresence = order.orderType === orderTypes['on-site-presence'];
        const isCatering = order.orderType === orderTypes['catering'];

        const details = isOnSitePresence
          ? order.OrderOnSitePresenceDetail
          : isCatering
            ? order.OrderCateringDetail
            : null;

        if(!details) continue;

        const deadline = new Date(details.acceptanceDeadline);
        if(deadline <= now) continue; // Skip expired orders

        const client = order.Client;
        const user = client.User;
        const timeRemaining = Math.max(0, Math.floor((deadline - now) / 1000 / 60)); // Minutes remaining

        const orderData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          eventDate: details.eventDate,
          eventStartTime: details.eventStartTime || null,
          eventEndTime: details.eventEndTime || null,
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

        // Add type-specific fields
        if(isOnSitePresence) {
          orderData.numberOfPeople = details.numberOfPeople;
          orderData.numberOfHours = details.numberOfHours;
        } else if(isCatering) {
          orderData.deliveryMethod = details.deliveryMethod;
          orderData.deliveryAddress = details.deliveryAddress || null;
          orderData.estimatedTotalPeople = details.estimatedTotalPeople;
          orderData.paymentSchedule = {
            firstPayment: {
              amount: parseFloat(details.firstPaymentAmount),
              dueDate: details.firstPaymentDueDate,
              paidAt: details.firstPaymentPaidAt
            },
            secondPayment: {
              amount: parseFloat(details.secondPaymentAmount),
              dueDate: details.secondPaymentDueDate,
              paidAt: details.secondPaymentPaidAt
            }
          };
        }

        formattedOrders.push(orderData);
      }

      // Sort by acceptance deadline (most urgent first)
      formattedOrders.sort((a, b) =>
        new Date(a.acceptanceDeadline) - new Date(b.acceptanceDeadline)
      );

      await App.json(res, true, App.t(['Pending orders retrieved successfully'], req.lang), {
        orders: formattedOrders,
        totalPending: formattedOrders.length,
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
