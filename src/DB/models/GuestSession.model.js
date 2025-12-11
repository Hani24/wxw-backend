const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async(exportModelWithName, App, params, sequelize) => {

  const Model = sequelize.define(exportModelWithName, {
    guestToken: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      required: true,
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
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'n/a',
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'n/a',
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'n/a',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isConverted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    convertedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  });

  /**
   * Create a new guest session with temporary user and client
   */
  Model.createGuestSession = async function({deviceId = '', ip = 'n/a', country = 'n/a', timezone = 'n/a'} = {}) {
    try {
      const guestToken = App.BCrypt.randomSecureToken(32);
      const expiresAt = App.DT.moment().add(24, 'hours').format(App.getDateFormat());

      // Create temporary guest user without phone number (will be added when they register)
      const tempPassword = App.BCrypt.randomSecureToken(16);

      const roles = App.getModel('User').getRoles();

      const mUser = await App.getModel('User').create({
        phone: null, // Guest users don't have phone initially
        password: await App.BCrypt.hash(tempPassword),
        role: roles.client,
        isGuest: true,
        guestToken: guestToken,
        guestExpiresAt: expiresAt,
        firstName: 'Guest',
        lastName: 'User',
        timezone: timezone,
        email: null, // Guest users don't have email initially
      });

      if (!App.isObject(mUser) || !App.isPosNumber(mUser.id)) {
        return {success: false, message: ['failed-to', 'create', 'guest', 'user'], data: {}};
      }

      // Create client record for guest
      const mClient = await App.getModel('Client').create({
        userId: mUser.id,
        isVerified: false,
      });

      if (!App.isObject(mClient) || !App.isPosNumber(mClient.id)) {
        await mUser.destroy();
        return {success: false, message: ['failed-to', 'create', 'guest', 'client'], data: {}};
      }

      // Create Stripe customer for guest payments
      const stripeCustomerCreate = await App.payments.stripe.customerCreate({
        email: `guest_${mUser.id}@temporary.com`, // Temporary email for Stripe
        name: 'Guest User',
        description: 'Guest checkout user',
        metadata: {
          userId: mUser.id,
          clientId: mClient.id,
          isGuest: true,
        }
      });

      if (stripeCustomerCreate.success) {
        await mClient.update({ customerId: stripeCustomerCreate.data.id });
        console.log(` #GuestSession: Stripe customer created for guest: ${stripeCustomerCreate.data.id}`);
      } else {
        console.error(` #GuestSession: Failed to create Stripe customer: ${stripeCustomerCreate.message}`);
        // Don't fail the entire flow - guest can still browse
      }

      // Create guest session
      const mGuestSession = await Model.create({
        guestToken,
        userId: mUser.id,
        clientId: mClient.id,
        deviceId,
        ip,
        country,
        timezone,
        expiresAt,
      });

      if (!App.isObject(mGuestSession) || !App.isPosNumber(mGuestSession.id)) {
        await mClient.destroy();
        await mUser.destroy();
        return {success: false, message: ['failed-to', 'create', 'guest', 'session'], data: {}};
      }

      // Create regular Session for tracking and analytics
      const sessionRes = await App.getModel('Session').getOrCreate({
        userId: mUser.id,
        country: country,
        ip: ip,
        isDeleted: false,
      });

      let sessionId = null;
      let sessionToken = null;

      if (sessionRes.success && App.isObject(sessionRes.data)) {
        sessionId = sessionRes.data.id;
        sessionToken = sessionRes.data.token;
        console.log(` #GuestSession: Regular session created for guest tracking: ${sessionId}`);
      } else {
        console.warn(` #GuestSession: Failed to create regular session for guest: ${sessionRes.message}`);
        // Don't fail - session is optional for guests
      }

      // Generate JWT token for guest (same format as regular users)
      const jwtToken = await App.JWT.sign({
        userId: mUser.id,
        sessionId: sessionId,
        token: sessionToken,
        clientId: mClient.id,
        role: roles.client,
        isGuest: true,
        guestToken: guestToken, // Keep reference to guest token for lookups
      });

      return {
        success: true,
        message: ['success'],
        data: {
          token: jwtToken, // JWT token (replaces plain guestToken)
          guestToken: guestToken, // Keep for backward compatibility and lookups
          expiresAt,
          userId: mUser.id,
          clientId: mClient.id,
        }
      };

    } catch (e) {
      console.error(` #GuestSession.createGuestSession: ${e.message}`);
      return {success: false, message: e.message, data: {}};
    }
  };

  /**
   * Get guest session by token with user and client data
   */
  Model.getByToken = async function(guestToken) {
    if (!App.isString(guestToken) || !guestToken.length) {
      return null;
    }

    return await Model.findOne({
      where: {
        guestToken,
        isDeleted: false,
        expiresAt: {
          [App.DB.Op.gt]: App.getISODate(),
        }
      },
      include: [
        {
          model: App.getModel('User'),
          as: 'User',
          attributes: ['id', 'role', 'isGuest', 'firstName', 'lastName', 'phone', 'email', 'timezone', 'lang'],
        },
        {
          model: App.getModel('Client'),
          as: 'Client',
          attributes: ['id', 'lat', 'lon', 'isVerified', 'isRestricted', 'isDeleted'],
        }
      ]
    });
  };

  /**
   * Convert guest user to regular registered user
   */
  Model.convertToRegularUser = async function(guestToken, userData) {
    try {
      const mGuestSession = await Model.getByToken(guestToken);

      if (!App.isObject(mGuestSession) || !App.isPosNumber(mGuestSession.id)) {
        return {success: false, message: ['guest', 'session', 'not-found'], data: {}};
      }

      const {phone, email, password, firstName, lastName} = userData;

      // Validate required fields
      if (!App.isString(phone) || !phone.length) {
        return {success: false, message: ['phone', 'is-required'], data: {}};
      }

      if (!App.isString(password) || password.length < 6) {
        return {success: false, message: ['password', 'must-be-at-least', '6', 'characters'], data: {}};
      }

      // Check if phone already exists (excluding current guest user)
      const existingUser = await App.getModel('User').findOne({
        where: {
          phone,
          id: {
            [App.DB.Op.ne]: mGuestSession.userId
          }
        }
      });

      if (App.isObject(existingUser)) {
        return {success: false, message: ['phone', 'already', 'registered'], data: {}};
      }

      // Check if email already exists (if provided)
      if (App.isString(email) && email.length) {
        const existingEmailUser = await App.getModel('User').findOne({
          where: {
            email,
            id: {
              [App.DB.Op.ne]: mGuestSession.userId
            }
          }
        });

        if (App.isObject(existingEmailUser)) {
          return {success: false, message: ['email', 'already', 'registered'], data: {}};
        }
      }

      const mUser = await App.getModel('User').findOne({where: {id: mGuestSession.userId}});

      if (!App.isObject(mUser)) {
        return {success: false, message: ['user', 'not-found'], data: {}};
      }

      // Update user to regular account
      await mUser.update({
        phone,
        email: email || null,
        password: await App.BCrypt.hash(password),
        firstName: firstName || 'Guest',
        lastName: lastName || 'User',
        isGuest: false,
        guestToken: null,
        guestExpiresAt: null,
      });

      // Update client to verified
      const mClient = await App.getModel('Client').findOne({where: {id: mGuestSession.clientId}});
      if (App.isObject(mClient)) {
        await mClient.update({
          isVerified: true,
        });
      }

      // Mark guest session as converted
      await mGuestSession.update({
        isConverted: true,
        convertedAt: App.getISODate(),
      });

      // Create regular session token
      const sessionRes = await App.getModel('Session').getOrCreate({
        userId: mUser.id,
        country: mGuestSession.country || 'n/a',
        timezone: mUser.timezone || 'n/a',
        ip: mGuestSession.ip || 'n/a',
        deviceId: mGuestSession.deviceId || '',
      });

      if (!sessionRes.success) {
        return {success: false, message: sessionRes.message, data: {}};
      }

      return {
        success: true,
        message: ['success'],
        data: {
          token: sessionRes.data.token,
          user: await App.getModel('User').getCommonDataFromObject(mUser),
          client: await App.getModel('Client').getCommonDataFromObject(mClient),
        }
      };

    } catch (e) {
      console.error(` #GuestSession.convertToRegularUser: ${e.message}`);
      return {success: false, message: e.message, data: {}};
    }
  };

  /**
   * Check if guest session is still valid
   */
  Model.isValid = async function(guestToken) {
    const mGuestSession = await Model.getByToken(guestToken);
    return App.isObject(mGuestSession) && App.isPosNumber(mGuestSession.id);
  };

  /**
   * Extend guest session expiration
   */
  Model.extendExpiration = async function(guestToken, hours = 24) {
    const mGuestSession = await Model.getByToken(guestToken);

    if (!App.isObject(mGuestSession)) {
      return {success: false, message: ['guest', 'session', 'not-found'], data: {}};
    }

    const newExpiresAt = App.DT.moment().add(hours, 'hours').format(App.getDateFormat());

    await mGuestSession.update({
      expiresAt: newExpiresAt,
    });

    // Update user expiration as well
    await App.getModel('User').update(
      {guestExpiresAt: newExpiresAt},
      {where: {id: mGuestSession.userId}}
    );

    return {
      success: true,
      message: ['success'],
      data: {
        expiresAt: newExpiresAt,
      }
    };
  };

  /**
   * Model Associations
   */
  Model.associate = function(sequelize) {
    const { User, Client } = sequelize.models;

    // GuestSession belongs to User
    Model.belongsTo(User, {
      foreignKey: 'userId',
      as: 'User'
    });

    // GuestSession belongs to Client
    Model.belongsTo(Client, {
      foreignKey: 'clientId',
      as: 'Client'
    });
  };

  return Model;

};
