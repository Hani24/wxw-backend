const express = require('express');
const router = express.Router();

// {
//   "// GET:": " [sort] ?by=[ id | name | clientId | totalOrders ]: default: name >>> asc"
// }

// /private/admin/clients/get/all/?offset=0&limit=15&order=desc&by=firstName

// totalSpend
// totalOrders
// totalRejectedOrders
// totalCanceledOrders
// totalCompletedOrders

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'desc', by: 'firstName' });
      // const orderBy = App.getModel('Client').getOrderBy(by);
      // const statuses = App.getModel('Order').getStatuses();
      const roles = App.getModel('User').getRoles();

      const sortable = {
        id: [[App.DB.literal('Client.id'), order]],
        name: [[App.DB.literal('User.firstName'), order]],
        clientId: [['id', order]],
        totalOrders: [[App.DB.literal('Client.totalOrders'), order]],
      };

      const sortBy = App.isString(req.query['by']) && sortable.hasOwnProperty( req.query['by'] )
        ? req.query['by']
        : 'name';

      const mClients = await App.getModel('Client').findAndCountAll({
        where: {
          isDeleted: false,
          isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id','lat','lon',
          // 'isVerified', 'verifiedAt',
          // 'isRestricted', 'restrictedAt',
          // 'totalSpend',
          'totalOrders',
          // 'totalRejectedOrders',
          // 'totalCanceledOrders',
          // 'totalCompletedOrders',
          'createdAt',
        ],
        include: [
          {
            required: true,
            model: App.getModel('User'),
            where: {
              isDeleted: false,
              isRestricted: false,
              isNewUser: false,
              // isEmailVerified: true,
              // isPhoneVerified: true,
              // role: roles.client,
            },
            attributes: [
              'id','email','phone','image','firstName','lastName','fullName','birthday',
              'lang','gender',
              'street','cityId',
              'isEmailVerified',
              'isPhoneVerified',
              'isRestricted',
              'createdAt',
            ],
            include: [{
              required: false,
              model: App.getModel('City'),
              attributes: ['id','name','stateId'],
              include: [{
                model: App.getModel('State'),
                attributes: ['id','name'],
              }]
            }]
          },
          // {
          //   required: false,
          //   model: App.getModel('FavoriteMenuItem'),
          //   attributes: [
          //     'id'
          //     // [App.DB.fn('count', 'FavoriteMenuItems.id'), 'totalFavorites'],
          //   ]
          // },
        ],
        // order: [[ orderBy, order ]],
        // order: [[App.DB.literal(`User.${orderBy}`), order]],
        order: sortable[ sortBy ],
        offset: offset,
        limit: limit,
      });

      for( const mClient of mClients.rows ){
        mClient.dataValues.totalFavorites 
          = await App.getModel('FavoriteMenuItem').getTotalWhere({clientId: mClient.id});
        // mClient.dataValues.User.birthday 
        //   = App.DT.isValidDatetime( mClient.User.birthday )
        //     ? mClient.User.birthday
        //     : App.getISODate(); // 'not set';

        // mClient.dataValues.User.email 
        //   = App.tools.isValidEmail( mClient.User.email )
        //     ? mClient.User.email
        //     : 'not set';

        // console.log(`mClient: ${mClient.id}, User: ${mClient.User.id} => birthday: ${ mClient.User.birthday } => email: ${mClient.User.email}`);
      }

      // console.json({mClients});
      App.json( res, true, App.t('success', res.lang), mClients);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


