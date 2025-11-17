const express = require('express');
const router = express.Router();

// POST /private/client/news-feed/rsvp/set/by/post/id
// Body: { "id": <postId>, "status": "interested"|"going"|"not-going" }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const postId = req.getCommonDataInt('id', null);
      const status = req.getCommonDataString('status', '').toLowerCase();

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      const validStatuses = ['interested', 'going', 'not-going'];
      if (!validStatuses.includes(status))
        return App.json(res, 417, App.t(['invalid', 'rsvp', 'status'], req.lang));

      // Set RSVP
      const result = await App.getModel('EventRSVP').setRSVP(postId, mClient.id, status);

      if (!result.success)
        return App.json(res, 417, App.t(result.message, req.lang));

      // Send notification to restaurant
      const mPost = await App.getModel('RestaurantPost').findByPk(postId, {
        include: [{
          model: App.getModel('Restaurant')
        }]
      });

      if (mPost && mPost.Restaurant && (status === 'interested' || status === 'going')) {
        const statusText = status === 'going' ? 'is going to' : 'is interested in';
        await App.getModel('RestaurantNotification').notify(mPost.Restaurant, {
          event: 'eventRSVP',
          title: App.t('new-event-rsvp', req.lang),
          message: `${mUser.firstName} ${mUser.lastName} ${statusText} ${mPost.title}`,
          image: mPost.image,
          data: {
            postId: postId,
            clientId: mClient.id,
            rsvpStatus: status
          },
          type: 'eventRSVP'
        });
      }

      App.json(res, true, App.t('success', req.lang), {
        status: result.status
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
