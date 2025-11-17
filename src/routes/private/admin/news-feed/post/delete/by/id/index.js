const express = require('express');
const router = express.Router();

// POST /private/admin/news-feed/post/delete/by/id
// Body: { "id": <postId> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();

      const postId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      // Find post
      const mPost = await App.getModel('RestaurantPost').findByPk(postId);

      if (!mPost)
        return App.json(res, 404, App.t(['post', 'not-found'], req.lang));

      if (mPost.isDeleted)
        return App.json(res, 404, App.t(['post', 'already-deleted'], req.lang));

      // Soft delete
      await mPost.update({
        isDeleted: true,
        deletedAt: new Date()
      });

      App.json(res, true, App.t('success', req.lang));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
