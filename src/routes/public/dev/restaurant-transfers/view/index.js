const express = require('express');
const router = express.Router();

// /public/dev/restaurant-transfers/view/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mRestaurantTransfers = await App.getModel('RestaurantTransfer').findAll({
        where: {
          status: { [App.DB.Op.not]: 'none' },
          isInited: true,
        },
        include: [{
          model: App.getModel('Restaurant'),
          attributes: ['id','name','shareableLink'],
        }],
        order: [['id','desc']],
      });

      return await App.renderUI( res, 'dev-internal-set-all-coords', {
        title: 'Restaurants-Transfers',
        header: App.t(['Restaurants-Transfers'], req.lang,'<br/>'),
        // message: App.t(['Success message'], req.lang),
        // icon: { name: 'success', size: 100 },
        content: {
          partial: '/restaurants-transfers/transfers',
          data: {
            data: {
              transfers: mRestaurantTransfers,
            },
          },
        },
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
