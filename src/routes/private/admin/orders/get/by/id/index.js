const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Order.id"
// }

// {
//   "id": 10000000004
// }

// /private/admin/orders/get/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const id = req.getCommonDataInt('id', null);

      if(App.isNull(id))
        return App.json(res, 417, App.t(['Order id is required'], req.lang));

      const mOrder = await App.getModel('Order').findOne({
        where: { id },
        include: [
          {
            required: false,
            model: App.getModel('Client'),
            attributes: ['id', 'totalOrders', 'createdAt'],
            include: [{
              required: false,
              model: App.getModel('User'),
              attributes: ['id', 'email', 'phone', 'firstName', 'lastName', 'fullName', 'image', 'isGuest'],
            }]
          },
          {
            required: false,
            model: App.getModel('Courier'),
            attributes: ['id'],
            include: [{
              required: false,
              model: App.getModel('User'),
              attributes: ['id', 'email', 'phone', 'firstName', 'lastName', 'fullName', 'image'],
            }]
          },
          {
            required: false,
            model: App.getModel('OrderSupplier'),
            attributes: [
              'id', 'restaurantId', 'totalPrice', 'totalItems',
              'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
              'isCanceledByRestaurant', 'canceledByRestaurantAt',
              'isOrderReady', 'orderReadyAt',
              'isTakenByCourier', 'takenByCourierAt',
            ],
            include: [
              {
                required: false,
                model: App.getModel('Restaurant'),
                attributes: ['id', 'name', 'image', 'type', 'rating', 'street', 'lat', 'lon'],
              },
              {
                required: false,
                model: App.getModel('OrderSupplierItem'),
                attributes: ['id', 'menuItemId', 'price', 'amount', 'totalPrice', 'rating', 'isRatedByClient'],
                include: [{
                  required: false,
                  model: App.getModel('MenuItem'),
                  attributes: ['id', 'name', 'image', 'description', 'price'],
                }]
              }
            ]
          },
          {
            required: false,
            model: App.getModel('OrderPaymentType'),
            attributes: ['id', 'type', 'paymentCardId'],
          },
          {
            required: false,
            model: App.getModel('OrderDeliveryAddress'),
            attributes: ['id', 'deliveryAddressId'],
            include: [{
              required: false,
              model: App.getModel('DeliveryAddress'),
              attributes: ['id', 'label', 'city', 'street', 'apartment', 'description', 'lat', 'lon', 'stateId'],
              include: [{
                required: false,
                model: App.getModel('State'),
                attributes: ['id', 'name', 'code'],
              }]
            }]
          },
          {
            required: false,
            model: App.getModel('OrderDeliveryTime'),
            attributes: ['id', 'deliveryDay', 'deliveryHour', 'deliveryTimeValue', 'deliveryTimeType'],
          },
          {
            required: false,
            model: App.getModel('OrderDeliveryType'),
            attributes: ['id', 'type'],
          },
          {
            required: false,
            model: App.getModel('OrderOnSitePresenceDetails'),
            attributes: [
              'id', 'eventDate', 'eventStartTime', 'eventEndTime',
              'numberOfPeople', 'numberOfHours', 'specialRequests',
              'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
              'acceptanceDeadline', 'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason'
            ],
          },
          {
            required: false,
            model: App.getModel('OrderCateringDetails'),
            as: 'OrderCateringDetails',
            attributes: [
              'id', 'eventDate', 'eventStartTime', 'eventEndTime',
              'deliveryMethod', 'deliveryAddress', 'deliveryLatitude', 'deliveryLongitude',
              'estimatedTotalPeople', 'specialRequests',
              'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
              'firstPaymentAmount', 'firstPaymentDueDate', 'firstPaymentPaidAt',
              'secondPaymentAmount', 'secondPaymentDueDate', 'secondPaymentPaidAt',
              'acceptanceDeadline', 'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason'
            ],
          },
        ]
      });

      if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id))
        return App.json(res, 404, App.t(['Order not found'], req.lang));

      App.json(res, true, App.t('success', res.lang), mOrder);

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
