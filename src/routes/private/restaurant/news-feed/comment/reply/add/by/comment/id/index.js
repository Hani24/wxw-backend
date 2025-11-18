const express = require('express');
const router = express.Router();

// POST /private/restaurant/news-feed/comment/reply/add/by/comment/id
// Body: { "id": <commentId>, "reply": <string> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const commentId = req.getCommonDataInt('id', null);
      const reply = req.getCommonDataString('reply', '').trim();

      if (!App.isPosNumber(commentId))
        return App.json(res, 417, App.t(['comment', 'id', 'is-required'], req.lang));

      if (!reply || reply.length === 0)
        return App.json(res, 417, App.t(['reply', 'is-required'], req.lang));

      if (reply.length > 500)
        return App.json(res, 417, App.t(['reply', 'too-long'], req.lang));

      // Check if comment exists and belongs to restaurant's post
      const mComment = await App.getModel('PostComment').findByPk(commentId, {
        include: [{
          model: App.getModel('RestaurantPost'),
          where: { isDeleted: false }
        }]
      });

      if (!mComment || mComment.isDeleted)
        return App.json(res, 404, App.t(['comment', 'not-found'], req.lang));

      // Verify comment is on restaurant's post
      if (mComment.RestaurantPost.restaurantId !== mRestaurant.id)
        return App.json(res, 403, App.t(['you-dont-have-permission'], req.lang));

      // Create reply
      const mReply = await App.getModel('CommentReply').create({
        commentId,
        userId: mUser.id,
        userType: 'restaurant',
        reply: reply.substr(0, 500)
      });

      if (!mReply)
        return App.json(res, 417, App.t(['failed-to', 'create', 'reply'], req.lang));

      // Increment reply count
      await App.getModel('PostComment').incrementReplies(commentId);

      // Get reply with user info
      const replyWithUser = await App.getModel('CommentReply').findByPk(mReply.id, {
        include: [{
          model: App.getModel('User'),
          attributes: ['id', 'firstName', 'lastName', 'image', 'email'],
        }],
      });

      App.json(res, true, App.t('success', req.lang), replyWithUser);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
