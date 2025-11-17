const express = require('express');
const router = express.Router();

// POST /private/restaurant/news-feed/create-event
// Body: {
//   "title": <string>,
//   "content": <string>,
//   "eventDate": <YYYY-MM-DD>,
//   "eventStartTime": <HH:MM>,
//   "eventEndTime": <HH:MM>,
//   "eventLocation": <string> (optional),
//   "image": <string> (optional)
// }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const title = req.getCommonDataString('title', '').trim();
      const content = req.getCommonDataString('content', '').trim();
      const eventDate = req.getCommonDataString('eventDate', '');
      const eventStartTime = req.getCommonDataString('eventStartTime', '');
      const eventEndTime = req.getCommonDataString('eventEndTime', '');
      const eventLocation = req.getCommonDataString('eventLocation', null);
      const image = req.getCommonDataString('image', null);

      if (!title || title.length === 0)
        return App.json(res, 417, App.t(['title', 'is-required'], req.lang));

      if (title.length > 255)
        return App.json(res, 417, App.t(['title', 'too-long'], req.lang));

      if (!content || content.length === 0)
        return App.json(res, 417, App.t(['content', 'is-required'], req.lang));

      if (!eventDate)
        return App.json(res, 417, App.t(['event-date', 'is-required'], req.lang));

      // Validate event date is in the future
      const today = App.DT.moment().format('YYYY-MM-DD');
      if (eventDate < today)
        return App.json(res, 417, App.t(['event-date', 'must-be-future'], req.lang));

      if (!eventStartTime)
        return App.json(res, 417, App.t(['event-start-time', 'is-required'], req.lang));

      if (!eventEndTime)
        return App.json(res, 417, App.t(['event-end-time', 'is-required'], req.lang));

      // Create event post
      const postData = {
        restaurantId: mRestaurant.id,
        title: title.substr(0, 255),
        content,
        image,
        postType: 'event',
        eventDate,
        eventStartTime,
        eventEndTime,
        eventLocation,
        isPublished: true,
        publishedAt: new Date()
      };

      const mPost = await App.getModel('RestaurantPost').create(postData);

      if (!mPost)
        return App.json(res, 417, App.t(['failed-to', 'create', 'event'], req.lang));

      // Send notifications to followers
      const followerClientIds = await App.getModel('RestaurantFollow').getFollowerClientIds(mRestaurant.id);

      for (const clientId of followerClientIds) {
        const mClient = await App.getModel('Client').findByPk(clientId);
        if (mClient) {
          await App.getModel('ClientNotification').pushToClient(mClient, {
            title: `${mRestaurant.name} - ${App.t('new-event', req.lang)}`,
            message: `${mPost.title} on ${eventDate}`,
            image: mPost.image,
            data: {
              type: 'newEvent',
              postId: mPost.id,
              restaurantId: mRestaurant.id,
              eventDate
            },
            type: 'newEvent'
          });
        }
      }

      App.json(res, true, App.t('success', req.lang), mPost);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
