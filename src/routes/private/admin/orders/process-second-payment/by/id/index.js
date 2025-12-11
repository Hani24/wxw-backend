const express = require('express');
const router = express.Router();

/**
 * Process Second Payment for Catering or On-Site Presence Order (Admin)
 * POST /private/admin/orders/process-second-payment/by/id
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
      const mUser = await req.user;
      const mAdmin = await req.admin;

      const id = req.getCommonDataInt('id', null);

      if(App.isNull(id)){
        return await App.json(res, 417, App.t(['Order id is required'], req.lang));
      }

      // Verify order exists
      const mOrder = await App.getModel('Order').findOne({
        where: { id },
        attributes: ['id', 'orderType', 'clientId']
      });

      if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)){
        return await App.json(res, 404, App.t(['Order not found'], req.lang));
      }

      const ORDER_TYPES = App.getModel('Order').getOrderTypes();

      // Verify this is a catering or on-site-presence order
      if(mOrder.orderType !== ORDER_TYPES['catering'] && mOrder.orderType !== ORDER_TYPES['on-site-presence']){
        return await App.json(res, 417, App.t(['This order type does not support split payments'], req.lang));
      }

      // Process the second payment
      const result = await App.payments['split-payment-processor'].processSecondPayment(id);

      if(!result.success){
        return await App.json(res, 417, App.t([result.message], req.lang), result.data);
      }

      // Log admin action
      console.ok(` #Admin: ${mAdmin.id} (${mUser.email}) processed second payment for order #${id}`);

      return await App.json(res, true, App.t(['Second payment processed successfully'], req.lang), result.data);

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
