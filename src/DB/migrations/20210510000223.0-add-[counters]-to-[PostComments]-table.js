'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('PostComments', 'totalLikes', {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        after: 'comment'
      }),
      queryInterface.addColumn('PostComments', 'totalReplies', {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        after: 'totalLikes'
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('PostComments', 'totalLikes'),
      queryInterface.removeColumn('PostComments', 'totalReplies'),
    ]);
  }
};
