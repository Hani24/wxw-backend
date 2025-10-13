const express = require('express');
const router = express.Router();

// {
//   "// NOTE: non standart sort by option": "sort [?by=*]: ENUM: <string>[ id, name, distance, rating ]",
//   "inVerified": "optional: <boolean>: default: true, search in verified or unverified couriers"
// }

// /private/admin/couriers/get/all/?offset=0&limit=15&order=asc&by=name

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // task: https://interexy-com.atlassian.net/wiki/spaces/MAI/pages/172982658/A04.04+Sort+the+couriers

      const data = req.getPost();
      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('Courier').getOrderBy(by);
      // const statuses = App.getModel('Order').getStatuses();
      const roles = App.getModel('User').getRoles();

      const inVerified = (App.isString(data.inVerified) || App.isBoolean(data.inVerified))
        ? App.getBooleanFromValue(data.inVerified) 
        : true;
      // console.debug({inVerified});

      const aLat = Math.abs( mUser.lat );
      const aLon = Math.abs( mUser.lon );
      // console.log({aLat, aLon});

      const sortable = {
        id: [['id', order]],
        distance: [
          [App.DB.literal('aLon'), order],
          [App.DB.literal('aLat'), order],
          // [App.DB.fn('min', 'Courier.aLat'), order],
          // [App.DB.fn('min', 'Courier.aLon'), order],
        ],
        rating: [[App.DB.literal('avgRating'), order]],
        name: [[App.DB.literal('User.firstName'), order]],
      };

      const sortBy = (sortable.hasOwnProperty( orderBy ) ? req.query['by'] : 'name');

      const whereCourier = {
        isDeleted: false,
        isRestricted: false,
      };

      const whereUser = {
        isDeleted: false,
        isRestricted: false,
        isNewUser: false,
        // isEmailVerified: true,
        // isPhoneVerified: true,
        // isRestricted: false,
        // role: roles.courier,
      };

      if( inVerified ){
        whereCourier.isVerified = true;
        // whereCourier.isRestricted = false;
        // whereCourier.isRequestSent = true;
        // whereCourier.isKycCompleted = true;

      }else{
        whereCourier.isVerified = false;
        // whereCourier.isRestricted = false;
        whereCourier.isRequestSent = true;
        // whereCourier.isKycCompleted = true;
      }

      const mCouriers = await App.getModel('Courier').findAndCountAll({
        where: whereCourier,
        distinct: true,
        attributes: [
          'id',
          'isOnline','lat','lon',
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'isRequestSent','requestSentAt',
          // 'isDeleted','deletedAt',
          'lastOnlineAt',
          // 'isOrderRequestSent','orderRequestSentAt','orderRequestSentByNuid',
          'hasActiveOrder', // 'activeOrderAt',
          'activeOrderId',
          'balance',
          'totalIncome',
          'totalOrders',
          'totalAcceptedOrders', //'totalRejectedOrders',
          'totalCanceledOrders',
          'totalCompletedOrders',
          'totalIncome',
          'totalRating',
          'totalOrders',
          [ App.DB.literal(`(abs(Courier.lat)-(${aLat}))`), 'aLat' ],
          [ App.DB.literal(`(abs(Courier.lon)-(${aLon}))`), 'aLon' ],
          [ App.DB.literal(`(totalRating /totalOrders)`), 'avgRating' ],
          'isKycCompleted',
          'createdAt',
        ],
        include: [{
          model: App.getModel('User'),
          required: true,
          where: whereUser,
          attributes: [
            'id','email','phone','image','firstName','lastName','fullName','birthday',
            'lang','gender',
            'street','cityId',
            'isEmailVerified',
            'isPhoneVerified',
            'isRestricted',
            // 'isVerified',
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
        order: sortable[ sortBy ],
        offset: offset,
        limit: limit,
      });

      mCouriers.rows = mCouriers.rows.map((mCourier)=>{
        const distRes = App.geo.lib.getDistance(mCourier, mUser, 'miles' );
        if( !distRes.success ){
          console.debug(`path: [${req.path}]: Courier: ${mCourier.id}`);
          console.debug({distRes});
        }

        mCourier.dataValues.distance = (distRes.success)
          ? `${distRes.data.distance} ${distRes.data.units}`
          : `n/a`;

        // console.log(`mCourier: ${mCourier.id}, User: ${mCourier.User.id} => birthday: ${ mCourier.User.birthday } => email: ${mCourier.User.email}`);
        return mCourier;
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


