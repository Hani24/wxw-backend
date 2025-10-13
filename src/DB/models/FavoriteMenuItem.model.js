const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

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
    // restaurantId: {
    //   type: DataTypes.BIGINT(8).UNSIGNED,
    //   allowNull: false,
    //   required: true,
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    //   references: {
    //     model: 'Restaurants',
    //     key: 'id'
    //   },
    // },
    menuItemId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'MenuItems',
        key: 'id'
      },
    },

  });

  return Model;

}
