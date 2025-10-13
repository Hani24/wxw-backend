const express = require('express');
const router = express.Router();

// /private/restaurant/employees/get/all/?offset=0&limit=15&order=asc

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('User').getOrderBy(by);
      const roles = App.getModel('User').getRoles();

      const mRestoUsers = await App.getModel('User').findAndCountAll({
        where: {
          restaurantId: mRestaurant.id,
          role: { [ App.DB.Op.in ]: [ roles.manager, roles.employee ] },
          isDeleted: false,
          isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id','role','email','phone','fullName','firstName','lastName','image',
          'isEmailVerified','isPhoneVerified',
          'isRestricted','lang','gender',
          'lastSeenAt', 'createdAt'
        ],
        include: [
          {
            required: false,
            model: App.getModel('Employee'),
            attributes: { exclude: ['userId','deletedAt','updatedAt','restrictedAt'] }
          },
          {
            required: false,
            model: App.getModel('Manager'),
            attributes: { exclude: ['userId','deletedAt','updatedAt','restrictedAt'] }
          },
        ],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      console.debug({found: mRestoUsers.count});
      App.json( res, true, App.t('success', res.lang), mRestoUsers);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


