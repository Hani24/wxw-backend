const express = require('express');
const router = express.Router();

// {
//   "type": "required: ENUM: <string>: [active | history]"
// }

// /private/admin/couriers/withdraw/requests/get/all/?offset=0&limit=15&order=desc&by=id
// /private/admin/couriers/withdraw/requests/get/all/offset/0/limit/15/order/desc/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;


      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('CourierWithdrawRequest').getOrderBy(by);
      // const roles = App.getModel('User').getRoles();
      const type = req.query.type || req.getCommonDataString('type',null);

      // console.json({...data, type, offset,limit, order, by, orderBy, query: req.query});

      const whereRequest = {
        ...(type === 'active' 
          ? {isInitialized: false, isRejected: false, isAccepted: false} 
          : { 
            [App.DB.Op.or]: {
              isInitialized: true,
              isRejected: true,
              isAccepted: true,
              isCompleted: true,
            }
          }
        ),
      };

      const whereCourier = {};
      const whereUser = {
        // isRestricted: false,
        // isDeleted: false,
      };

      const mCourierWithdrawRequests = await App.getModel('CourierWithdrawRequest').findAndCountAll({
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
          attributes: ['id','balance','isRestricted','isDeleted'],
          include: [{
            model: App.getModel('User'),
            where: whereUser,
            attributes: [
              'id','firstName','lastName','fullName','email','phone',
              // 'isEmailVerified',
              // 'isPhoneVerified',
              'isRestricted',
              'createdAt',
            ],
          }],
        }],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      // console.json({mCourierWithdrawRequests});
      App.json( res, true, App.t('success', res.lang), mCourierWithdrawRequests);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


