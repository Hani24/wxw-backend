const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    userId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id'
      },
    },
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    verifiedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRestricted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    restrictedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    lastOnlineAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.getByUserId = async function (userId, onlyValid=false) {

    if( !App.isPosNumber(Math.floor((+userId))) ) return null;
    const roles = App.getModel('User').getRoles();

    const where = {
      userId: Math.floor((+userId)),
    };

    if( onlyValid ){
      role: roles.employee,
      where.isVerified = true;
      // where.verifiedAt = App.getISODate();
      where.isRestricted = false;
      // where.restrictedAt = null;
      where.isDeleted = false;
      // where.deleteddAt = null;
    }

    return await Model.findOne({
      where,
    });
  };

  return Model;

}
