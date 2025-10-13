const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierWithdrawRequest.id"
// }

// /private/admin/courier/withdraw/requests/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const id = req.getCommonDataInt('id', null);

      if( !App.isPosNumber(id) )
        return App.json(res, 417, App.t(['Withdraw request ID is required'],req.lang));

      const whereRequest = { id };
      const whereCourier = {};
      const whereUser = {
        // isRestricted: false,
        // isDeleted: false,
      };

      const mCourierWithdrawRequest = await App.getModel('CourierWithdrawRequest').findOne({
        where: whereRequest,
        distinct: true,
        attributes: [
          'id','courierId','amount','transferId','payoutId',
          'isPartialyApproved','approvedAmount', 'partialyApprovedReason','refundedAmount',
          'isRejected','rejectedAt','rejectionReason',
          'isAccepted','acceptedAt',
          'isCompleted','completedAt',
          'createdAt',
        ],
        include: [{
          required: true,
          model: App.getModel('Courier'),
          where: whereCourier,
          attributes: [
            'id','isOnline','lat','lon','isVerified','verifiedAt','isRestricted','isDeleted',
            'lastOnlineAt','balance','isKycCompleted','totalIncome','totalOrders',
            'totalAcceptedOrders','totalRejectedOrders','totalCanceledOrders','totalCompletedOrders',
            'totalRating','avgRating','createdAt',
            // inner:stripe:ids
            // 'personId', 'accountId'
          ],
          include: [{
            model: App.getModel('User'),
            where: whereUser,
            attributes: [
              'id','image','fullName','restaurantId','cityId','email','isEmailVerified','phone',
              'isPhoneVerified','firstName','lastName','zip','street','birthday','timezone',
              'lastSeenAt','isRestricted','isDeleted','lat','lon',
            ],
            include: [{
              model: App.getModel('City'),
              attributes: ['id','stateId','name'],
              include: [{
                model: App.getModel('State'),
                attributes: ['id','name']
              }]
            }]
          }],
        }],
      });

      if( !App.isObject(mCourierWithdrawRequest) || !App.isPosNumber(mCourierWithdrawRequest.id) )
        return await App.json( res, 404, App.t(['Withdraw request not found'], res.lang));

      App.json( res, true, App.t('success', res.lang), mCourierWithdrawRequest);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


