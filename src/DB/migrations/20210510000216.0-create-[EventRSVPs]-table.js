'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const RSVP_STATUSES = ['interested', 'going', 'not-going'];

    await queryInterface.createTable('EventRSVPs', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },
      postId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'RestaurantPosts',
          key: 'id'
        },
      },
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
      status: {
        type: Sequelize.ENUM,
        values: RSVP_STATUSES,
        defaultValue: RSVP_STATUSES[0],
        allowNull: false,
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

    // Add indexes for performance
    await queryInterface.addIndex('EventRSVPs', ['postId']);
    await queryInterface.addIndex('EventRSVPs', ['clientId']);
    await queryInterface.addIndex('EventRSVPs', ['status']);
    // Unique constraint - one RSVP per client per event
    await queryInterface.addIndex('EventRSVPs', ['postId', 'clientId'], { unique: true });

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('EventRSVPs');
  }
};
