const express = require('express');
const router = express.Router();

// GET /private/restaurant/news-feed/get/my
// Query params:
// - offset (optional, default: 0)
// - limit (optional, default: 20)

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || 20)));

      const result = await App.getModel('RestaurantPost').getByRestaurantId(mRestaurant.id, {
        offset,
        limit
      });

      if (!result)
        return App.json(res, 417, App.t(['failed-to', 'get', 'posts'], req.lang));

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
