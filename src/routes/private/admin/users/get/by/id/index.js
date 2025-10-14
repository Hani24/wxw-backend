const express = require('express');
const router = express.Router();

// Get specific user by ID across all roles
// GET /private/admin/users/get/by/id?id=<number>

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mAdmin = await req.user;
      const userId = App.getPosNumber(parseInt(req.query.id));

      if (App.isNull(userId) || !App.isPosNumber(userId)) {
        return App.json(res, false, App.t('invalid-user-id', res.lang));
      }

      const mUser = await App.getModel('User').findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
        attributes: [
          'id',
          'email',
          'phone',
          'firstName',
          'lastName',
          'fullName',
          'role',
          'gender',
          'image',
          'lang',
          'birthday',
          'street',
          'zip',
          'cityId',
          'restaurantId',
          'isEmailVerified',
          'isPhoneVerified',
          'isRestricted',
          'isNewUser',
          'lat',
          'lon',
          'createdAt',
          'updatedAt',
          'lastSeenAt',
        ],
        include: [
          {
            required: false,
            model: App.getModel('City'),
            attributes: ['id', 'name', 'stateId'],
            include: [{
              required: false,
              model: App.getModel('State'),
              attributes: ['id', 'name'],
            }]
          },
          {
            required: false,
            model: App.getModel('Restaurant'),
            attributes: ['id', 'name', 'type', 'isVerified', 'isRestricted', 'image'],
          }
        ],
      });

      if (!mUser) {
        return App.json(res, false, App.t('user-not-found', res.lang));
      }

      // Add role-specific detailed data
      let roleSpecificData = null;

      switch (mUser.role) {
        case 'client':
          roleSpecificData = await App.getModel('Client').findOne({
            where: { userId: mUser.id },
            attributes: [
              'id', 'totalOrders', 'lat', 'lon',
              'createdAt', 'updatedAt'
            ],
          });
          break;

        case 'courier':
          roleSpecificData = await App.getModel('Courier').findOne({
            where: { userId: mUser.id },
            attributes: [
              'id', 'totalOrders', 'totalIncome',
              'isVerified', 'verifiedAt', 'isRestricted', 'restrictedAt',
              'lat', 'lon', 'createdAt', 'updatedAt'
            ],
          });
          break;

        case 'restaurant':
          // Restaurant data is already included in the main query
          break;

        case 'employee':
          // Employee might have restaurant association
          if (mUser.restaurantId) {
            roleSpecificData = await App.getModel('Restaurant').findOne({
              where: { id: mUser.restaurantId },
              attributes: ['id', 'name', 'type', 'isVerified'],
            });
          }
          break;
      }

      mUser.dataValues.roleSpecificData = roleSpecificData;

      App.json(res, true, App.t('success', res.lang), { user: mUser });

    } catch(e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return {
    router,
    method: '',
    autoDoc: {
      description: 'Get a specific user by ID with role-specific data',
      params: {
        id: 'User ID (required)',
      }
    }
  };

};
