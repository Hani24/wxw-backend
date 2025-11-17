const express = require('express');
const router = express.Router();

// POST /private/client/news-feed/comment/delete/by/id
// Body: { "id": <commentId> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const commentId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(commentId))
        return App.json(res, 417, App.t(['comment', 'id', 'is-required'], req.lang));

      // Delete comment (only author can delete via client endpoint)
      const result = await App.getModel('PostComment').deleteComment(
        commentId,
        mUser.id,
        'client'
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
