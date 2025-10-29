const { Sequelize, DataTypes, Model } = require('sequelize');

// OrderCateringDetails stores catering-specific order information
// Includes: event details, delivery method, split payment schedule
// Similar to OrderOnSitePresenceDetails but with menu items and payment splits

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const CATERING_DELIVERY_METHODS = App.getDictByName('CATERING_DELIVERY_METHODS');

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
      comment: 'Date of the catering event',
    },
    eventStartTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
      comment: 'Start time of the event',
    },
    eventEndTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
      comment: 'End time of the event',
    },
    deliveryMethod: {
      type: DataTypes.ENUM(...CATERING_DELIVERY_METHODS),
      allowNull: false,
      required: true,
      comment: 'Pickup or drop-off',
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Event location address (required if drop-off)',
    },
    deliveryLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    deliveryLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    estimatedTotalPeople: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'Calculated from menu items (sum of feedsPeople * quantity)',
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Special dietary requirements, setup instructions, etc.',
    },
    estimatedBasePrice: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total price of all menu items',
    },
    estimatedServiceFee: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '15% service fee',
    },
    estimatedTotalPrice: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Base price + service fee',
    },

    // Payment Schedule - Split Payments
    firstPaymentAmount: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '50% of total - non-refundable',
    },
    firstPaymentDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      comment: '10 days before event',
    },
    firstPaymentPaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'When first payment was charged',
    },
    firstPaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Stripe payment intent ID for first payment',
    },

    secondPaymentAmount: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Remaining 50% - non-refundable',
    },
    secondPaymentDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      comment: '3 days before event',
    },
    secondPaymentPaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'When second payment was charged',
    },
    secondPaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Stripe payment intent ID for second payment',
    },

    // Restaurant Acceptance
    restaurantAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'When restaurant accepted the catering order',
    },
    restaurantRejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'When restaurant rejected the catering order',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Reason for rejection',
    },
    acceptanceDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: '24 hours from order creation',
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
   * Calculate payment schedule based on event date
   * First payment: 10 days before event (50%) - or immediately if less than 10 days away
   * Second payment: 3 days before event (50%) - or immediately if less than 3 days away
   */
  Model.calculatePaymentSchedule = function(eventDate, totalPrice){
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);

    const daysUntilEvent = Math.floor((event - today) / (1000 * 60 * 60 * 24));

    // First payment: 10 days before event (or today if event is less than 10 days away)
    let firstPaymentDate = new Date(event);
    firstPaymentDate.setDate(firstPaymentDate.getDate() - 10);

    if(daysUntilEvent < 10){
      firstPaymentDate = today;
    }

    // Second payment: 3 days before event (or today if event is less than 3 days away)
    let secondPaymentDate = new Date(event);
    secondPaymentDate.setDate(secondPaymentDate.getDate() - 3);

    if(daysUntilEvent < 3){
      secondPaymentDate = today;
    }

    const firstAmount = (totalPrice * 0.5).toFixed(2);
    const secondAmount = (totalPrice - firstAmount).toFixed(2); // Ensure exact total

    return {
      firstPaymentAmount: parseFloat(firstAmount),
      firstPaymentDueDate: firstPaymentDate.toISOString().split('T')[0], // YYYY-MM-DD
      secondPaymentAmount: parseFloat(secondAmount),
      secondPaymentDueDate: secondPaymentDate.toISOString().split('T')[0], // YYYY-MM-DD
      isFirstPaymentDueNow: daysUntilEvent < 10,
      isSecondPaymentDueNow: daysUntilEvent < 3,
    };
  };

  /**
   * Check if event date meets minimum lead time
   */
  Model.validateLeadTime = function(eventDate, minimumDays = 10){
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);

    const daysUntilEvent = Math.floor((event - today) / (1000 * 60 * 60 * 24));

    if(daysUntilEvent < minimumDays){
      return {
        success: false,
        message: `Catering orders require at least ${minimumDays} days advance notice`,
        data: { daysUntilEvent, minimumDays }
      };
    }

    return {
      success: true,
      message: 'Lead time requirement met',
      data: { daysUntilEvent }
    };
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

  /**
   * Check if first payment is due
   */
  Model.isFirstPaymentDue = function(details){
    if(!details || !details.firstPaymentDueDate || details.firstPaymentPaidAt){
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(details.firstPaymentDueDate);
    dueDate.setHours(0, 0, 0, 0);

    return today >= dueDate;
  };

  /**
   * Check if second payment is due
   */
  Model.isSecondPaymentDue = function(details){
    if(!details || !details.secondPaymentDueDate || details.secondPaymentPaidAt){
      return false;
    }

    // First payment must be completed
    if(!details.firstPaymentPaidAt){
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(details.secondPaymentDueDate);
    dueDate.setHours(0, 0, 0, 0);

    return today >= dueDate;
  };

  /**
   * Model Associations
   */
  Model.associate = function(sequelize) {
    const { Order } = sequelize.models;

    // OrderCateringDetails belongs to Order
    Model.belongsTo(Order, {
      foreignKey: 'orderId',
      as: 'Order'
    });
  };

  return Model;
};
