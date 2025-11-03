const express = require('express');
const router = express.Router();

/*
Delete/cancel an order by ID (only for unpaid orders in 'created' status)
{
  "id": "required: <number> Ref. Order.id"
}
*/

// POST /private/client/orders/delete/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);
      if(!App.isPosNumber(id)){
        return App.json(res, 417, App.t(['field','[id]','is-required'], req.lang));
      }

      const statuses = App.getModel('Order').getStatuses();

      // Find the order
      const mOrder = await App.getModel('Order').findOne({
        where: {
          id,
          clientId: mClient.id
        }
      });

      if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)){
        return App.json(res, 404, App.t(['Order','not','found'], req.lang));
      }

      // Only allow deletion of unpaid orders in 'created' status
      if(mOrder.status !== statuses['created']){
        return App.json(res, 417, App.t(['Order','cannot','be','deleted','at','this','stage'], req.lang));
      }

      if(mOrder.isPaid){
        return App.json(res, 417, App.t(['Paid','orders','cannot','be','deleted'], req.lang));
      }

      // Start transaction
      const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());

      try {

        // Delete related OrderSuppliers and their items
        const orderSuppliers = await App.getModel('OrderSupplier').findAll({
          where: { orderId: mOrder.id },
          transaction: tx
        });

        for(const orderSupplier of orderSuppliers){
          // Delete OrderSupplierItems
          await App.getModel('OrderSupplierItem').destroy({
            where: { orderSupplierId: orderSupplier.id },
            transaction: tx
          });

          // Delete OrderSupplier
          await orderSupplier.destroy({ transaction: tx });
        }

        // Delete OrderCateringDetails if exists
        const cateringDetails = await App.getModel('OrderCateringDetails').findOne({
          where: { orderId: mOrder.id },
          transaction: tx
        });
        if(cateringDetails){
          await cateringDetails.destroy({ transaction: tx });
        }

        // Delete OrderOnSitePresenceDetails if exists
        const onSiteDetails = await App.getModel('OrderOnSitePresenceDetails').findOne({
          where: { orderId: mOrder.id },
          transaction: tx
        });
        if(onSiteDetails){
          await onSiteDetails.destroy({ transaction: tx });
        }

        // Delete OrderPaymentType if exists
        const paymentType = await App.getModel('OrderPaymentType').findOne({
          where: { orderId: mOrder.id },
          transaction: tx
        });
        if(paymentType){
          await paymentType.destroy({ transaction: tx });
        }

        // Delete OrderDeliveryAddress if exists
        const deliveryAddress = await App.getModel('OrderDeliveryAddress').findOne({
          where: { orderId: mOrder.id },
          transaction: tx
        });
        if(deliveryAddress){
          await deliveryAddress.destroy({ transaction: tx });
        }

        // Delete OrderDeliveryTime if exists
        const deliveryTime = await App.getModel('OrderDeliveryTime').findOne({
          where: { orderId: mOrder.id },
          transaction: tx
        });
        if(deliveryTime){
          await deliveryTime.destroy({ transaction: tx });
        }

        // Delete OrderDeliveryType if exists
        const deliveryType = await App.getModel('OrderDeliveryType').findOne({
          where: { orderId: mOrder.id },
          transaction: tx
        });
        if(deliveryType){
          await deliveryType.destroy({ transaction: tx });
        }

        // Cancel payment intent if it exists
        if(App.isString(mOrder.paymentIntentId)){
          const cancelRes = await App.payments.stripe.paymentIntentCancel(mOrder.paymentIntentId, {});
          console.log(`Payment intent cancelled: ${cancelRes.message}`);
        }

        // Finally, delete the order
        await mOrder.destroy({ transaction: tx });

        // Commit transaction
        await tx.commit();

        // Update client statistics
        await mClient.update({
          totalOrders: Math.max(0, (mClient.totalOrders || 0) - 1)
        });

        return App.json(res, true, App.t(['Order','deleted','successfully'], req.lang), {
          id: mOrder.id
        });

      } catch(txError){
        await tx.rollback();
        console.error('Transaction error:', txError);
        return App.json(res, false, App.t(['Failed','to','delete','order'], req.lang));
      }

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
