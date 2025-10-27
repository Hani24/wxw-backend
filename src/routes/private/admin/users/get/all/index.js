const express = require('express');
const router = express.Router();

// Get all users across all roles (root, admin, restaurant, employee, courier, client)
// GET /private/admin/users/get/all/?offset=0&limit=15&order=desc&by=firstName&role=client&isGuest=true

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const {offset, limit, order, by} = req.getPagination({ order: 'desc', by: 'firstName' });
      const roles = App.getModel('User').getRoles();

      // Define sortable fields
      const sortable = {
        id: [['id', order]],
        firstName: [['firstName', order]],
        lastName: [['lastName', order]],
        email: [['email', order]],
        phone: [['phone', order]],
        role: [['role', order]],
        createdAt: [['createdAt', order]],
      };

      const sortBy = App.isString(req.query['by']) && sortable.hasOwnProperty(req.query['by'])
        ? req.query['by']
        : 'firstName';

      // Build where clause
      const whereClause = {
        isDeleted: false,
      };

      // Optional: Filter by specific role
      if (App.isString(req.query['role']) && roles.hasOwnProperty(req.query['role'])) {
        whereClause.role = req.query['role'];
      }

      // Optional: Filter by verification status
      if (req.query['isEmailVerified'] !== undefined) {
        whereClause.isEmailVerified = req.query['isEmailVerified'] === 'true';
      }

      if (req.query['isPhoneVerified'] !== undefined) {
        whereClause.isPhoneVerified = req.query['isPhoneVerified'] === 'true';
      }

      // Optional: Filter by restricted status
      if (req.query['isRestricted'] !== undefined) {
        whereClause.isRestricted = req.query['isRestricted'] === 'true';
      }

      // Optional: Filter by guest status
      if (req.query['isGuest'] !== undefined) {
        whereClause.isGuest = req.query['isGuest'] === 'true';
      }

      // Optional: Search by name, email, or phone
      if (App.isString(req.query['search']) && req.query['search'].trim().length > 0) {
        const searchTerm = `%${req.query['search'].trim()}%`;
        whereClause[App.DB.Op.or] = [
          { firstName: { [App.DB.Op.like]: searchTerm } },
          { lastName: { [App.DB.Op.like]: searchTerm } },
          { email: { [App.DB.Op.like]: searchTerm } },
          { phone: { [App.DB.Op.like]: searchTerm } },
        ];
      }

      const mUsers = await App.getModel('User').findAndCountAll({
        where: whereClause,
        distinct: true,
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
          'isGuest',
          'guestToken',
          'guestExpiresAt'
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
            attributes: ['id', 'name', 'type', 'isVerified', 'isRestricted'],
          }
        ],
        order: sortable[sortBy],
        offset: offset,
        limit: limit,
      });

      // Add role-specific data for each user
      for (const user of mUsers.rows) {
        // Add client-specific data
        if (user.role === 'client') {
          const mClient = await App.getModel('Client').findOne({
            where: { userId: user.id },
            attributes: ['id', 'totalOrders', 'lat', 'lon'],
          });
          user.dataValues.clientData = mClient || null;
        }

        // Add courier-specific data
        if (user.role === 'courier') {
          const mCourier = await App.getModel('Courier').findOne({
            where: { userId: user.id },
            attributes: ['id', 'totalOrders', 'totalIncome', 'isVerified', 'lat', 'lon'],
          });
          user.dataValues.courierData = mCourier || null;
        }
      }

      App.json(res, true, App.t('success', res.lang), mUsers);

    } catch(e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return {
    router,
    method: '',
    autoDoc: {
      description: 'Get all users across all roles with optional filtering',
      queryParams: {
        offset: 'Pagination offset (default: 0)',
        limit: 'Number of results (default: 15)',
        order: 'Sort order: asc or desc (default: desc)',
        by: 'Sort by field: id, firstName, lastName, email, phone, role, createdAt (default: firstName)',
        role: 'Filter by role: root, admin, restaurant, employee, courier, client',
        isEmailVerified: 'Filter by email verification: true or false',
        isPhoneVerified: 'Filter by phone verification: true or false',
        isRestricted: 'Filter by restricted status: true or false',
        isGuest: 'Filter by guest status: true or false',
        search: 'Search by firstName, lastName, email, or phone',
      }
    }
  };

};
