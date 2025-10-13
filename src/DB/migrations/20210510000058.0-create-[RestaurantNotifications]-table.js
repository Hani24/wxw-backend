'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return Promise.all([
      queryInterface.createTable('RestaurantNotifications', {
        id: {
          type: DataTypes.BIGINT(8).UNSIGNED,
          allowNull: false, autoIncrement: true, primaryKey: true,
        },
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
        title: {
          type: DataTypes.STRING, allowNull: false, defaultValue: '',
        },
        message: {
          type: DataTypes.TEXT, allowNull: false, defaultValue: '',
        },
        image: {
          type: DataTypes.STRING, allowNull: true, defaultValue: 'notifications.default.png',
          // get(){
          //   return App.S3.getUrlByName( this.getDataValue('image') );
          // },
          // set(img){
          //   // this.setDataValue('image', img);
          // },
        },
        data: {
          type: DataTypes.TEXT, allowNull: false, defaultValue: '',      
        },
        isRead: {
          type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
        },
        readAt: {
          type: DataTypes.DATE, allowNull: true, defaultValue: null,
        },

        createdAt: {
          type: DataTypes.DATE, 
          allowNull: false, defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE, 
          allowNull: false, defaultValue: DataTypes.NOW
        },
      }),
    ]);

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RestaurantNotifications');
  }
};
