const express = require('express');
const router = express.Router();

// DEV ONLY: Get all orders regardless of status
// /public/dev/orders/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const { offset, limit, order, by } = req.getPagination({
        offset: 0,
        limit: 50,
        order: 'desc'
      });

      const orderBy = App.getModel('Order').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();

      const mOrders = await App.getModel('Order').findAndCountAll({
        where: {
          // No filters - show all orders
        },
        distinct: true,
        attributes: [
          'id', 'clientId', 'status', 'totalPrice', 'deliveryPrice',
          'finalPrice', 'totalItems', 'isLocked', 'allSuppliersHaveConfirmed',
          'isCanceledByClient', 'isPaid', 'isRefunded', 'createdAt', 'updatedAt'
        ],
        include: [
          {
            model: App.getModel('Client'),
            required: false,
            attributes: ['id', 'userId'],
            include: [{
              model: App.getModel('User'),
              required: false,
              attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
            }]
          },
          {
            model: App.getModel('OrderSupplier'),
            required: false,
            attributes: [
              'id', 'restaurantId', 'totalPrice', 'totalItems',
              'isAcceptedByRestaurant', 'isCanceledByRestaurant',
              'isRequestCreated', 'isOrderReady'
            ],
            include: [
              {
                model: App.getModel('Restaurant'),
                required: false,
                attributes: ['id', 'name', 'email']
              },
              {
                model: App.getModel('OrderSupplierItem'),
                required: false,
                attributes: ['id', 'menuItemId', 'price', 'amount', 'totalPrice'],
                include: [{
                  model: App.getModel('MenuItem'),
                  required: false,
                  attributes: ['id', 'name', 'price']
                }]
              }
            ]
          },
          {
            model: App.getModel('Courier'),
            required: false,
            attributes: ['id'],
            include: [{
              model: App.getModel('User'),
              required: false,
              attributes: ['id', 'firstName', 'lastName', 'phone']
            }]
          }
        ],
        order: [[orderBy, order]],
        offset: offset,
        limit: limit
      });

      App.json(res, true, App.t('success', res.lang), mOrders);

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
