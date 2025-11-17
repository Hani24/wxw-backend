const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    commentId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'PostComments',
        key: 'id'
      },
    },
    userId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id'
      },
    },
    userType: {
      type: Sequelize.ENUM('client', 'restaurant'),
      allowNull: false,
      required: true,
    },
  });

  /**
   * Toggle like on a comment - Add if not exists, remove if exists
   * Returns: { isLiked: boolean, totalLikes: number }
   */
  Model.toggleLike = async function (commentId, userId, userType) {
    if (!App.isPosNumber(Math.floor(+commentId)) || !App.isPosNumber(Math.floor(+userId))) {
      return { success: false, message: 'Invalid parameters' };
    }

    if (!['client', 'restaurant'].includes(userType)) {
      return { success: false, message: 'Invalid user type' };
    }

    commentId = Math.floor(+commentId);
    userId = Math.floor(+userId);

    // Check if comment exists
    const comment = await App.getModel('PostComment').findByPk(commentId);
    if (!comment) {
      return { success: false, message: 'Comment not found' };
    }

    if (comment.isDeleted) {
      return { success: false, message: 'Comment not found' };
    }

    // Check if already liked
    const existingLike = await Model.findOne({
      where: { commentId, userId, userType }
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      await App.getModel('PostComment').decrementLikes(commentId);
      const updatedComment = await App.getModel('PostComment').findByPk(commentId);
      return { success: true, isLiked: false, totalLikes: updatedComment.totalLikes };
    } else {
      // Like
      await Model.create({ commentId, userId, userType });
      await App.getModel('PostComment').incrementLikes(commentId);
      const updatedComment = await App.getModel('PostComment').findByPk(commentId);
      return { success: true, isLiked: true, totalLikes: updatedComment.totalLikes };
    }
  };

  /**
   * Check if user liked a comment
   */
  Model.isLikedByUser = async function (commentId, userId, userType) {
    if (!App.isPosNumber(Math.floor(+commentId)) || !App.isPosNumber(Math.floor(+userId))) {
      return false;
    }
    const like = await Model.findOne({
      where: {
        commentId: Math.floor(+commentId),
        userId: Math.floor(+userId),
        userType
      }
    });
    return !!like;
  };

  /**
   * Get likes for a specific comment
   */
  Model.getLikesByComment = async function (commentId, {offset=0, limit=50}={}) {
    if (!App.isPosNumber(Math.floor(+commentId))) return null;

    const result = await Model.findAndCountAll({
      where: { commentId: Math.floor(+commentId) },
      include: [{
        model: App.getModel('User'),
        attributes: ['id', 'firstName', 'lastName', 'image', 'email'],
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
