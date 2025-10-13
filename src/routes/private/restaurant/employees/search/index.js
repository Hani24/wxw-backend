const express = require('express');
const router = express.Router();

// {
//   "search": "required: <string>: [ %name%, %phone%, %email% ]"
// }

// /private/restaurant/employees/search/?offset=0&limit=15&order=asc&by=id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({order: 'asc'});
      const orderBy = App.getModel('User').getOrderBy(by);
      const roles = App.getModel('User').getRoles();

      // console.debug({raw:{search: req.getCommonDataString('search', null) }});

      const search = App.isString( req.getCommonDataString('search', null) )
        ? App.tools.stripSpecialChars( req.getCommonDataString('search', null) )
        : false;
 
      console.debug({search});

      if( !App.isString(search) || !search.length )
        return App.json( res, 417, App.t(['search','is-required'], req.lang) );

      const firstName = search.split(' ').length >= 1 ? search.split(' ')[0] : null;
      const lastName = search.split(' ').length >= 2 ? search.split(' ')[1] : null;

      console.debug({raw:{firstName, lastName}});

      const mRestoUsers = await App.getModel('User').findAndCountAll({
        where: {
          restaurantId: mRestaurant.id,
          isDeleted: false,
          role: { [ App.DB.Op.in ]: [ roles.manager, roles.employee ] },
          [ App.DB.Op.and ]: {
            [ App.DB.Op.or ]: [
              App.DB.where(App.DB.col('firstName'), 'like', `%${firstName}%`),
              App.DB.where(App.DB.col('firstName'), 'like', `%${lastName}%`),
              App.DB.where(App.DB.col('lastName'), 'like', `%${firstName}%`),
              App.DB.where(App.DB.col('lastName'), 'like', `%${lastName}%`),
              App.DB.where(App.DB.col('phone'), 'like', `%${search}%`),
              App.DB.where(App.DB.col('email'), 'like', `%${search}%`),
              App.DB.where(App.DB.col('role'), 'like', `%${search}%`),
            ]
          }
        },
        distinct: true,
        attributes: [
          'id','role','email','phone','fullName','firstName','lastName','image',
          'lang','gender',
          'isEmailVerified','isPhoneVerified',
          'isRestricted','restrictedAt',
          'lastSeenAt', 'createdAt'
        ],
        // include: [
        //   {
        //     required: false,
        //     model: App.getModel('Employee'),
        //     attributes: { exclude: ['userId','deletedAt','updatedAt','restrictedAt'] }
        //   },
        //   {
        //     required: false,
        //     model: App.getModel('Manager'),
        //     attributes: { exclude: ['userId','deletedAt','updatedAt','restrictedAt'] }
        //   },
        // ],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      // console.debug({found: mRestoUsers.count});
      App.json( res, true, App.t('success', res.lang), mRestoUsers);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


