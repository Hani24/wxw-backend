const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    orderId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Orders',
        key: 'id'
      },
    },
    deliveryAddressId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'DeliveryAddresses',
        key: 'id'
      },
    },
  });

  return Model;

}
