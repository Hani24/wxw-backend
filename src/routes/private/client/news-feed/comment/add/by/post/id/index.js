const express = require('express');
const router = express.Router();

// POST /private/client/news-feed/comment/add/by/post/id
// Body: { "id": <postId>, "comment": <string> }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const postId = req.getCommonDataInt('id', null);
      const comment = req.getCommonDataString('comment', '').trim();

      if (!App.isPosNumber(postId))
        return App.json(res, 417, App.t(['post', 'id', 'is-required'], req.lang));

      if (!comment || comment.length === 0)
        return App.json(res, 417, App.t(['comment', 'is-required'], req.lang));

      if (comment.length > 500)
        return App.json(res, 417, App.t(['comment', 'too-long'], req.lang));

      // Check if post exists
      const mPost = await App.getModel('RestaurantPost').findByPk(postId, {
        include: [{
          model: App.getModel('Restaurant')
        }]
      });

      if (!mPost)
        return App.json(res, 404, App.t(['post', 'not-found'], req.lang));

      if (mPost.isDeleted)
        return App.json(res, 404, App.t(['post', 'not-found'], req.lang));

      // Create comment
      const mComment = await App.getModel('PostComment').create({
        postId,
        clientId: mClient.id,
        comment: comment.substr(0, 500)
      });

      if (!mComment)
        return App.json(res, 417, App.t(['failed-to', 'create', 'comment'], req.lang));

      // Increment comment count
      await App.getModel('RestaurantPost').incrementComments(postId);

      // Send notification to restaurant
      if (mPost.Restaurant) {
        await App.getModel('RestaurantNotification').notify(mPost.Restaurant, {
          event: 'postCommented',
          title: App.t('new-comment', req.lang),
          message: `${mUser.firstName} ${mUser.lastName}: ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
          image: mPost.image,
          data: {
            postId: postId,
            commentId: mComment.id,
            clientId: mClient.id
          },
          type: 'postCommented'
        });
      }

      // Get comment with client info
      const commentWithClient = await App.getModel('PostComment').findByPk(mComment.id, {
        include: [{
          model: App.getModel('Client'),
          attributes: ['id'],
          include: [{
            model: App.getModel('User'),
            attributes: ['id', 'firstName', 'lastName', 'image'],
          }],
        }],
      });

      App.json(res, true, App.t('success', req.lang), commentWithClient);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
