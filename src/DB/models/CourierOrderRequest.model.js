const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    courierId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Couriers',
        key: 'id'
      },
    },
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
    isAccepted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    acceptedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRejected: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    rejectedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  return Model;

}
