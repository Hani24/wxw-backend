const express = require('express');
const router = express.Router();

// /private/admin/couriers/requests/get/all/unverified/?offset=0&limit=15&order=asc&by=id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      return App.json( res, 417, App.t(['not-in-use'], res.lang));

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('Courier').getOrderBy(by);
      // const statuses = App.getModel('Order').getStatuses();

      const mCouriers = await App.getModel('Courier').findAndCountAll({
        where: {
          isDeleted: false,
          isVerified: false,
          isRequestSent: true,
          // isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id',
          'isOnline',
          'lat','lon',
          'isVerified', // 'verifiedAt',
          'isRestricted', // 'restrictedAt',
          'isRequestSent','requestSentAt',
          'lastOnlineAt',
          'hasActiveOrder', // 'activeOrderAt',
          'activeOrderId',
          'balance',
          'createdAt',
          'totalIncome','totalOrders','totalAcceptedOrders','totalRejectedOrders',
          'totalCanceledOrders','totalRating'
        ],
        include: [{
          model: App.getModel('User'),
          required: true,
          where: {
            isDeleted: false,
            isEmailVerified: true,
          },
          attributes: [
            'id','email','phone','image','firstName','lastName', // 'fullName',
            'zip','street','cityId','birthday',
            // 'isEmailVerified',
            // 'isPhoneVerified',
            'isRestricted',
            'lang',
            'gender',
            'createdAt',
          ],
          include: [{
            model: App.getModel('City'),
            attributes: ['id','name','stateId'],
            include: [{
              model: App.getModel('State'),
              attributes: ['id','name'],
            }]
          }]
        }],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      App.json( res, true, App.t('success', res.lang), mCouriers);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


