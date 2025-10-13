'use strict';

const { DataTypes } = require('sequelize');

const UPLOAD_TYPES = require('../dicts/UPLOAD_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Uploads', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

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
      fileType: {
        type: DataTypes.ENUM, required: true, values: UPLOAD_TYPES,
        defaultValue: UPLOAD_TYPES[ 0 ],
      },
      fileName: {
        type: DataTypes.STRING, allowNull: false
      },
      fileSize: {
        type: DataTypes.INTEGER(11).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      fileMimeType: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      },

      createdAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
    });

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Uploads');
  }
};
