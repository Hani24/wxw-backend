const express = require('express');
const router = express.Router();

// POST /private/restaurant/news-feed/comment/delete/by/id
// Body: { "id": <commentId> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const commentId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(commentId))
        return App.json(res, 417, App.t(['comment', 'id', 'is-required'], req.lang));

      // Delete comment (restaurant can delete any comment on their posts)
      const result = await App.getModel('PostComment').deleteComment(
        commentId,
        mUser.id,
        'restaurant'
      );

      if (!result.success)
        return App.json(res, 417, App.t(result.message, req.lang));

      App.json(res, true, App.t('success', req.lang));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
