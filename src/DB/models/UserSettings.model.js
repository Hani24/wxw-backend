const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    userId: {
      type: Sequelize.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id'
      },
    },
    allowSendNotification: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true
    },
  });

  Model.getByUserId = async function (userId) {

    const mUserSettings = await App.getModel('UserSettings').findOne({
      where: { userId: (+userId) },
    });

    return ( App.isObject(mUserSettings) && App.isPosNumber(mUserSettings.id) )
      ? mUserSettings
      : await App.getModel('UserSettings').create({
        userId: (+userId)
      });

  };

  return Model;

}
