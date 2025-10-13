const express = require('express');
const router = express.Router();

// {
//   "search": "required: <string>",
//   "inVerified": "optional: <boolean>: default: true, search in verified or unverified restaurant"
// }

// /private/admin/restaurants/search/all/?offset=0&limit=15&order=desc&by=createdAt

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user; // admin
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({order: 'desc', by: 'createdAt'});
      const orderBy = App.getModel('Restaurant').getOrderBy(by);
      const roles = App.getModel('User').getRoles();

      const search = App.isString( req.getCommonDataString('search', null) )
        ? App.tools.stripSpecialChars( req.getCommonDataString('search', null) )
        : false;
 
      if( !App.isString(search) || !search.length )
        return App.json( res, 417, App.t(['search','is-required'], req.lang) );

      const inVerified = (App.isString(data.inVerified) || App.isBoolean(data.inVerified))
        ? App.getBooleanFromValue(data.inVerified) 
        : true;

      const aLat = Math.abs( mUser.lat );
      const aLon = Math.abs( mUser.lon );

      const sortable = {
        id: [['id', order]],
        distance: [
          [App.DB.literal('aLon'), order],
          [App.DB.literal('aLat'), order],
          // [App.DB.fn('min', 'Restaurant.aLat'), order],
          // [App.DB.fn('min', 'Restaurant.aLon'), order],
        ],
        rating: [[App.DB.literal('rating'), order]],
        name: [[App.DB.literal('Restaurant.name'), order]],
      };

      const sortBy = (sortable.hasOwnProperty( orderBy ) ? req.query['by'] : 'name');

      const whereRestaurant = {
        isDeleted: false,
        isRestricted: false,
      };

      const whereUser = {
        isDeleted: false,
        isRestricted: false,
        isEmailVerified: true,
        // isPhoneVerified: true,
        role: roles.restaurant,
      };

      if( inVerified ){
        whereRestaurant.isVerified = true;
        // whereRestaurant.isRestricted = false;
        // whereRestaurant.isRequestSent = true;

      }else{
        whereRestaurant.isVerified = false;
        // whereRestaurant.isRestricted = false;
        // whereRestaurant.isRequestSent = true;
      }

      const mRestaurants = await App.getModel('Restaurant').findAndCountAll({
        where: {
          ...whereRestaurant,
          [ App.DB.Op.or ]: [
            App.DB.where(App.DB.col('Restaurant.id'), 'like', `%${+search}%`),
            App.DB.where(App.DB.col('Restaurant.name'), 'like', `%${search}%`),
            App.DB.where(App.DB.col('Restaurant.type'), 'like', `%${search}%`),
            App.DB.where(App.DB.col('Restaurant.website'), 'like', `%${search}%`),
            App.DB.where(App.DB.col('Restaurant.phone'), 'like', `%${search}%`),
            App.DB.where(App.DB.col('Restaurant.email'), 'like', `%${search.toLowerCase()}%`),
          ]
        },
        distinct: true,
        attributes: [
          'id','name','email','phone','website','orderPrepTime','description',
          'image','isOpen','lat','lon','isOpen','rating','type',
          'street','cityId','zip','comment',
          [ App.DB.literal(`(abs(Restaurant.lat)-(${aLat}))`), 'aLat' ],
          [ App.DB.literal(`(abs(Restaurant.lon)-(${aLon}))`), 'aLon' ],
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          // 'totalOrders',
          // 'totalAcceptedOrders',
          // 'totalCanceledOrders',
          // 'totalIncomeInCent',
          // 'totalPreparationTimeInSeconds',
          'createdAt',
        ],
        include: [
          {
            required: true,
            model: App.getModel('City'),
            attributes: ['id','name','stateId'],
            include: [{
              model: App.getModel('State'),
              attributes: ['id','name'],
            }]
          },
          {
            required: true,
            model: App.getModel('User'),
            attributes: [
              'id','email','phone','image','firstName','lastName', 'fullName',
              'street','cityId',
              'isEmailVerified',
              'isPhoneVerified',
              'isRestricted','restrictedAt',
              'lang',
              'gender',
              'lastSeenAt',
              'createdAt',
            ],
            where: whereUser
          },
        ],
        // order: [[ orderBy, order ]],
        order: sortable[ sortBy ],
        offset: offset,
        limit: limit,
      });

      mRestaurants.rows = mRestaurants.rows.map((mRestaurant)=>{
        // remove [-] neg sign, thay all share same area
        const srcLat = App.getPosNumber(mRestaurant.aLat, {abs: true});
        const srcLon = App.getPosNumber(mRestaurant.aLon, {abs: true});

        const dstLat = App.getPosNumber(mUser.lat, {abs: true});
        const dstLon = App.getPosNumber(mUser.lon, {abs: true});

        const distRes = App.geo.lib.getDistance({lat: srcLat, lon: srcLon}, {lat: dstLat, lon: dstLon}, 'miles' );
        if( !distRes.success ){
          console.debug(`path: [${req.path}]: Restaurant: ${mRestaurant.id} => {lat: ${srcLat,srcLon}}`);
          console.debug({distRes});
        }

        mRestaurant.dataValues.distance = (distRes.success)
          ? `${distRes.data.distance} ${distRes.data.units}`
          : `n/a`;

        return mRestaurant;
      });

      // console.debug({found: mRestaurants.count});
      App.json( res, true, App.t('success', res.lang), mRestaurants);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


