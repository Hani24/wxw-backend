const express = require('express');
const router = express.Router();

// {
//   "// GET:": " [sort] ?by=[ id | createdAt | status | finalPrice ]: default: createdAt >>> desc"
//   "// FILTERS:": "?restaurantId=15&status=processing&orderType=on-site-presence&clientId=123"
// }

// /private/admin/orders/get/all/?offset=0&limit=15&order=desc&by=createdAt&restaurantId=15&status=processing

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const {offset, limit, order, by} = req.getPagination({ order: 'desc', by: 'createdAt' });
      const statuses = App.getModel('Order').getStatuses();
      const orderTypes = App.getModel('Order').getOrderTypes();

      // Build where clause with filters
      const where = {};

      // Filter by restaurant ID
      const restaurantId = req.getCommonDataInt('restaurantId', null);

      // Filter by client ID
      const clientId = req.getCommonDataInt('clientId', null);
      if(clientId) {
        where.clientId = clientId;
      }

      // Filter by status
      const statusFilter = req.getCommonDataString('status', null);
      if(statusFilter && statuses.hasOwnProperty(statusFilter)) {
        where.status = statuses[statusFilter];
      }

      // Filter by order type
      const orderTypeFilter = req.getCommonDataString('orderType', null);
      if(orderTypeFilter && orderTypes.hasOwnProperty(orderTypeFilter)) {
        where.orderType = orderTypes[orderTypeFilter];
      }

      // Filter by date range
      const startDate = req.getCommonDataString('startDate', null);
      const endDate = req.getCommonDataString('endDate', null);
      if(startDate && endDate) {
        where.createdAt = {
          [App.DB.Op.between]: [startDate, endDate]
        };
      } else if(startDate) {
        where.createdAt = {
          [App.DB.Op.gte]: startDate
        };
      } else if(endDate) {
        where.createdAt = {
          [App.DB.Op.lte]: endDate
        };
      }

      // Filter by payment status
      const isPaid = req.query.isPaid;
      if(isPaid === 'true') {
        where.isPaid = true;
      } else if(isPaid === 'false') {
        where.isPaid = false;
      }

      // Sortable fields
      const sortable = {
        id: [['id', order]],
        createdAt: [['createdAt', order]],
        status: [['status', order]],
        finalPrice: [['finalPrice', order]],
        clientId: [['clientId', order]],
      };

      const sortBy = App.isString(req.query['by']) && sortable.hasOwnProperty(req.query['by'])
        ? req.query['by']
        : 'createdAt';

      // Build include array
      const include = [
        {
          required: false,
          model: App.getModel('Client'),
          attributes: ['id'],
          include: [{
            required: false,
            model: App.getModel('User'),
            attributes: ['id', 'email', 'phone', 'firstName', 'lastName', 'fullName'],
          }]
        },
        {
          required: restaurantId ? true : false,
          model: App.getModel('OrderSupplier'),
          attributes: [
            'id', 'restaurantId', 'totalPrice', 'totalItems',
            'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
            'isCanceledByRestaurant', 'canceledByRestaurantAt',
            'isOrderReady', 'orderReadyAt',
          ],
          where: restaurantId ? { restaurantId } : {},
          include: [{
            required: false,
            model: App.getModel('Restaurant'),
            attributes: ['id', 'name', 'image', 'type'],
          }]
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
            attributes: ['id', 'label', 'city', 'street', 'apartment', 'description', 'lat', 'lon'],
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
      ];

      // Add on-site presence details if filtering by on-site-presence order type
      if(orderTypeFilter === 'on-site-presence') {
        include.push({
          required: false,
          model: App.getModel('OrderOnSitePresenceDetails'),
          attributes: [
            'id', 'eventDate', 'eventStartTime', 'eventEndTime',
            'numberOfPeople', 'numberOfHours', 'specialRequests',
            'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
            'acceptanceDeadline', 'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason'
          ],
        });
      }

      // Add catering details if filtering by catering order type
      if(orderTypeFilter === 'catering') {
        include.push({
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
        });
      }

      const mOrders = await App.getModel('Order').findAndCountAll({
        where,
        distinct: true,
        attributes: [
          'id', 'clientId', 'courierId',
          'orderType', 'status',
          'totalPrice', 'totalPriceFee',
          'deliveryPrice', 'deliveryPriceFee',
          'finalPrice', 'totalItems',
          'isFreeDelivery',
          'discountAmount', 'discountCode', 'discountType',
          'isPaid', 'paidAt',
          'isRefunded', 'refundedAt',
          'paymentIntentId', 'clientSecret',
          'deliveryDistanceValue', 'deliveryDistanceType',
          'expectedDeliveryTime',
          'clientDescription',
          'createdAt', 'updatedAt',
        ],
        include,
        order: sortable[sortBy],
        offset: offset,
        limit: limit,
      });

      App.json(res, true, App.t('success', res.lang), mOrders);

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
