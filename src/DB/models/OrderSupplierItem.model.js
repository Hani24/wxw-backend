const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    // https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169148507/U10.04+Rate+the+order
    // In 20 minutes after the delivery, the user should get the phone notification ‘Please, rate your order’.

    orderSupplierId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'OrderSuppliers',
        key: 'id'
      },
    },
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
    menuItemId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'MenuItems',
        key: 'id'
      },
    },
    price: {
      type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
    },
    amount: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0
    },
    totalPrice: {
      type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
    },
    isRatedByClient: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    ratedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    rating: { // 0-5
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 0
    },
  });

  return Model;

}
