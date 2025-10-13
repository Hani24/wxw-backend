const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    stateId: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'States',
        key: 'id'
      },
    },
    name: {
      type: DataTypes.STRING, allowNull: false, /* unique: true, */ // City name can be the same in multiple States
    },
    isEnabled: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true,
    },
  });

  // Model.getByClientId = async function (clientId) {
  //   if( !App.isPosNumber(Math.floor((+clientId))) ) return null;
  //   clientId = Math.floor((+clientId));
  //   let mCart = await Model.getByFields({ clientId });
  //   if( !App.isObject(mCart) || !App.isPosNumber(mCart.id) ){
  //     mCart = await Model.create({ clientId });
  //   }
  //   return mCart;
  // }

  return Model;

}
