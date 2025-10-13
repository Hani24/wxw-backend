const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    isEnabled: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true,
    },
    maxDiscountPercent: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: true, defaultValue: 20,
    },
  });

  Model.getSettings = async function () {
    const mModel = await Model.findOne({
      attributes: ['id','isEnabled','maxDiscountPercent'],
      order: [['id','desc']],
    });
    return App.isObject(mModel) && App.isPosNumber(mModel.id)
      ? mModel
      : await Model.create({});
  }

  return Model;

}
