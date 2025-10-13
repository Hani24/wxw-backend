const express = require('express');
const router = express.Router();

// {
//   "// NOTE: non standart sort by option": "sort [?by=*]: ENUM: <string>[ id, name, distance, rating ]",
//   "inVerified": "optional: <boolean>: default: true, search in verified or unverified restaurants"
// }

// /private/admin/restaurants/get/all/?offset=0&limit=15&order=asc&by=name

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // task: https://interexy-com.atlassian.net/wiki/spaces/MAI/pages/172982348/A03.01+View+the+list+of+active+restaurants
      const data = req.getPost();
      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('Restaurant').getOrderBy(by);
      // const statuses = App.getModel('Order').getStatuses();
      const roles = App.getModel('User').getRoles();

      const inVerified = (App.isString(data.inVerified) || App.isBoolean(data.inVerified))
        ? App.getBooleanFromValue(data.inVerified) 
        : true;

      const aLat = Math.abs( mUser.lat );
      const aLon = Math.abs( mUser.lon );
      // console.log({aLat, aLon});

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

      // -- select id, email, lat, lon from Users where role ='admin';
      // select id, lat, lon, (abs(lat)-abs(3.30)) as a, (abs(lon)-abs(0.001)) as o from Restaurants order by a asc, o asc;

      const whereRestaurant = {
        isDeleted: false,
        isRestricted: false,
      };

      const whereUser = {
        isDeleted: false,
        isRestricted: false,
        isEmailVerified: true,
        // isPhoneVerified: true,
        // isRestricted: false,
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
        where: whereRestaurant,
        attributes: [
          'id','name','email','phone','website','orderPrepTime','description',
          'image','isOpen','lat','lon','isOpen','rating','type',
          'street','cityId','zip','comment',
          [ App.DB.literal(`(abs(Restaurant.lat)-(${aLat}))`), 'aLat' ],
          [ App.DB.literal(`(abs(Restaurant.lon)-(${aLon}))`), 'aLon' ],
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'isKycCompleted',
          // 'totalOrders',
          // 'totalAcceptedOrders',
          // 'totalCanceledOrders',
          // 'totalIncomeInCent',
          // 'totalPreparationTimeInSeconds',
          'createdAt',
        ],
        distinct: true,
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
            model: App.getModel('User'),
            required: true,
            where: whereUser,
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
            // [restaurant-owner]
            // resto-admin-panel does not have form to fill in State/City/Street
            // include: [{
            //   model: App.getModel('City'),
            //   attributes: ['id','name','stateId'],
            //   include: [{
            //     model: App.getModel('State'),
            //     attributes: ['id','name'],
            //   }]
            // }]
          },
        ],
        order: sortable[ sortBy ],
        offset: offset,
        limit: limit,
      });

      mRestaurants.rows = mRestaurants.rows.map((mRestaurant)=>{
        const distRes = App.geo.lib.getDistance(mRestaurant, mUser, 'miles' );
        if( !distRes.success ){
          console.debug(`path: [${req.path}]: Restaurant: ${mRestaurant.id}`);
          console.debug({distRes});
        }

        mRestaurant.dataValues.distance = (distRes.success)
          ? `${distRes.data.distance} ${distRes.data.units}`
          : `n/a`;

        return mRestaurant;
      });

      App.json( res, true, App.t('success', res.lang), mRestaurants);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


