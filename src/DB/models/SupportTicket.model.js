const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const USER_ROLES = App.getDictByName('USER_ROLES');
  const SUPPORT_TICKET_TYPES = App.getDictByName('SUPPORT_TICKET_TYPES');

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
    orderId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Orders',
        key: 'id'
      },
    },
    userType: {
      type: DataTypes.ENUM, required: true, values: USER_ROLES,
      defaultValue: USER_ROLES[ 0 ],
    },
    type: {
      type: DataTypes.ENUM, required: true, values: SUPPORT_TICKET_TYPES,
      defaultValue: SUPPORT_TICKET_TYPES[ 0 ],
    },
    message: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '',
    },
    isRead: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
  });

  Model.getTypes = function ({asArray=false}={}) {
    return Model._mapDict(SUPPORT_TICKET_TYPES, {asArray} );
  };

  return Model;

}