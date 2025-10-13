const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const PAYMENT_TYPES = App.getDictByName('PAYMENT_TYPES');

  const Model = sequelize.define( exportModelWithName, {
    clientId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Clients',
        key: 'id'
      },
    },
    type: {
      type: Sequelize.ENUM, required: true, values: PAYMENT_TYPES,
      defaultValue: PAYMENT_TYPES[ 0 ],
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
  });

  Model.getPaymentTypes = function ({asArray=false}={}) {
    return Model._mapDict(PAYMENT_TYPES, {asArray} );
  }

  Model.getByClientId = async function (clientId) {
    clientId = Math.floor(+clientId);
    if( !App.isPosNumber(clientId) ) return null;
    const mClientPaymentSetting = await Model.findOne({
      where: { clientId },
    });

    return App.isObject(mClientPaymentSetting)
      ? mClientPaymentSetting
      : await Model.create({ clientId });

  }

  return Model;

}
