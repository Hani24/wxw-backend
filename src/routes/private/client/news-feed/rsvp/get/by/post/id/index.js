const express = require('express');
const router = express.Router();

// GET /private/client/news-feed/rsvp/get/by/post/id
// Query params:
// - id (required: post ID)
// - offset (optional, default: 0)
// - limit (optional, default: 100)
// - status (optional: filter by RSVP status)

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const postId = parseInt(req.query.id || 0);
      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || 100)));
      const statusFilter = req.query.status || null;

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      const result = await App.getModel('EventRSVP').getByPostId(postId, {
        offset,
        limit,
        status: statusFilter
      });

      if (!result)
        return App.json(res, 417, App.t(['failed-to', 'get', 'rsvps'], req.lang));

      // Get RSVP counts
      const counts = await App.getModel('EventRSVP').getRSVPCounts(postId);

      App.json(res, true, App.t('success', req.lang), {
        rows: result.rows,
        count: result.count,
        offset,
        limit,
        counts
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
