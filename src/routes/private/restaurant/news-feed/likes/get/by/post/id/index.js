const express = require('express');
const router = express.Router();

// GET /private/restaurant/news-feed/likes/get/by/post/id
// Query params:
// - id (required: post ID)
// - offset (optional, default: 0)
// - limit (optional, default: 50)

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const postId = parseInt(req.query.id || 0);
      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || 50)));

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      // Verify the post belongs to this restaurant
      const mPost = await App.getModel('RestaurantPost').findByPk(postId);

      if (!mPost)
        return App.json(res, 404, App.t(['post', 'not-found'], req.lang));

      if (mPost.restaurantId !== mRestaurant.id)
        return App.json(res, 403, App.t(['you-dont-have-permission'], req.lang));

      // Get likes for this post
      const result = await App.getModel('PostLike').getLikesByPost(postId, {
        offset,
        limit
      });

      if (!result)
        return App.json(res, 417, App.t(['failed-to', 'get', 'likes'], req.lang));

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
