const express = require('express');
const router = express.Router();

// {
//   "search": "required: <string>"
// }

// /private/admin/clients/search/all/?offset=0&limit=15&order=asc&by=id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'desc', /*by: 'createdAt'*/ });
      const orderBy = App.getModel('User').getOrderBy(by);
      const roles = App.getModel('User').getRoles();

      const search = App.isString( req.getCommonDataString('search', null) )
        ? App.tools.stripSpecialChars( req.getCommonDataString('search', null) )
        : false;
 
      if( !App.isString(search) || !search.length )
        return App.json( res, 417, App.t(['search','is-required'], req.lang) );

      const firstName = search.split(' ').length >= 1 ? search.split(' ')[0] : null;
      const lastName = search.split(' ').length >= 2 ? search.split(' ')[1] : null;

      const whereClient = {
        isDeleted: false,
      };

      const whereUser = {
        isDeleted: false,
        isNewUser: false,
        // isRestricted: false,
        // isEmailVerified: true,
        // isPhoneVerified: true,
        // role: roles.client, // do not apply [client vs courier] role, bcs thay can switch between accounts/roles
      };

      const mClients = await App.getModel('Client').findAndCountAll({
        where: whereClient,
        attributes: [
          'id',
          'lat','lon',
          // 'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          // 'totalSpend',
          'totalOrders',
          // 'totalRejectedOrders',
          // 'totalCanceledOrders',
          // 'totalCompletedOrders',
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
        order: [[App.DB.literal(`User.${ orderBy }`), order]],
        offset: offset,
        limit: limit,
      });

      // required ???
      for( const mClient of mClients.rows ){
        mClient.dataValues.totalFavorites 
          = await App.getModel('FavoriteMenuItem').getTotalWhere({clientId: mClient.id});

        mClient.dataValues.User.birthday 
          = App.DT.isValidDatetime( mClient.User.birthday )
            ? mClient.User.birthday
            : App.getISODate(); // 'not set';

        mClient.dataValues.User.email 
          = App.tools.isValidEmail( mClient.User.email )
            ? mClient.User.email
            : 'not set';

      }

      // console.debug({found: mClients.count});
      App.json( res, true, App.t('success', res.lang), mClients);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


