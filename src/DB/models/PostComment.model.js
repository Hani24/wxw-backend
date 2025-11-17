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
    comment: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '',
    },
    totalLikes: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalReplies: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
  });

  /**
   * Get comments by post ID
   */
  Model.getByPostId = async function (postId, {offset=0, limit=20, order='ASC'}={}) {
    if (!App.isPosNumber(Math.floor(+postId))) return null;
    return await Model.findAndCountAll({
      where: {
        postId: Math.floor(+postId),
        isDeleted: false
      },
      include: [{
        model: App.getModel('Client'),
        attributes: ['id'],
        include: [{
          model: App.getModel('User'),
          attributes: ['id', 'firstName', 'lastName', 'image'],
        }],
      }],
      order: [['createdAt', order]],
      offset,
      limit,
    });
  };

  /**
   * Get comments by client ID
   */
  Model.getByClientId = async function (clientId, {offset=0, limit=20}={}) {
    if (!App.isPosNumber(Math.floor(+clientId))) return null;
    return await Model.findAndCountAll({
      where: {
        clientId: Math.floor(+clientId),
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
  };

  /**
   * Delete comment (soft delete)
   * Can be deleted by: comment author, restaurant owner, or admin
   */
  Model.deleteComment = async function (commentId, userId, userRole) {
    if (!App.isPosNumber(Math.floor(+commentId))) {
      return { success: false, message: 'Invalid comment ID' };
    }

    commentId = Math.floor(+commentId);

    const comment = await Model.findByPk(commentId, {
      include: [{
        model: App.getModel('Client'),
        include: [{
          model: App.getModel('User'),
        }],
      }, {
        model: App.getModel('RestaurantPost'),
        include: [{
          model: App.getModel('Restaurant'),
          include: [{
            model: App.getModel('User'),
          }],
        }],
      }],
    });

    if (!comment) {
      return { success: false, message: 'Comment not found' };
    }

    if (comment.isDeleted) {
      return { success: false, message: 'Comment already deleted' };
    }

    // Check permissions
    const isCommentAuthor = comment.Client.User.id === userId;
    const isRestaurantOwner = comment.RestaurantPost.Restaurant.User.id === userId;
    const isAdmin = userRole === 'admin';

    if (!isCommentAuthor && !isRestaurantOwner && !isAdmin) {
      return { success: false, message: 'Permission denied' };
    }

    // Soft delete the comment
    await comment.update({
      isDeleted: true,
      deletedAt: new Date()
    });

    // Soft delete all replies to this comment
    const deletedAt = new Date();
    await App.getModel('CommentReply').update(
      { isDeleted: true, deletedAt },
      { where: { commentId, isDeleted: false } }
    );

    // Hard delete all likes on this comment (no need to keep them)
    await App.getModel('CommentLike').destroy({
      where: { commentId }
    });

    // Decrement comment count on post
    await App.getModel('RestaurantPost').decrementComments(comment.postId);

    return { success: true, message: 'Comment deleted' };
  };

  /**
   * Increment likes counter
   */
  Model.incrementLikes = async function (commentId) {
    if (!App.isPosNumber(Math.floor(+commentId))) return false;
    const comment = await Model.findByPk(Math.floor(+commentId));
    if (!comment) return false;
    await comment.update({ totalLikes: comment.totalLikes + 1 });
    return true;
  };

  /**
   * Decrement likes counter
   */
  Model.decrementLikes = async function (commentId) {
    if (!App.isPosNumber(Math.floor(+commentId))) return false;
    const comment = await Model.findByPk(Math.floor(+commentId));
    if (!comment || comment.totalLikes <= 0) return false;
    await comment.update({ totalLikes: comment.totalLikes - 1 });
    return true;
  };

  /**
   * Increment replies counter
   */
  Model.incrementReplies = async function (commentId) {
    if (!App.isPosNumber(Math.floor(+commentId))) return false;
    const comment = await Model.findByPk(Math.floor(+commentId));
    if (!comment) return false;
    await comment.update({ totalReplies: comment.totalReplies + 1 });
    return true;
  };

  /**
   * Decrement replies counter
   */
  Model.decrementReplies = async function (commentId) {
    if (!App.isPosNumber(Math.floor(+commentId))) return false;
    const comment = await Model.findByPk(Math.floor(+commentId));
    if (!comment || comment.totalReplies <= 0) return false;
    await comment.update({ totalReplies: comment.totalReplies - 1 });
    return true;
  };

  return Model;

}
