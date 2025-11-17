const express = require('express');
const router = express.Router();

// GET /private/client/restaurant/followed/get
// Query params:
// - offset (optional, default: 0)
// - limit (optional, default: 20)

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || 20)));

      const result = await App.getModel('RestaurantFollow').getFollowedRestaurants(mClient.id, {
        offset,
        limit
      });

      if (!result)
        return App.json(res, 417, App.t(['failed-to', 'get', 'followed-restaurants'], req.lang));

      App.json(res, true, App.t('success', req.lang), {
        rows: result.rows,
        count: result.count,
        offset,
        limit
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
