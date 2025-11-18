const express = require('express');
const router = express.Router();

// POST /private/client/news-feed/like/toggle/by/post/id
// Body: { "id": <postId> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const postId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      // Toggle like
      const result = await App.getModel('PostLike').toggleLike(postId, mClient.id);

      if (!result.success)
        return App.json(res, 417, App.t(result.message, req.lang));

      // Send notification to restaurant if new like
      if (result.isLiked) {
        const mPost = await App.getModel('RestaurantPost').findByPk(postId, {
          include: [{
            model: App.getModel('Restaurant')
          }]
        });

        if (mPost && mPost.Restaurant) {
          await App.getModel('RestaurantNotification').notify(mPost.Restaurant, {
            event: 'postLiked',
            title: App.t('post-liked', req.lang),
            message: `${mUser.firstName} ${mUser.lastName} ${App.t('liked-your-post', req.lang)}: ${mPost.title}`,
            image: mPost.image,
            data: {
              postId: postId,
              clientId: mClient.id
            },
            type: 'postLiked'
          });
        }
      }

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
