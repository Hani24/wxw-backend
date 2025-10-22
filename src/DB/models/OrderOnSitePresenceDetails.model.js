const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    orderId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      unique: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Orders',
        key: 'id'
      },
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      required: true,
    },
    eventStartTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
    eventEndTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
    numberOfPeople: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      required: true,
    },
    numberOfHours: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      required: true,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    estimatedBasePrice: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estimatedServiceFee: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estimatedTotalPrice: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    restaurantAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    restaurantRejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    acceptanceDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  });

  /**
   * Get details by order ID
   */
  Model.getByOrderId = async function(orderId){
    return await Model.findOne({
      where: { orderId }
    });
  };

  /**
   * Mark order as accepted by restaurant
   */
  Model.markAsAccepted = async function(orderId){
    const details = await Model.getByOrderId(orderId);

    if(!details){
      return {
        success: false,
        message: 'Order details not found',
        data: null
      };
    }

    if(details.restaurantAcceptedAt){
      return {
        success: false,
        message: 'Order already accepted',
        data: null
      };
    }

    if(details.restaurantRejectedAt){
      return {
        success: false,
        message: 'Order already rejected',
        data: null
      };
    }

    // Check if deadline passed
    if(Model.isAcceptanceDeadlinePassed(details)){
      return {
        success: false,
        message: 'Acceptance deadline has passed',
        data: null
      };
    }

    await details.update({
      restaurantAcceptedAt: App.getISODate(),
    });

    return {
      success: true,
      message: 'Order accepted successfully',
      data: details
    };
  };

  /**
   * Mark order as rejected by restaurant
   */
  Model.markAsRejected = async function(orderId, reason = null){
    const details = await Model.getByOrderId(orderId);

    if(!details){
      return {
        success: false,
        message: 'Order details not found',
        data: null
      };
    }

    if(details.restaurantAcceptedAt){
      return {
        success: false,
        message: 'Order already accepted',
        data: null
      };
    }

    if(details.restaurantRejectedAt){
      return {
        success: false,
        message: 'Order already rejected',
        data: null
      };
    }

    await details.update({
      restaurantRejectedAt: App.getISODate(),
      rejectionReason: reason,
    });

    return {
      success: true,
      message: 'Order rejected successfully',
      data: details
    };
  };

  /**
   * Check if acceptance deadline has passed
   * @param {object} details - OrderOnSitePresenceDetails instance or plain object
   * @returns {boolean}
   */
  Model.isAcceptanceDeadlinePassed = function(details){
    if(!details || !details.acceptanceDeadline){
      return false;
    }

    const deadline = new Date(details.acceptanceDeadline);
    const now = new Date();

    return now > deadline;
  };

  /**
   * Calculate 24-hour deadline from creation time
   */
  Model.calculate24HourDeadline = function(createdAt = null){
    const baseTime = createdAt ? new Date(createdAt) : new Date();
    const deadline = new Date(baseTime.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours
    return deadline;
  };

  return Model;
};
