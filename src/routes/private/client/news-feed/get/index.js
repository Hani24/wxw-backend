const express = require('express');
const router = express.Router();

// GET /private/client/news-feed/get
// Query params:
// - offset (optional, default: 0)
// - limit (optional, default: 20, max: 50)
// - filter (optional: 'all', 'today-events', 'upcoming-events')
//
// Note: Only shows posts from the last 30 days

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const offset = Math.max(0, parseInt(req.query.offset || 0));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || 20)));
      const filter = req.query.filter || 'all';

      // Get followed restaurants
      const followedRestaurants = await App.getModel('RestaurantFollow').findAll({
        where: { clientId: mClient.id },
        attributes: ['restaurantId']
      });
      const followedRestaurantIds = followedRestaurants.map(f => f.restaurantId);

      // Only show posts from the last 30 days
      const thirtyDaysAgo = App.DT.moment().subtract(30, 'days').toDate();

      let whereClause = {
        isPublished: true,
        isDeleted: false,
        publishedAt: {
          [App.DB.Op.gte]: thirtyDaysAgo
        }
      };

      let orderClause = [['publishedAt', 'DESC']];

      // Apply filter
      if (filter === 'today-events') {
        const today = App.DT.moment().format('YYYY-MM-DD');
        whereClause.postType = 'event';
        whereClause.eventDate = today;
        orderClause = [['eventStartTime', 'ASC']];
      } else if (filter === 'upcoming-events') {
        const tomorrow = App.DT.moment().add(1, 'day').format('YYYY-MM-DD');
        whereClause.postType = 'event';
        whereClause.eventDate = {
          [App.DB.Op.gte]: tomorrow
        };
        orderClause = [['eventDate', 'ASC'], ['eventStartTime', 'ASC']];
      }

      // If user follows restaurants, show posts from followed + nearby
      // If no follows, show only nearby restaurants (within 30 miles)
      let restaurantFilter = {};

      if (followedRestaurantIds.length > 0) {
        // Get nearby restaurants
        const nearbyRestaurants = await App.getModel('Restaurant').findAll({
          where: {
            isDeleted: false,
            lat: {
              [App.DB.Op.not]: null
            },
            lon: {
              [App.DB.Op.not]: null
            }
          },
          attributes: ['id', 'lat', 'lon']
        });

        const nearbyRestaurantIds = nearbyRestaurants
          .filter(restaurant => {
            if (!mClient.lat || !mClient.lon) return false;
            const distanceRes = App.geo.lib.getDistance(
              { lat: mClient.lat, lon: mClient.lon },
              { lat: restaurant.lat, lon: restaurant.lon },
              'miles'
            );
            if (!distanceRes.success) return false;
            return distanceRes.data.distance <= 30; // 30 miles radius
          })
          .map(r => r.id);

        // Combine followed and nearby (remove duplicates)
        const allRestaurantIds = [...new Set([...followedRestaurantIds, ...nearbyRestaurantIds])];

        if (allRestaurantIds.length > 0) {
          whereClause.restaurantId = {
            [App.DB.Op.in]: allRestaurantIds
          };
        }
      } else {
        // No follows - show only nearby restaurants
        const nearbyRestaurants = await App.getModel('Restaurant').findAll({
          where: {
            isDeleted: false,
            lat: {
              [App.DB.Op.not]: null
            },
            lon: {
              [App.DB.Op.not]: null
            }
          },
          attributes: ['id', 'lat', 'lon']
        });

        const nearbyRestaurantIds = nearbyRestaurants
          .filter(restaurant => {
            if (!mClient.lat || !mClient.lon) return false;
            const distanceRes = App.geo.lib.getDistance(
              { lat: mClient.lat, lon: mClient.lon },
              { lat: restaurant.lat, lon: restaurant.lon },
              'miles'
            );
            if (!distanceRes.success) return false;
            return distanceRes.data.distance <= 30; // 30 miles radius
          })
          .map(r => r.id);

        if (nearbyRestaurantIds.length > 0) {
          whereClause.restaurantId = {
            [App.DB.Op.in]: nearbyRestaurantIds
          };
        } else {
          // No nearby restaurants - return empty feed
          return App.json(res, true, App.t('success', req.lang), {
            rows: [],
            count: 0,
            offset,
            limit
          });
        }
      }

      // Fetch posts
      const posts = await App.getModel('RestaurantPost').findAndCountAll({
        where: whereClause,
        include: [{
          model: App.getModel('Restaurant'),
          attributes: ['id', 'name', 'image', 'lat', 'lon'],
        }],
        order: orderClause,
        offset,
        limit,
        distinct: true
      });

      // Check which posts the client has liked
      const postIds = posts.rows.map(p => p.id);
      const likes = await App.getModel('PostLike').findAll({
        where: {
          clientId: mClient.id,
          postId: {
            [App.DB.Op.in]: postIds
          }
        }
      });
      const likedPostIds = new Set(likes.map(l => l.postId));

      // Check RSVP status for events
      const rsvps = await App.getModel('EventRSVP').findAll({
        where: {
          clientId: mClient.id,
          postId: {
            [App.DB.Op.in]: postIds
          }
        }
      });
      const rsvpMap = {};
      rsvps.forEach(rsvp => {
        rsvpMap[rsvp.postId] = rsvp.status;
      });

      // Get RSVP counts for all event posts
      const eventPostIds = posts.rows.filter(p => p.postType === 'event').map(p => p.id);
      const allRsvps = await App.getModel('EventRSVP').findAll({
        where: {
          postId: {
            [App.DB.Op.in]: eventPostIds
          }
        },
        attributes: ['postId', 'status']
      });

      // Build RSVP counts map
      const rsvpCountsMap = {};
      allRsvps.forEach(rsvp => {
        if (!rsvpCountsMap[rsvp.postId]) {
          rsvpCountsMap[rsvp.postId] = {
            interested: 0,
            going: 0,
            not_going: 0
          };
        }
        if (rsvp.status === 'interested') {
          rsvpCountsMap[rsvp.postId].interested++;
        } else if (rsvp.status === 'going') {
          rsvpCountsMap[rsvp.postId].going++;
        } else if (rsvp.status === 'not-going') {
          rsvpCountsMap[rsvp.postId].not_going++;
        }
      });

      // Enhance posts with like status and RSVP status
      const enhancedPosts = posts.rows.map(post => {
        const postJson = post.toJSON();
        postJson.isLikedByMe = likedPostIds.has(post.id);

        if (post.postType === 'event') {
          postJson.clientRSVPStatus = rsvpMap[post.id] || null;
          postJson.rsvpCounts = rsvpCountsMap[post.id] || {
            interested: 0,
            going: 0,
            not_going: 0
          };
        }

        // Add isFollowedByClient flag to Restaurant
        if (postJson.Restaurant) {
          postJson.Restaurant.isFollowedByClient = followedRestaurantIds.includes(postJson.Restaurant.id);
        }

        return postJson;
      });

      App.json(res, true, App.t('success', req.lang), {
        rows: enhancedPosts,
        count: posts.count,
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
