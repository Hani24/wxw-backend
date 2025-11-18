const express = require('express');
const router = express.Router();

// POST /private/common/news-feed/comment/like/toggle/by/id
// Body: { "id": <commentId> }
// Can be used by both clients and restaurants

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();

      const commentId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(commentId))
        return App.json(res, 417, App.t(['comment', 'id', 'is-required'], req.lang));

      // Determine user type
      let userType = null;
      if (req.client) {
        userType = 'client';
      } else if (req.restaurant) {
        userType = 'restaurant';
      } else {
        return App.json(res, 403, App.t(['you-must-be-logged-in'], req.lang));
      }

      // Toggle like
      const result = await App.getModel('CommentLike').toggleLike(commentId, mUser.id, userType);

      if (!result.success)
        return App.json(res, 417, App.t(result.message, req.lang));

      App.json(res, true, App.t('success', req.lang), {
        isLiked: result.isLiked,
        totalLikes: result.totalLikes
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
