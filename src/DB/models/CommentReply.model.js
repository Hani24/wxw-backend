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
    reply: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  });

  /**
   * Get replies for a specific comment
   */
  Model.getRepliesByComment = async function (commentId, {offset=0, limit=20, order='ASC'}={}) {
    if (!App.isPosNumber(Math.floor(+commentId))) return null;

    const result = await Model.findAndCountAll({
      where: {
        commentId: Math.floor(+commentId),
        isDeleted: false
      },
      include: [{
        model: App.getModel('User'),
        attributes: ['id', 'firstName', 'lastName', 'image', 'email'],
      }],
      order: [['createdAt', order]],
      offset,
      limit,
    });

    return {
      rows: result.rows,
      count: result.count
    };
  };

  /**
   * Delete reply with permission check
   * Can be deleted by: author, restaurant owner (if reply on their post), admin
   */
  Model.deleteReply = async function (replyId, userId, userRole) {
    if (!App.isPosNumber(Math.floor(+replyId)) || !App.isPosNumber(Math.floor(+userId))) {
      return { success: false, message: 'Invalid parameters' };
    }

    replyId = Math.floor(+replyId);
    userId = Math.floor(+userId);

    // Get reply with related data
    const reply = await Model.findByPk(replyId, {
      include: [
        {
          model: App.getModel('User'),
          attributes: ['id']
        },
        {
          model: App.getModel('PostComment'),
          include: [{
            model: App.getModel('RestaurantPost'),
            include: [{
              model: App.getModel('Restaurant'),
              include: [{
                model: App.getModel('User'),
                attributes: ['id']
              }]
            }]
          }]
        }
      ]
    });

    if (!reply) {
      return { success: false, message: 'Reply not found' };
    }

    if (reply.isDeleted) {
      return { success: false, message: 'Reply not found' };
    }

    // Check permissions
    const isReplyAuthor = reply.User.id === userId;
    const isRestaurantOwner = reply.PostComment.RestaurantPost.Restaurant.User.id === userId;
    const isAdmin = userRole === 'admin';

    if (!isReplyAuthor && !isRestaurantOwner && !isAdmin) {
      return { success: false, message: 'You don\'t have permission to delete this reply' };
    }

    // Soft delete
    reply.isDeleted = true;
    reply.deletedAt = new Date();
    await reply.save();

    // Decrement reply count
    await App.getModel('PostComment').decrementReplies(reply.commentId);

    return { success: true };
  };

  return Model;

}
