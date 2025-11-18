const express = require('express');
const router = express.Router();

// GET /private/admin/news-feed/posts/get
// Query params:
// - offset (optional, default: 0)
// - limit (optional, default: 20)
// - restaurantId (optional: filter by restaurant)
// - postType (optional: 'post' or 'event')

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;

      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || 20)));
      const restaurantId = req.getCommonDataInt('restaurantId', null);
      const postType = req.query.postType || null;

      const whereClause = {};

      if (App.isPosNumber(restaurantId)) {
        whereClause.restaurantId = restaurantId;
      }

      if (postType && ['post', 'event'].includes(postType)) {
        whereClause.postType = postType;
      }

      const posts = await App.getModel('RestaurantPost').findAndCountAll({
        where: whereClause,
        include: [{
          model: App.getModel('Restaurant'),
          attributes: ['id', 'name', 'image'],
        }],
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        distinct: true
      });

      App.json(res, true, App.t('success', req.lang), {
        rows: posts.rows,
        count: posts.count,
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
