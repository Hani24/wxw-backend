const express = require('express');
const router = express.Router();

/**
 * Get Second Payment Status for Catering or On-Site Presence Order
 * POST /private/client/orders/second-payment-status/by/id
 *
 * Body:
 * {
 *   "id": "required: <number>: Order ID"
 * }
 *
 * Example:
 * {
 *   "id": 10000000123
 * }
 */

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{
      const mClient = await req.client;
      const id = req.getCommonDataInt('id', null);

      if(App.isNull(id)){
        return await App.json(res, 417, App.t(['Order id is required'], req.lang));
      }

      // Get order with details
      const mOrder = await App.getModel('Order').findOne({
        where: {
          id,
          clientId: mClient.id
        },
        attributes: ['id', 'orderType', 'finalPrice', 'isPaid', 'paidAt']
      });

      if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)){
        return await App.json(res, 404, App.t(['Order not found'], req.lang));
      }

      const ORDER_TYPES = App.getModel('Order').getOrderTypes();
      let paymentStatus = {};

      // Check order type and get payment status
      if(mOrder.orderType === ORDER_TYPES['catering']){
        const cateringDetails = await App.getModel('OrderCateringDetails').getByOrderId(id);

        if(!cateringDetails){
          return await App.json(res, 404, App.t(['Catering details not found'], req.lang));
        }

        const isFirstPaymentDue = App.getModel('OrderCateringDetails').isFirstPaymentDue(cateringDetails);
        const isSecondPaymentDue = App.getModel('OrderCateringDetails').isSecondPaymentDue(cateringDetails);

        paymentStatus = {
          orderType: 'catering',
          orderTotalPrice: mOrder.finalPrice,
          eventDate: cateringDetails.eventDate,
          firstPayment: {
            amount: cateringDetails.firstPaymentAmount,
            dueDate: cateringDetails.firstPaymentDueDate,
            paidAt: cateringDetails.firstPaymentPaidAt,
            isPaid: !!cateringDetails.firstPaymentPaidAt,
            isDue: isFirstPaymentDue,
            paymentIntentId: cateringDetails.firstPaymentIntentId,
            description: '50% deposit - 10 days before event (Non-refundable)'
          },
          secondPayment: {
            amount: cateringDetails.secondPaymentAmount,
            dueDate: cateringDetails.secondPaymentDueDate,
            paidAt: cateringDetails.secondPaymentPaidAt,
            isPaid: !!cateringDetails.secondPaymentPaidAt,
            isDue: isSecondPaymentDue,
            paymentIntentId: cateringDetails.secondPaymentIntentId,
            description: '50% final payment - 3 days before event (Non-refundable)'
          },
          totalPaid: (cateringDetails.firstPaymentPaidAt ? cateringDetails.firstPaymentAmount : 0) +
                     (cateringDetails.secondPaymentPaidAt ? cateringDetails.secondPaymentAmount : 0),
          isFullyPaid: !!cateringDetails.firstPaymentPaidAt && !!cateringDetails.secondPaymentPaidAt
        };

      } else if(mOrder.orderType === ORDER_TYPES['on-site-presence']){
        const onSiteDetails = await App.getModel('OrderOnSitePresenceDetails').getByOrderId(id);

        if(!onSiteDetails){
          return await App.json(res, 404, App.t(['On-site presence details not found'], req.lang));
        }

        const isFirstPaymentDue = App.getModel('OrderOnSitePresenceDetails').isFirstPaymentDue(onSiteDetails);
        const isSecondPaymentDue = App.getModel('OrderOnSitePresenceDetails').isSecondPaymentDue(onSiteDetails);

        paymentStatus = {
          orderType: 'on-site-presence',
          orderTotalPrice: mOrder.finalPrice,
          eventDate: onSiteDetails.eventDate,
          firstPayment: {
            amount: onSiteDetails.firstPaymentAmount,
            dueDate: onSiteDetails.firstPaymentDueDate,
            paidAt: onSiteDetails.firstPaymentPaidAt,
            isPaid: !!onSiteDetails.firstPaymentPaidAt,
            isDue: isFirstPaymentDue,
            paymentIntentId: onSiteDetails.firstPaymentIntentId,
            description: '50% deposit - 10 days before event (Non-refundable)'
          },
          secondPayment: {
            amount: onSiteDetails.secondPaymentAmount,
            dueDate: onSiteDetails.secondPaymentDueDate,
            paidAt: onSiteDetails.secondPaymentPaidAt,
            isPaid: !!onSiteDetails.secondPaymentPaidAt,
            isDue: isSecondPaymentDue,
            paymentIntentId: onSiteDetails.secondPaymentIntentId,
            description: '50% final payment - 3 days before event (Non-refundable)'
          },
          totalPaid: (onSiteDetails.firstPaymentPaidAt ? onSiteDetails.firstPaymentAmount : 0) +
                     (onSiteDetails.secondPaymentPaidAt ? onSiteDetails.secondPaymentAmount : 0),
          isFullyPaid: !!onSiteDetails.firstPaymentPaidAt && !!onSiteDetails.secondPaymentPaidAt
        };

      } else {
        // Regular order-now type
        paymentStatus = {
          orderType: 'order-now',
          orderTotalPrice: mOrder.finalPrice,
          isPaid: mOrder.isPaid,
          paidAt: mOrder.paidAt,
          description: 'Full payment at order creation'
        };
      }

      return await App.json(res, true, App.t(['success'], req.lang), paymentStatus);

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
