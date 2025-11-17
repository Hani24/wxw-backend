const express = require('express');
const router = express.Router();

// POST /private/client/restaurant/follow/toggle/by/id
// Body: { "id": <restaurantId> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const restaurantId = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(restaurantId))
        return App.json(res, 417, App.t(['restaurant', 'id', 'is-required'], req.lang));

      // Check if restaurant exists
      const mRestaurant = await App.getModel('Restaurant').findByPk(restaurantId);
      if (!mRestaurant)
        return App.json(res, 404, App.t(['restaurant', 'not-found'], req.lang));

      if (mRestaurant.isDeleted)
        return App.json(res, 404, App.t(['restaurant', 'not-found'], req.lang));

      // Toggle follow
      const result = await App.getModel('RestaurantFollow').toggleFollow(restaurantId, mClient.id);

      if (!result.success)
        return App.json(res, 417, App.t(result.message, req.lang));

      // Send notification to restaurant if newly followed
      if (result.isFollowing) {
        await App.getModel('RestaurantNotification').notify(mRestaurant, {
          event: 'newFollower',
          title: App.t('new-follower', req.lang),
          message: `${mUser.firstName} ${mUser.lastName} ${App.t('started-following-your-restaurant', req.lang)}`,
          data: {
            clientId: mClient.id,
            restaurantId: restaurantId
          },
          type: 'newFollower'
        });
      }

      App.json(res, true, App.t(result.isFollowing ? 'following' : 'unfollowed', req.lang), {
        isFollowing: result.isFollowing
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
