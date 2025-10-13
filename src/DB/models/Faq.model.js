const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const FAQ_ROLES = App.getDictByName('FAQ_ROLES');

  const Model = sequelize.define( exportModelWithName, {
    role: {
      type: DataTypes.ENUM, required: true, values: FAQ_ROLES,
      defaultValue: FAQ_ROLES[ 0 ],
    },
    q: {
      type: DataTypes.TEXT, allowNull: false, required: true
    },
    a: {
      type: DataTypes.TEXT, allowNull: false, required: true
    },
    isDisabled: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.getRoles = function ({asArray=false}={}) {
    return Model._mapDict(FAQ_ROLES, {asArray} );
  };

  return Model;

}
