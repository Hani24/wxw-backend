const express = require('express');
const router = express.Router();

// {
//   "search": "required: <string>",
//   "inVerified": "optional: <boolean>: default: true, search in verified or unverified couriers"
// }

// /private/admin/couriers/search/all/?offset=0&limit=15&order=asc&by=id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('Courier').getOrderBy(by);
      const roles = App.getModel('User').getRoles();

      const search = App.isString( req.getCommonDataString('search', null) )
        ? App.tools.stripSpecialChars( req.getCommonDataString('search', null) )
        : false;
 
      if( !App.isString(search) || !search.length )
        return App.json( res, 417, App.t(['search','is-required'], req.lang) );

      const inVerified = (App.isString(data.inVerified) || App.isBoolean(data.inVerified))
        ? App.getBooleanFromValue(data.inVerified) 
        : true;
      // console.debug({inVerified});

      const firstName = search.split(' ').length >= 1 ? search.split(' ')[0] : null;
      const lastName = search.split(' ').length >= 2 ? search.split(' ')[1] : null;

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
      }else{
        whereCourier.isVerified = false;
        // whereCourier.isRestricted = false;
        whereCourier.isRequestSent = true;
      }

      const mCouriers = await App.getModel('Courier').findAndCountAll({
        where: whereCourier,
        attributes: [
          'id','lat','lon',
          'isOnline',
          'isVerified','verifiedAt',
          'isRestricted','restrictedAt',
          'isRequestSent','requestSentAt',
          'lastOnlineAt',
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
        distinct: true,
        include: [
          {
            required: true,
            model: App.getModel('User'),
            where: {
              ...whereUser,
              [ App.DB.Op.or ]: [
                App.DB.where(App.DB.col('User.id'), 'like', `%${+search}%`),
                App.DB.where(App.DB.col('User.firstName'), 'like', `%${firstName}%`),
                App.DB.where(App.DB.col('User.firstName'), 'like', `%${lastName}%`),
                App.DB.where(App.DB.col('User.lastName'), 'like', `%${firstName}%`),
                App.DB.where(App.DB.col('User.lastName'), 'like', `%${lastName}%`),
                App.DB.where(App.DB.col('User.phone'), 'like', `%${search}%`),
                App.DB.where(App.DB.col('User.email'), 'like', `%${search}%`),
                // App.DB.where(App.DB.col('User.role'), 'like', `%${search.toLowerCase()}%`),
              ]
            },
            attributes: [
              'id','email','phone','image','firstName','lastName','fullName','birthday',
              'street','cityId',
              'role','lang','gender',
              'isEmailVerified',
              'isPhoneVerified',
              'isRestricted','restrictedAt',
              'lastSeenAt',
              'createdAt'
            ],
            include: [{
              model: App.getModel('City'),
              attributes: ['id','name','stateId'],
              include: [{
                model: App.getModel('State'),
                attributes: ['id','name'],
              }]
            }]
          }
        ],
        // order: [[ orderBy, order ]],
        order: sortable[ sortBy ],
        offset: offset,
        limit: limit,
      });

      mCouriers.rows = mCouriers.rows.map((mCourier)=>{

        // remove [-] neg sign, thay all share same area
        const srcLat = App.getPosNumber(mCourier.aLat, {abs: true});
        const srcLon = App.getPosNumber(mCourier.aLon, {abs: true});

        const dstLat = App.getPosNumber(mUser.lat, {abs: true});
        const dstLon = App.getPosNumber(mUser.lon, {abs: true});

        const distRes = App.geo.lib.getDistance({lat: srcLat, lon: srcLon}, {lat: dstLat, lon: dstLon}, 'miles' );
        if( !distRes.success ){
          console.debug(`path: [${req.path}]: Courier: ${mCourier.id} => {lat: ${srcLat,srcLon}}`);
          console.debug({distRes});
        }

        mCourier.dataValues.distance = (distRes.success)
          ? `${distRes.data.distance} ${distRes.data.units}`
          : `n/a`;

        return mCourier;
      });

      // console.debug({found: mCouriers.count});
      App.json( res, true, App.t('success', res.lang), mCouriers);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


