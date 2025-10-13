const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id",
// }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{


      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( !id )
        return App.json( res, 417, App.t(['Order id is required'], req.lang) );

      const statuses = App.getModel('Order').getStatuses();

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id,
          isLocked: true,
          courierId: null,
          allSuppliersHaveConfirmed: false,
          isCanceledByClient: false,
          // isRejectedByClient: false,
          // status: statuses['processing'],
        },
        attributes: [
          'id','status','clientId', // ...
          'isValidChecksum','checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        include: [
          {
            model: App.getModel('Client'),
            required: true,
            attributes:['id','userId'],
            include: [{
              model: App.getModel('User'),
              required: true,
              attributes:['id'],
            }],
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
              // isAcceptedByRestaurant: false,
              isCanceledByRestaurant: false,
              // isRestaurantNotified: true,
              // isRestaurantAcknowledged: true,
            },
            attributes: [
              'id',
              // 'isRestaurantNotified', // 'restaurantNotifiedAt',
              // 'isRestaurantAcknowledged', // 'restaurantAcknowledgedAt',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isCanceledByRestaurant', // 'canceledByRestaurantAt', // + reason
              // 'updatedAt'            
              'isValidChecksum','checksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),

            ]
          }
        ]
      });

      if( 
        !App.isObject(mOrder) 
        || !App.isPosNumber(mOrder.id) 
        || !App.isArray(mOrder.OrderSuppliers) 
        || !mOrder.OrderSuppliers.length
      ){
        return App.json( res, 404, App.t(['Order not found or/and has been canceled'], res.lang) );
      }

      if( !mOrder.isValidChecksum )
        return App.json( res, 403, App.t(['Order Security check error'], req.lang) );

      const mOrderSupplier = mOrder.OrderSuppliers[0];
      if( !mOrderSupplier.isValidChecksum )
        return App.json( res, 403, App.t(['Order-Supplier Security check error'], req.lang) );

      if( mOrderSupplier.isAcceptedByRestaurant )
        return App.json( res, true, App.t(['Order',`#${mOrder.id}`,'already accepted'], res.lang) );

      const updateOrderSupplierRes = await mOrderSupplier.update({
        isAcceptedByRestaurant: true,
        acceptedByRestaurantAt: App.getISODate(),

        // force to true, in case of socket nor notified/acked
        isRestaurantNotified: true,
        restaurantNotifiedAt: App.getISODate(),
        isRestaurantAcknowledged: true,
        restaurantAcknowledgedAt: App.getISODate(),
      });

      if( !App.isObject(updateOrderSupplierRes) || !App.isPosNumber(updateOrderSupplierRes.id) )
        return App.json( res, false, App.t(['Failed to update order'], res.lang) );

      await App.json( res, true, App.t(['Order',`#${mOrder.id}`,'successfully','accepted'], res.lang) );

      // [post-processing]
      const totalSuppliers = await App.getModel('OrderSupplier').getTotalWhere({
        orderId: mOrder.id,
      });

      const acceptedSuppliers = await App.getModel('OrderSupplier').getTotalWhere({
        orderId: mOrder.id,
        isAcceptedByRestaurant: true,
      });

      if( totalSuppliers !== acceptedSuppliers )
        return console.warn(`#order: ${mOrder.id}: ${acceptedSuppliers} of ${totalSuppliers} suppliers have accepted order`);        

      const updateOrderRes = await mOrder.update({
        allSuppliersHaveConfirmed: true,
        allSuppliersHaveConfirmedAt: App.getISODate(),
      });

      if( !App.isObject(updateOrderRes) || !App.isPosNumber(updateOrderRes.id) )
        return console.error(`Order #${mOrder.id}: failed to update: all-confirm status`);

      console.ok(`#order: ${mOrder.id}: all suppliers have accepted order, notify Client`);

      const pushToClientRes = await App.getModel('ClientNotification')
        .pushToClient( mOrder.Client, {
          type: App.getModel('ClientNotification').getTypes()['allSuppliersHaveConfirmed'],
          title: `Order #${mOrder.id}: ${App.t([`Status updated`], req.lang)}`,
          message: App.t([`Your order was accepted by all the restaurants and is now being prepared.`], req.lang),
          data: {
            orderId: mOrder.id,
            userId: mOrder.Client.User.id,
            clientId: mOrder.Client.id,
          }
        });
      if( !pushToClientRes.success ){
        console.error('#orderRequestAccept: pushToClientRes');
        console.json({pushToClientRes});
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


