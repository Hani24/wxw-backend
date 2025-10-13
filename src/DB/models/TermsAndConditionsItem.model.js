const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    termsAndConditionsId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'TermsAndConditions',
        key: 'id'
      },
    },
    itemTitle: {
      type: DataTypes.STRING, allowNull: false, defaultValue: ''
    },
    itemText: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  return Model;

}
