const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const POST_TYPES = App.getDictByName('POST_TYPES');

  const Model = sequelize.define( exportModelWithName, {
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    title: {
      type: DataTypes.STRING(255), allowNull: false, defaultValue: '',
    },
    content: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '',
    },
    image: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null,
      get(){
        const imageName = this.getDataValue('image');
        return imageName ? App.S3.getUrlByName(imageName) : null;
      },
      set(image_t){
        this.setDataValue('image', !App.isString(image_t)
          ? null
          : image_t.split('/').length >= 3
            ? image_t.split('/').pop().trim()
            : image_t
        );
      },
    },
    postType: {
      type: Sequelize.ENUM('post', 'event'),
      required: true,
      defaultValue: 'post',
      allowNull: false,
    },
    // Event-specific fields (NULL for regular posts)
    eventDate: {
      type: DataTypes.DATEONLY, allowNull: true, defaultValue: null,
    },
    eventStartTime: {
      type: DataTypes.TIME, allowNull: true, defaultValue: null,
    },
    eventEndTime: {
      type: DataTypes.TIME, allowNull: true, defaultValue: null,
    },
    eventLocation: {
      type: DataTypes.STRING(255), allowNull: true, defaultValue: null,
    },
    // Engagement metrics (denormalized for performance)
    totalLikes: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalComments: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalRSVPs: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    },
    // Visibility & Status
    isPublished: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true,
    },
    publishedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
  });

  /**
   * Get posts by restaurant ID
   */
  Model.getByRestaurantId = async function (restaurantId, {offset=0, limit=20, order='DESC'}={}) {
    if (!App.isPosNumber(Math.floor(+restaurantId))) return null;
    return await Model.findAndCountAll({
      where: {
        restaurantId: Math.floor(+restaurantId),
        isDeleted: false
      },
      order: [['publishedAt', order]],
      offset,
      limit,
    });
  };

  /**
   * Get all published posts
   */
  Model.getPublishedPosts = async function ({offset=0, limit=20, order='DESC'}={}) {
    return await Model.findAndCountAll({
      where: {
        isPublished: true,
        isDeleted: false
      },
      include: [{
        model: App.getModel('Restaurant'),
        attributes: ['id', 'name', 'image'],
      }],
      order: [['publishedAt', order]],
      offset,
      limit,
    });
  };

  /**
   * Get today's events
   */
  Model.getTodayEvents = async function ({offset=0, limit=20}={}) {
    const today = App.DT.moment().format('YYYY-MM-DD');
    return await Model.findAndCountAll({
      where: {
        postType: 'event',
        eventDate: today,
        isPublished: true,
        isDeleted: false
      },
      include: [{
        model: App.getModel('Restaurant'),
        attributes: ['id', 'name', 'image'],
      }],
      order: [['eventStartTime', 'ASC']],
      offset,
      limit,
    });
  };

  /**
   * Get upcoming events (excluding today)
   */
  Model.getUpcomingEvents = async function ({offset=0, limit=20}={}) {
    const tomorrow = App.DT.moment().add(1, 'day').format('YYYY-MM-DD');
    return await Model.findAndCountAll({
      where: {
        postType: 'event',
        eventDate: {
          [App.DB.Op.gte]: tomorrow
        },
        isPublished: true,
        isDeleted: false
      },
      include: [{
        model: App.getModel('Restaurant'),
        attributes: ['id', 'name', 'image'],
      }],
      order: [['eventDate', 'ASC'], ['eventStartTime', 'ASC']],
      offset,
      limit,
    });
  };

  /**
   * Increment likes count
   */
  Model.incrementLikes = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post) return false;
    await post.update({ totalLikes: post.totalLikes + 1 });
    return true;
  };

  /**
   * Decrement likes count
   */
  Model.decrementLikes = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post) return false;
    await post.update({ totalLikes: Math.max(0, post.totalLikes - 1) });
    return true;
  };

  /**
   * Increment comments count
   */
  Model.incrementComments = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post) return false;
    await post.update({ totalComments: post.totalComments + 1 });
    return true;
  };

  /**
   * Decrement comments count
   */
  Model.decrementComments = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post) return false;
    await post.update({ totalComments: Math.max(0, post.totalComments - 1) });
    return true;
  };

  /**
   * Increment RSVP count
   */
  Model.incrementRSVPs = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post) return false;
    await post.update({ totalRSVPs: post.totalRSVPs + 1 });
    return true;
  };

  /**
   * Decrement RSVP count
   */
  Model.decrementRSVPs = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post) return false;
    await post.update({ totalRSVPs: Math.max(0, post.totalRSVPs - 1) });
    return true;
  };

  /**
   * Recalculate total RSVPs from EventRSVP table
   */
  Model.recalculateTotalRSVPs = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return false;
    const post = await Model.findByPk(Math.floor(+postId));
    if (!post || post.postType !== 'event') return false;

    const EventRSVP = App.getModel('EventRSVP');
    const count = await EventRSVP.count({
      where: {
        postId: Math.floor(+postId),
        status: {
          [App.DB.Op.in]: ['interested', 'going']
        }
      }
    });

    await post.update({ totalRSVPs: count });
    return true;
  };

  return Model;

}
