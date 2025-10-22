const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const ORDER_TYPES = App.getDictByName('ORDER_TYPES');
  const RESTAURANT_PRICING_MODELS = App.getDictByName('RESTAURANT_PRICING_MODELS');

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
    orderType: {
      type: Sequelize.ENUM,
      required: true,
      values: ORDER_TYPES,
      allowNull: false,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pricingModel: {
      type: Sequelize.ENUM,
      values: RESTAURANT_PRICING_MODELS,
      allowNull: true,
      defaultValue: null,
    },
    basePrice: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: null,
    },
    pricePerPerson: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: null,
    },
    pricePerHour: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: null,
    },
    minPeople: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    maxPeople: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    minHours: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    maxHours: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    },
    serviceFeePercentage: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 15.00,
    },
  });

  // Static Methods
  Model.getTypes = function(){
    return ORDER_TYPES.reduce((acc, type)=>{
      acc[ type ] = type;
      return acc;
    }, {});
  };

  Model.getPricingModels = function(){
    return RESTAURANT_PRICING_MODELS.reduce((acc, model)=>{
      acc[ model ] = model;
      return acc;
    }, {});
  };

  /**
   * Get all order type settings for a restaurant
   */
  Model.getByRestaurantId = async function(restaurantId){
    return await Model.findAll({
      where: { restaurantId },
      order: [['orderType', 'ASC']]
    });
  };

  /**
   * Get specific order type settings for a restaurant
   */
  Model.getByRestaurantIdAndType = async function(restaurantId, orderType){
    if(!ORDER_TYPES.includes(orderType))
      return null;

    return await Model.findOne({
      where: {
        restaurantId,
        orderType,
      }
    });
  };

  /**
   * Check if an order type is enabled for a restaurant
   */
  Model.isOrderTypeEnabled = async function(restaurantId, orderType){
    const settings = await Model.getByRestaurantIdAndType(restaurantId, orderType);
    return settings && settings.isEnabled === true;
  };

  /**
   * Calculate price for on-site presence based on restaurant settings
   * @param {number} restaurantId
   * @param {object} params - { numberOfPeople, numberOfHours }
   * @returns {object} - { success, basePrice, serviceFee, totalPrice, pricingModel, breakdown }
   */
  Model.calculateOnSitePresencePrice = async function(restaurantId, params){
    const { numberOfPeople, numberOfHours } = params;

    const settings = await Model.getByRestaurantIdAndType(restaurantId, 'on-site-presence');

    if(!settings || !settings.isEnabled){
      return {
        success: false,
        message: 'Restaurant does not support on-site presence orders',
        data: null
      };
    }

    // Validate parameters
    if(settings.minPeople && numberOfPeople < settings.minPeople){
      return {
        success: false,
        message: `Minimum ${settings.minPeople} people required`,
        data: null
      };
    }

    if(settings.maxPeople && numberOfPeople > settings.maxPeople){
      return {
        success: false,
        message: `Maximum ${settings.maxPeople} people allowed`,
        data: null
      };
    }

    if(settings.minHours && numberOfHours < settings.minHours){
      return {
        success: false,
        message: `Minimum ${settings.minHours} hours required`,
        data: null
      };
    }

    if(settings.maxHours && numberOfHours > settings.maxHours){
      return {
        success: false,
        message: `Maximum ${settings.maxHours} hours allowed`,
        data: null
      };
    }

    let basePrice = parseFloat(settings.basePrice || 0);
    let breakdown = {};

    // Calculate based on pricing model
    switch(settings.pricingModel){
      case 'per-person':
        const perPersonPrice = parseFloat(settings.pricePerPerson || 0);
        basePrice = perPersonPrice * numberOfPeople;
        breakdown = {
          pricingModel: 'per-person',
          pricePerPerson: perPersonPrice,
          numberOfPeople: numberOfPeople,
          calculation: `$${perPersonPrice} × ${numberOfPeople} people`
        };
        break;

      case 'per-hour':
        const perHourPrice = parseFloat(settings.pricePerHour || 0);
        basePrice = perHourPrice * numberOfHours;
        breakdown = {
          pricingModel: 'per-hour',
          pricePerHour: perHourPrice,
          numberOfHours: numberOfHours,
          calculation: `$${perHourPrice} × ${numberOfHours} hours`
        };
        break;

      case 'per-event':
        breakdown = {
          pricingModel: 'per-event',
          flatFee: basePrice,
          calculation: `Flat fee of $${basePrice}`
        };
        break;

      default:
        return {
          success: false,
          message: 'Invalid pricing model configured',
          data: null
        };
    }

    const serviceFeePercentage = parseFloat(settings.serviceFeePercentage || 15);
    const serviceFee = parseFloat((basePrice * (serviceFeePercentage / 100)).toFixed(2));
    const totalPrice = parseFloat((basePrice + serviceFee).toFixed(2));

    return {
      success: true,
      message: 'Price calculated successfully',
      data: {
        basePrice: parseFloat(basePrice.toFixed(2)),
        serviceFee: serviceFee,
        serviceFeePercentage: serviceFeePercentage,
        totalPrice: totalPrice,
        pricingModel: settings.pricingModel,
        breakdown: breakdown
      }
    };
  };

  return Model;
};
