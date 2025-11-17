const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

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
   * Toggle follow - Add if not exists, remove if exists
   * Returns: { isFollowing: boolean }
   */
  Model.toggleFollow = async function (restaurantId, clientId) {
    if (!App.isPosNumber(Math.floor(+restaurantId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return { success: false, message: 'Invalid parameters' };
    }

    restaurantId = Math.floor(+restaurantId);
    clientId = Math.floor(+clientId);

    // Check if restaurant exists
    const restaurant = await App.getModel('Restaurant').findByPk(restaurantId);
    if (!restaurant) {
      return { success: false, message: 'Restaurant not found' };
    }

    // Check if already following
    const existingFollow = await Model.findOne({
      where: { restaurantId, clientId }
    });

    if (existingFollow) {
      // Unfollow
      await existingFollow.destroy();
      return { success: true, isFollowing: false };
    } else {
      // Follow
      await Model.create({ restaurantId, clientId });
      return { success: true, isFollowing: true };
    }
  };

  /**
   * Check if client is following a restaurant
   */
  Model.isFollowing = async function (restaurantId, clientId) {
    if (!App.isPosNumber(Math.floor(+restaurantId)) || !App.isPosNumber(Math.floor(+clientId))) {
      return false;
    }
    const follow = await Model.findOne({
      where: {
        restaurantId: Math.floor(+restaurantId),
        clientId: Math.floor(+clientId)
      }
    });
    return !!follow;
  };

  /**
   * Get restaurants followed by a client
   */
  Model.getFollowedRestaurants = async function (clientId, {offset=0, limit=20}={}) {
    if (!App.isPosNumber(Math.floor(+clientId))) return null;
    return await Model.findAndCountAll({
      where: { clientId: Math.floor(+clientId) },
      include: [{
        model: App.getModel('Restaurant'),
        attributes: ['id', 'name', 'image', 'description', 'lat', 'lon', 'rating'],
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
  };

  /**
   * Get followers of a restaurant
   */
  Model.getRestaurantFollowers = async function (restaurantId, {offset=0, limit=20}={}) {
    if (!App.isPosNumber(Math.floor(+restaurantId))) return null;
    return await Model.findAndCountAll({
      where: { restaurantId: Math.floor(+restaurantId) },
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
   * Get client IDs following a restaurant (for notifications)
   */
  Model.getFollowerClientIds = async function (restaurantId) {
    if (!App.isPosNumber(Math.floor(+restaurantId))) return [];
    const followers = await Model.findAll({
      where: { restaurantId: Math.floor(+restaurantId) },
      attributes: ['clientId'],
    });
    return followers.map(f => f.clientId);
  };

  return Model;

}
