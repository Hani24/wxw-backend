const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Order.id"
// }

// {
//   "id": 10000000004
// }

// /private/admin/orders/mark-completed

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const id = req.getCommonDataInt('id', null);

      if(App.isNull(id))
        return App.json(res, 417, App.t(['Order id is required'], req.lang));

      const statuses = App.getModel('Order').getStatuses();

      // Find the order
      let mOrder = await App.getModel('Order').findOne({
        where: { id }
      });

      if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id))
        return App.json(res, 404, App.t(['Order not found'], req.lang));

      // Check if order is already delivered (completed)
      if(mOrder.status === statuses['delivered'])
        return App.json(res, 417, App.t(['Order is already delivered'], req.lang));

      // Check if order is in a valid state to be marked as delivered
      // Only 'processing' orders can be marked as delivered
      const validStatuses = [statuses['processing']];
      if(!validStatuses.includes(mOrder.status)){
        return App.json(res, 417, App.t([
          'Order must be in processing status to be marked as delivered'
        ], req.lang));
      }

      // Check if order is paid
      if(!mOrder.isPaid){
        return App.json(res, 417, App.t(['Order must be paid before marking as completed'], req.lang));
      }

      const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());

      try {

        console.log(`Before update - Order #${mOrder.id} status: ${mOrder.status}, statuses.delivered: ${statuses['delivered']}`);

        // Mark order as delivered (completed)
        const updateResult = await App.getModel('Order').update({
          status: statuses['delivered'],
          isCompleted: true,
          completedAt: App.getISODate(),
        }, {
          where: { id: mOrder.id },
          transaction: tx
        });

        console.log(`Update result:`, updateResult);

        // Reload the order to get updated values
        await mOrder.reload({ transaction: tx });

        if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)){
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to mark order as completed'], req.lang));
        }

        console.log(`After update - Order status: ${mOrder.status}, isCompleted: ${mOrder.isCompleted}`);

        // Update client statistics
        const mClient = await App.getModel('Client').findByPk(mOrder.clientId);
        if(App.isObject(mClient) && App.isPosNumber(mClient.id)){
          await mClient.update({
            totalCompletedOrders: (mClient.totalCompletedOrders || 0) + 1,
            totalSpend: App.getPosNumber((mClient.totalSpend || 0) + mOrder.finalPrice, { toFixed: 2 }),
          }, { transaction: tx });
        }

        // Update courier statistics if courier is assigned
        if(App.isPosNumber(mOrder.courierId)){
          const mCourier = await App.getModel('Courier').findByPk(mOrder.courierId);
          if(App.isObject(mCourier) && App.isPosNumber(mCourier.id)){
            await mCourier.update({
              totalCompletedOrders: (mCourier.totalCompletedOrders || 0) + 1,
            }, { transaction: tx });
          }
        }

        // Update restaurant statistics
        const mOrderSuppliers = await App.getModel('OrderSupplier').findAll({
          where: { orderId: mOrder.id }
        });

        for(const mOrderSupplier of mOrderSuppliers){
          const mRestaurant = await App.getModel('Restaurant').findByPk(mOrderSupplier.restaurantId);
          if(App.isObject(mRestaurant) && App.isPosNumber(mRestaurant.id)){
            await mRestaurant.update({
              totalCompletedOrders: (mRestaurant.totalCompletedOrders || 0) + 1,
            }, { transaction: tx });
          }
        }

        await tx.commit();

      } catch(e) {
        console.error('Error during order completion transaction:', e);
        console.error('Error stack:', e.stack);
        // Only rollback if transaction is still pending
        if(!tx.finished){
          await tx.rollback();
        }
        return App.json(res, false, App.t(['Failed to mark order as completed'], req.lang), {
          error: e.message
        });
      }

      // Fetch updated order AFTER transaction is committed (outside try-catch)
      try {
        console.log(`Order #${mOrder.id} marked as completed. Status: ${mOrder.status}, isCompleted: ${mOrder.isCompleted}`);

        mOrder = await App.getModel('Order').findOne({
          where: { id: mOrder.id },
          attributes: [
            'id', 'clientId', 'courierId', 'orderType', 'status',
            'isCompleted', 'completedAt', 'isPaid', 'paidAt',
            'totalPrice', 'deliveryPrice', 'finalPrice', 'totalItems',
            'createdAt', 'updatedAt'
          ],
          include: [
            {
              required: false,
              model: App.getModel('Client'),
              attributes: ['id', 'totalOrders', 'totalCompletedOrders', 'totalSpend'],
              include: [{
                required: false,
                model: App.getModel('User'),
                attributes: ['id', 'email', 'firstName', 'lastName', 'fullName'],
              }]
            },
            {
              required: false,
              model: App.getModel('OrderSupplier'),
              attributes: ['id', 'restaurantId', 'totalPrice', 'totalItems', 'isAcceptedByRestaurant'],
              include: [{
                required: false,
                model: App.getModel('Restaurant'),
                attributes: ['id', 'name'],
              }]
            }
          ]
        });

        if(!App.isObject(mOrder)) {
          console.error(`Failed to fetch order #${id} after marking as completed`);
          return App.json(res, false, App.t(['Order was marked as completed but failed to fetch updated data'], req.lang));
        }

        App.json(res, true, App.t(['Order has been marked as completed'], res.lang), mOrder);

      } catch(e) {
        console.error('Error fetching completed order:', e);
        // Order was already marked as completed, just return a success with basic info
        return App.json(res, true, App.t(['Order has been marked as completed'], res.lang), {
          id: mOrder.id,
          status: mOrder.status,
          isCompleted: mOrder.isCompleted,
          completedAt: mOrder.completedAt
        });
      }

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
