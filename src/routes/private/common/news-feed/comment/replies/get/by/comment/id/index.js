const express = require('express');
const router = express.Router();

// GET /private/common/news-feed/comment/replies/get/by/comment/id
// Query params:
// - id (required: comment ID)
// - offset (optional, default: 0)
// - limit (optional, default: 20)
// Can be used by both clients and restaurants

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;

      const commentId = parseInt(req.query.id || 0);
      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || 20)));

      if (!App.isPosNumber(commentId))
        return App.json(res, 417, App.t(['comment', 'id', 'is-required'], req.lang));

      // Check if comment exists
      const mComment = await App.getModel('PostComment').findByPk(commentId);
      if (!mComment || mComment.isDeleted)
        return App.json(res, 404, App.t(['comment', 'not-found'], req.lang));

      // Get replies
      const result = await App.getModel('CommentReply').getRepliesByComment(commentId, {
        offset,
        limit,
        order: 'ASC' // Oldest first for natural conversation flow
      });

      if (!result)
        return App.json(res, 417, App.t(['failed-to', 'get', 'replies'], req.lang));

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
