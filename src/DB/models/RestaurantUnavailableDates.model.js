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
    unavailableDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      required: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    isFullDayBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    blockedFromTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
    blockedToTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
  });

  /**
   * Get unavailable dates for a restaurant in a date range
   */
  Model.getByRestaurantId = async function(restaurantId, startDate = null, endDate = null){
    const where = { restaurantId };

    if(startDate && endDate){
      where.unavailableDate = {
        [App.DB.Op.between]: [startDate, endDate]
      };
    } else if(startDate){
      where.unavailableDate = {
        [App.DB.Op.gte]: startDate
      };
    }

    return await Model.findAll({
      where,
      order: [['unavailableDate', 'ASC']]
    });
  };

  /**
   * Check if a specific date is available for a restaurant
   * @returns {boolean} true if available, false if blocked
   */
  Model.isDateAvailable = async function(restaurantId, date){
    const blocked = await Model.findOne({
      where: {
        restaurantId,
        unavailableDate: date,
      }
    });

    return blocked === null; // true if no blocking found
  };

  /**
   * Add an unavailable date for a restaurant
   */
  Model.addUnavailableDate = async function(restaurantId, date, reason = null){
    // Check if already exists
    const existing = await Model.findOne({
      where: {
        restaurantId,
        unavailableDate: date,
      }
    });

    if(existing){
      return {
        success: false,
        message: 'Date is already marked as unavailable',
        data: null
      };
    }

    const record = await Model.create({
      restaurantId,
      unavailableDate: date,
      reason,
      isFullDayBlocked: true,
    });

    return {
      success: true,
      message: 'Date marked as unavailable',
      data: record
    };
  };

  /**
   * Remove an unavailable date
   */
  Model.removeUnavailableDate = async function(id){
    const record = await Model.findByPk(id);

    if(!record){
      return {
        success: false,
        message: 'Record not found',
        data: null
      };
    }

    await record.destroy();

    return {
      success: true,
      message: 'Date unblocked successfully',
      data: null
    };
  };

  /**
   * Get unavailable dates as an array of date strings
   */
  Model.getUnavailableDatesList = async function(restaurantId, startDate = null, endDate = null){
    const records = await Model.getByRestaurantId(restaurantId, startDate, endDate);
    return records.map(r => r.unavailableDate);
  };

  return Model;
};
