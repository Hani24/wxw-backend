const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const PAYMENT_TYPES = App.getDictByName('PAYMENT_TYPES');

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
    paymentCardId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'PaymentCards',
        key: 'id'
      },
    },
    type: {
      type: Sequelize.ENUM, required: true, values: PAYMENT_TYPES,
      defaultValue: PAYMENT_TYPES[ 0 ],
    },
  });

  Model.getTypes = function ({asArray=false}={}) {
    const types = [ ...PAYMENT_TYPES ];
    types.splice(0, 1);
    return Model._mapDict(types, {asArray} );
  };

  Model.isValidType = function (type) {
    return Model.getTypes().hasOwnProperty( type );
  };

  return Model;

}
