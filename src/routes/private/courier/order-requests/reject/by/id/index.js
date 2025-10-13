const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierOrderRequest.id"
// }

// /private/courier/order-requests/reject/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return App.json( res, true, App.t(['success'], res.lang), {
      //   isRejected: true,
      //   rejectedAt: App.getISODate(),
      // } );

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;


      // hasActiveOrder: true,
      // activeOrderAt: App.getISODate(),
      // activeOrderId: mOrder.id,

      const id = req.getCommonDataInt('id',null);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['request','id','is-required'], req.lang) );

      const mRequest = await App.getModel('CourierOrderRequest').findOne({
        where:{
          id,
          courierId: mCourier.id,
          isAccepted: false,
          isRejected: false,          
        }
      });

      if( !App.isObject(mRequest) || !App.isPosNumber(mRequest.id) )
        return App.json( res, 404, App.t(['request','id','not-found'], req.lang) );

      const updateRes = await mRequest.update({
        isRejected: true,
        rejectedAt: App.getISODate(),
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, 404, App.t(['failed-to','reject','request'], req.lang) );

      await App.json( res, true, App.t(['success'], res.lang), {
        isRejected: updateRes.isRejected,
        rejectedAt: updateRes.rejectedAt,
      } );

      {
        const updateCourierRes = await mCourier.update({
          // totalAcceptedOrders: (mCourier.totalAcceptedOrders + 1),
          // totalCanceledOrders: (mCourier.totalCanceledOrders +1),
          totalRejectedOrders: (mCourier.totalRejectedOrders +1),
        });
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


