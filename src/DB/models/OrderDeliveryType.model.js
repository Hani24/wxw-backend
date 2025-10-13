const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const DELIVERY_TYPES = App.getDictByName('DELIVERY_TYPES');

  // OrderDeliveryTime
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
    type: {
      type: DataTypes.ENUM, required: true, values: DELIVERY_TYPES,
      defaultValue: DELIVERY_TYPES[ 0 ],
    },
  });

  Model.getTypes = function ({asArray=false}={}) {
    return Model._mapDict(DELIVERY_TYPES, {asArray} );
  };

  return Model;

}
