const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const RSVP_STATUSES = App.getDictByName('RSVP_STATUSES');

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
    status: {
      type: Sequelize.ENUM('interested', 'going', 'not-going'),
      required: true,
      defaultValue: 'interested',
      allowNull: false,
    },
  });

  /**
   * Set/Update RSVP status
   * Returns: { status: string }
   */
  Model.setRSVP = async function (postId, clientId, status) {
    if (!App.isPosNumber(Math.floor(+postId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return { success: false, message: 'Invalid parameters' };
    }

    postId = Math.floor(+postId);
    clientId = Math.floor(+clientId);

    // Validate status
    if (!RSVP_STATUSES.includes(status)) {
      return { success: false, message: 'Invalid RSVP status' };
    }

    // Check if post exists and is an event
    const RestaurantPost = App.getModel('RestaurantPost');
    const post = await RestaurantPost.findByPk(postId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }
    if (post.postType !== 'event') {
      return { success: false, message: 'RSVP only available for events' };
    }

    // Check if RSVP already exists
    const existingRSVP = await Model.findOne({
      where: { postId, clientId }
    });

    const oldStatus = existingRSVP ? existingRSVP.status : null;

    if (existingRSVP) {
      // Update existing RSVP
      await existingRSVP.update({ status });
    } else {
      // Create new RSVP
      await Model.create({ postId, clientId, status });
    }

    // Update totalRSVPs count based on status changes
    const oldCountsTowardTotal = oldStatus === 'interested' || oldStatus === 'going';
    const newCountsTowardTotal = status === 'interested' || status === 'going';

    if (!oldCountsTowardTotal && newCountsTowardTotal) {
      // New RSVP or changing from 'not-going' to 'interested'/'going'
      await RestaurantPost.incrementRSVPs(postId);
    } else if (oldCountsTowardTotal && !newCountsTowardTotal) {
      // Changing from 'interested'/'going' to 'not-going'
      await RestaurantPost.decrementRSVPs(postId);
    }

    return { success: true, status: status };
  };

  /**
   * Remove RSVP
   */
  Model.removeRSVP = async function (postId, clientId) {
    if (!App.isPosNumber(Math.floor(+postId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return { success: false, message: 'Invalid parameters' };
    }

    postId = Math.floor(+postId);
    clientId = Math.floor(+clientId);

    const rsvp = await Model.findOne({
      where: {
        postId: postId,
        clientId: clientId
      }
    });

    if (!rsvp) {
      return { success: false, message: 'RSVP not found' };
    }

    const oldStatus = rsvp.status;
    await rsvp.destroy();

    // Update totalRSVPs count if the removed RSVP was 'interested' or 'going'
    if (oldStatus === 'interested' || oldStatus === 'going') {
      const RestaurantPost = App.getModel('RestaurantPost');
      await RestaurantPost.decrementRSVPs(postId);
    }

    return { success: true };
  };

  /**
   * Get RSVP status for a client on a post
   */
  Model.getRSVPStatus = async function (postId, clientId) {
    if (!App.isPosNumber(Math.floor(+postId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return null;
    }
    const rsvp = await Model.findOne({
      where: {
        postId: Math.floor(+postId),
        clientId: Math.floor(+clientId)
      }
    });
    return rsvp ? rsvp.status : null;
  };

  /**
   * Get RSVPs by post (event) ID
   */
  Model.getByPostId = async function (postId, {offset=0, limit=100, status=null}={}) {
    if (!App.isPosNumber(Math.floor(+postId))) return null;

    const whereClause = { postId: Math.floor(+postId) };
    if (status && RSVP_STATUSES.includes(status)) {
      whereClause.status = status;
    }

    return await Model.findAndCountAll({
      where: whereClause,
      include: [{
        model: App.getModel('Client'),
        attributes: ['id'],
        include: [{
          model: App.getModel('User'),
          attributes: ['id', 'firstName', 'lastName', 'image'],
        }],
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
  };

  /**
   * Get RSVP counts by status for a post
   */
  Model.getRSVPCounts = async function (postId) {
    if (!App.isPosNumber(Math.floor(+postId))) return null;

    const counts = {
      interested: 0,
      going: 0,
      notGoing: 0,
      total: 0
    };

    const rsvps = await Model.findAll({
      where: { postId: Math.floor(+postId) },
      attributes: ['status'],
    });

    rsvps.forEach(rsvp => {
      if (rsvp.status === 'interested') counts.interested++;
      else if (rsvp.status === 'going') counts.going++;
      else if (rsvp.status === 'not-going') counts.notGoing++;
      counts.total++;
    });

    return counts;
  };

  /**
   * Get events RSVP'd by a client
   */
  Model.getByClientId = async function (clientId, {offset=0, limit=20}={}) {
    if (!App.isPosNumber(Math.floor(+clientId))) return null;
    return await Model.findAndCountAll({
      where: { clientId: Math.floor(+clientId) },
      include: [{
        model: App.getModel('RestaurantPost'),
        where: {
          postType: 'event',
          isDeleted: false
        },
        include: [{
          model: App.getModel('Restaurant'),
          attributes: ['id', 'name', 'image'],
        }],
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
  };

  return Model;

}
