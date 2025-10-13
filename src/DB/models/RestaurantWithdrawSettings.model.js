const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    isEnabled: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true,
    },
    minAmount: {
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true, defaultValue: 5,
    },
    maxAmount: {
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true, defaultValue: 0, // 0 === +Infinity
    },
  });

  Model.getSettings = async function () {
    const mModel = await Model.findOne({});
    return App.isObject(mModel) && App.isPosNumber(mModel.id)
      ? mModel
      : await Model.create({});
  }

  return Model;

}
