const express = require('express');
const router = express.Router();

// /private/restaurant/order-requests/get/all/?offset=0&limit=15&order=asc

module.exports = function(App, RPath) {
  router.use('', async (req, res) => {
    try {
      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const { offset, limit, order, by } = req.getPagination({ order: 'desc' });
      const orderBy = App.getModel('Order').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();

      const mOrders = await App.getModel('Order').findAndCountAll({
        where: {
          // isLocked: true, // Removed - allow unlocked orders to show
          allSuppliersHaveConfirmed: false,
          isCanceledByClient: false,
          [App.DB.Op.and]: {
            status: {
              [App.DB.Op.or]: [statuses.created, statuses.processing]
            }
          }
        },
        distinct: true,
        attributes: ['id', 'status', 'orderType', 'createdAt'],
        include: [
          {
            model: App.getModel('Courier'),
            attributes: ['id', 'isOnline', 'lat', 'lon', 'hasActiveOrder', 'activeOrderId'],
            include: [
              {
                model: App.getModel('User'),
                attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
              }
            ]
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
              isAcceptedByRestaurant: false,
              isCanceledByRestaurant: false,
              // isRequestCreated: true // Removed - allow all pending orders to show
            },
            attributes: ['id', 'isAcceptedByRestaurant', 'isCanceledByRestaurant', 'isRequestCreated', 'requestCreatedAt', 'requestTimeLeft', 'totalPrice', 'totalItems'],
            include: [
              {
                model: App.getModel('OrderSupplierItem'),
                attributes: ['id', 'price', 'amount', 'totalPrice'],
                include: [
                  {
                    model: App.getModel('MenuItem'),
                    attributes: ['id', 'name', 'image', 'description', 'price']
                  }
                ]
              }
            ]
          },
          {
            model: App.getModel('Client'),
            attributes: ['id', 'lat', 'lon'],
            include: [
              {
                model: App.getModel('User'),
                attributes: ['id', 'firstName', 'lastName', 'phone']
              }
            ]
          }
        ],
        order: [[orderBy, order]],
        offset: offset,
        limit: limit
      });

      App.json(res, true, App.t('success', res.lang), mOrders);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }
  });

  return { router, method: '', autoDoc: {} };
};

