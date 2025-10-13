const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const LIMITS = App.getDictByName('LIMITS').MenuCategory;

  const Model = sequelize.define( exportModelWithName, {
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    name: { // upto 50 syms.
      type: DataTypes.STRING, allowNull: false
    },
    description: { // upto 300 syms.
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    order: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.isValidLengthOf = function( type_t, string_t ){
    return 
      App.isString(type_t) && LIMITS.hasOwnProperty(type_t)
      &&
      App.isString(string_t) && string_t.length <= LIMITS[ type_t ];
  }

  Model.getValidLengthOf = function( type_t ){
    return App.isString(type_t) && LIMITS.hasOwnProperty(type_t)
      ? LIMITS[ type_t ]
      : 0;
  }

  return Model;

}
