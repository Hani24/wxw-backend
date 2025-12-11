const { Sequelize, DataTypes, Model } = require('sequelize');

// CateringMenuItem extends MenuItem with catering-specific attributes
// Links regular menu items to catering availability with additional fields:
// - feedsPeople: How many people this item serves
// - minimumQuantity: Minimum order quantity for catering

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    menuItemId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      unique: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'MenuItems',
        key: 'id'
      },
    },
    feedsPeople: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      required: true,
      defaultValue: 1,
      comment: 'Number of people this menu item feeds',
    },
    minimumQuantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: 'Minimum quantity required for catering orders',
    },
    isAvailableForCatering: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this item is available for catering orders',
    },
    cateringPrice: {
      type: DataTypes.DECIMAL(8,2),
      allowNull: true,
      defaultValue: null,
      comment: 'Optional catering-specific price (if different from regular menu price)',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
  });

  /**
   * Get catering menu item by menu item ID
   */
  Model.getByMenuItemId = async function(menuItemId){
    return await Model.findOne({
      where: {
        menuItemId,
        isDeleted: false,
        isAvailableForCatering: true
      }
    });
  };

  /**
   * Get all catering menu items for a restaurant
   */
  Model.getByRestaurantId = async function(restaurantId){
    const MenuItem = App.DB.models.MenuItem;

    return await Model.findAll({
      where: {
        isDeleted: false,
        isAvailableForCatering: true
      },
      include: [{
        model: MenuItem,
        as: 'MenuItem',
        where: {
          restaurantId,
          isAvailable: true,
          isDeleted: false
        },
        required: true
      }],
      order: [
        ['feedsPeople', 'ASC'],
        [MenuItem, 'order', 'ASC']
      ]
    });
  };

  /**
   * Calculate total people served by items
   */
  Model.calculateTotalPeopleServed = function(items){
    if(!Array.isArray(items)){
      return 0;
    }

    return items.reduce((total, item) => {
      const feedsPeople = item.feedsPeople || 0;
      const quantity = item.quantity || 1;
      return total + (feedsPeople * quantity);
    }, 0);
  };

  /**
   * Validate minimum quantity requirement
   */
  Model.validateMinimumQuantity = function(cateringMenuItem, orderedQuantity){
    if(!cateringMenuItem){
      return {
        success: false,
        message: 'Catering menu item not found',
        data: null
      };
    }

    const minQty = cateringMenuItem.minimumQuantity || 1;

    if(orderedQuantity < minQty){
      return {
        success: false,
        message: `Minimum quantity for this item is ${minQty}`,
        data: { minimumQuantity: minQty, orderedQuantity }
      };
    }

    return {
      success: true,
      message: 'Quantity meets minimum requirement',
      data: null
    };
  };

  /**
   * Model Associations
   */
  Model.associate = function(sequelize) {
    const { MenuItem } = sequelize.models;

    // CateringMenuItem belongs to MenuItem
    Model.belongsTo(MenuItem, {
      foreignKey: 'menuItemId',
      as: 'MenuItem'
    });
  };

  return Model;
};
