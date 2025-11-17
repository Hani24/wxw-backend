const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    postId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'RestaurantPosts',
        key: 'id'
      },
    },
    clientId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Clients',
        key: 'id'
      },
    },
  });

  /**
   * Toggle like - Add if not exists, remove if exists
   * Returns: { isLiked: boolean, totalLikes: number }
   */
  Model.toggleLike = async function (postId, clientId) {
    if (!App.isPosNumber(Math.floor(+postId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return { success: false, message: 'Invalid parameters' };
    }

    postId = Math.floor(+postId);
    clientId = Math.floor(+clientId);

    // Check if post exists
    const post = await App.getModel('RestaurantPost').findByPk(postId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    // Check if already liked
    const existingLike = await Model.findOne({
      where: { postId, clientId }
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      await App.getModel('RestaurantPost').decrementLikes(postId);
      const updatedPost = await App.getModel('RestaurantPost').findByPk(postId);
      return { success: true, isLiked: false, totalLikes: updatedPost.totalLikes };
    } else {
      // Like
      await Model.create({ postId, clientId });
      await App.getModel('RestaurantPost').incrementLikes(postId);
      const updatedPost = await App.getModel('RestaurantPost').findByPk(postId);
      return { success: true, isLiked: true, totalLikes: updatedPost.totalLikes };
    }
  };

  /**
   * Check if client liked a post
   */
  Model.isLikedByClient = async function (postId, clientId) {
    if (!App.isPosNumber(Math.floor(+postId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return false;
    }
    const like = await Model.findOne({
      where: {
        postId: Math.floor(+postId),
        clientId: Math.floor(+clientId)
      }
    });
    return !!like;
  };

  /**
   * Get posts liked by a client
   */
  Model.getLikesByClient = async function (clientId, {offset=0, limit=20}={}) {
    if (!App.isPosNumber(Math.floor(+clientId))) return null;
    return await Model.findAndCountAll({
      where: { clientId: Math.floor(+clientId) },
      include: [{
        model: App.getModel('RestaurantPost'),
        where: { isDeleted: false },
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
  };

  /**
   * Get likes for a specific post (who liked this post)
   */
  Model.getLikesByPost = async function (postId, {offset=0, limit=50}={}) {
    if (!App.isPosNumber(Math.floor(+postId))) return null;

    const result = await Model.findAndCountAll({
      where: { postId: Math.floor(+postId) },
      include: [{
        model: App.getModel('Client'),
        attributes: ['id'],
        include: [{
          model: App.getModel('User'),
          attributes: ['id', 'firstName', 'lastName', 'image', 'email'],
        }],
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    return {
      rows: result.rows,
      count: result.count
    };
  };

  return Model;

}
