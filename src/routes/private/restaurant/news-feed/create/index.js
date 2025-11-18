const express = require('express');
const router = express.Router();

// POST /private/restaurant/news-feed/create
// Body: {
//   "title": <string>,
//   "content": <string>,
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
      const image = req.getCommonDataString('image', null);

      if (!title || title.length === 0)
        return App.json(res, 417, App.t(['title', 'is-required'], req.lang));

      if (title.length > 255)
        return App.json(res, 417, App.t(['title', 'too-long'], req.lang));

      if (!content || content.length === 0)
        return App.json(res, 417, App.t(['content', 'is-required'], req.lang));

      // Create post
      const postData = {
        restaurantId: mRestaurant.id,
        title: title.substr(0, 255),
        content,
        image,
        postType: 'post',
        isPublished: true,
        publishedAt: new Date()
      };

      const mPost = await App.getModel('RestaurantPost').create(postData);

      if (!mPost)
        return App.json(res, 417, App.t(['failed-to', 'create', 'post'], req.lang));

      // Send notifications to followers
      const followerClientIds = await App.getModel('RestaurantFollow').getFollowerClientIds(mRestaurant.id);

      for (const clientId of followerClientIds) {
        const mClient = await App.getModel('Client').findByPk(clientId);
        if (mClient) {
          await App.getModel('ClientNotification').pushToClient(mClient, {
            title: mRestaurant.name,
            message: mPost.title,
            image: mPost.image,
            data: {
              type: 'newPost',
              postId: mPost.id,
              restaurantId: mRestaurant.id
            },
            type: 'newPost'
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
