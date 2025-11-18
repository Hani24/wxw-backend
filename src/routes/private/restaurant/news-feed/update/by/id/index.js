const express = require('express');
const router = express.Router();

// POST /private/restaurant/news-feed/update/by/id
// Body: {
//   "id": <postId>,
//   "title": <string> (optional),
//   "content": <string> (optional),
//   "image": <string> (optional),
//   "eventDate": <YYYY-MM-DD> (optional, for events),
//   "eventStartTime": <HH:MM> (optional, for events),
//   "eventEndTime": <HH:MM> (optional, for events),
//   "eventLocation": <string> (optional, for events)
// }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const postId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      // Find post and verify ownership
      const mPost = await App.getModel('RestaurantPost').findByPk(postId);

      if (!mPost)
        return App.json(res, 404, App.t(['post', 'not-found'], req.lang));

      if (mPost.restaurantId !== mRestaurant.id)
        return App.json(res, 403, App.t(['permission-denied'], req.lang));

      if (mPost.isDeleted)
        return App.json(res, 404, App.t(['post', 'not-found'], req.lang));

      // Build update object
      const updateData = {};

      if (data.title !== undefined) {
        const title = req.getCommonDataString('title', '').trim();
        if (!title || title.length === 0)
          return App.json(res, 417, App.t(['title', 'is-required'], req.lang));
        if (title.length > 255)
          return App.json(res, 417, App.t(['title', 'too-long'], req.lang));
        updateData.title = title.substr(0, 255);
      }

      if (data.content !== undefined) {
        const content = req.getCommonDataString('content', '').trim();
        if (!content || content.length === 0)
          return App.json(res, 417, App.t(['content', 'is-required'], req.lang));
        updateData.content = content;
      }

      if (data.image !== undefined) {
        updateData.image = req.getCommonDataString('image', null);
      }

      // Event-specific fields
      if (mPost.postType === 'event') {
        if (data.eventDate !== undefined) {
          const eventDate = req.getCommonDataString('eventDate', '');
          const today = App.DT.moment().format('YYYY-MM-DD');
          if (eventDate && eventDate < today)
            return App.json(res, 417, App.t(['event-date', 'must-be-future'], req.lang));
          updateData.eventDate = eventDate;
        }

        if (data.eventStartTime !== undefined) {
          updateData.eventStartTime = req.getCommonDataString('eventStartTime', null);
        }

        if (data.eventEndTime !== undefined) {
          updateData.eventEndTime = req.getCommonDataString('eventEndTime', null);
        }

        if (data.eventLocation !== undefined) {
          updateData.eventLocation = req.getCommonDataString('eventLocation', null);
        }
      }

      // Update post
      await mPost.update(updateData);

      App.json(res, true, App.t('success', req.lang), mPost);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
