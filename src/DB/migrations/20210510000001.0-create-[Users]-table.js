'use strict';

const { DataTypes } = require('sequelize');

const USER_ROLES = require('../dicts/USER_ROLES');
const USER_GENDERS = require('../dicts/USER_GENDERS');
const USER_LANGS = require('../dicts/USER_LANGS');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Users', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      email: {
        type: DataTypes.STRING, allowNull: false, unique: true,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      phone: {
        type: DataTypes.STRING, allowNull: false, unique: true,
      },
      isPhoneVerified: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      isRestricted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      password: {
        type: DataTypes.STRING, allowNull: false,
      },
      lang: {
        type: DataTypes.STRING, allowNull: true, defaultValue: USER_LANGS[0],
      },
      role: {
        type: DataTypes.ENUM, required: true, values: USER_ROLES,
        defaultValue: USER_ROLES[ 0 ],
      },
      gender: {
        type: DataTypes.ENUM, required: true, values: USER_GENDERS,
        defaultValue: USER_GENDERS[ 0 ],
      },
      image: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'default.male.png',
      },
      firstName: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      lastName: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      country: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      city: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      zip: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      street: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      region: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      birthday: {
        type: DataTypes.DATE, 
        allowNull: true, defaultValue: null      
      },
      timezone: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      },
      lastSeenAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
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
    return queryInterface.dropTable('Users');
  }
};
