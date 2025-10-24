const express = require('express');
const router = express.Router();

// POST /public/guest/checkout/complete
// Body: {
//   guestToken: "xxx",
//   orderId: 123,
//   guestInfo: {
//     firstName: "John",
//     lastName: "Doe",
//     phone: "+1234567890",
//     email: "john@example.com" (optional),
//     address: {
//       label: "Home",
//       street: "123 Main St",
//       apartment: "Apt 4B" (optional),
//       city: "New York",
//       stateId: 1,
//       zip: "10001",
//       lat: 40.7128,
//       lon: -74.0060,
//       description: "Ring doorbell" (optional)
//     }
//   },
//   createAccount: false, // optional: convert to regular user
//   password: "xxx" // required if createAccount is true
// }

module.exports = function(App, RPath) {
  router.use('', async (req, res) => {
    try {
      const data = req.getPost();
      const guestToken = req.getCommonDataString('guestToken', '');
      const orderId = req.getCommonDataInt('orderId', null);
      const guestInfo = data.guestInfo || {};
      const createAccount = App.getBoolFromValue(data.createAccount);
      const password = req.getCommonDataString('password', '');

      // Validate guest token
      if (!guestToken || !guestToken.length) {
        return App.json(res, 417, App.t(['guest-token', 'is-required'], req.lang));
      }

      // Validate order ID
      if (!App.isPosNumber(orderId)) {
        return App.json(res, 417, App.t(['order-id', 'is-required'], req.lang));
      }

      // Validate guest info (only firstName and lastName are required)
      if (!App.isObject(guestInfo) || !guestInfo.firstName || !guestInfo.lastName) {
        return App.json(res, 417, App.t(['guest', 'info', 'is-incomplete'], req.lang));
      }

      // Validate address
      if (!App.isObject(guestInfo.address) || !guestInfo.address.street || !guestInfo.address.city || !guestInfo.address.stateId) {
        return App.json(res, 417, App.t(['delivery', 'address', 'is-incomplete'], req.lang));
      }

      // Validate password if creating account
      if (createAccount && (!password || password.length < 6)) {
        return App.json(res, 417, App.t(['password', 'must-be-at-least', '6', 'characters'], req.lang));
      }

      // Get guest session
      const mGuestSession = await App.getModel('GuestSession').getByToken(guestToken);

      if (!App.isObject(mGuestSession) || !App.isPosNumber(mGuestSession.id)) {
        return App.json(res, 404, App.t(['guest', 'session', 'not-found', 'or', 'expired'], req.lang));
      }

      // Verify order belongs to guest
      const mOrder = await App.getModel('Order').findOne({
        where: {
          id: orderId,
          clientId: mGuestSession.clientId,
        }
      });

      if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
        return App.json(res, 404, App.t(['order', 'not-found', 'or', 'does-not-belong-to-guest'], req.lang));
      }

      const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());

      try {
        // Update user info
        const mUser = await App.getModel('User').findOne({where: {id: mGuestSession.userId}});

        if (!App.isObject(mUser)) {
          await tx.rollback();
          return App.json(res, 404, App.t(['user', 'not-found'], req.lang));
        }

        // Prepare user update data
        const userUpdateData = {
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
        };

        // Validate and add phone if provided
        if (guestInfo.phone && App.isString(guestInfo.phone) && guestInfo.phone.trim().length > 0) {
          const cleanedPhone = App.tools.cleanPhone(guestInfo.phone);

          if (!App.tools.isValidPhone(cleanedPhone)) {
            await tx.rollback();
            return App.json(res, 417, App.t(['phone', 'number', 'is-not', 'valid'], req.lang));
          }

          // Check if phone already exists (excluding current guest user)
          const existingPhoneUser = await App.getModel('User').findOne({
            where: {
              phone: cleanedPhone,
              id: {
                [App.DB.Op.ne]: mGuestSession.userId
              }
            }
          });

          if (App.isObject(existingPhoneUser)) {
            await tx.rollback();
            return App.json(res, 417, App.t(['phone', 'number', 'already', 'registered'], req.lang));
          }

          userUpdateData.phone = cleanedPhone;
        }

        // Validate and add email if provided
        if (guestInfo.email && App.isString(guestInfo.email) && guestInfo.email.trim().length > 0) {
          const cleanedEmail = App.tools.normalizeEmail(guestInfo.email);

          if (!App.tools.isValidEmail(cleanedEmail)) {
            await tx.rollback();
            return App.json(res, 417, App.t(['email', 'is-not', 'valid'], req.lang));
          }

          // Check if email already exists for NON-GUEST users only
          // Allow multiple guest users to use the same email
          const existingEmailUser = await App.getModel('User').findOne({
            where: {
              email: cleanedEmail,
              isGuest: false,  // Only check non-guest users
              id: {
                [App.DB.Op.ne]: mGuestSession.userId
              }
            }
          });

          if (App.isObject(existingEmailUser)) {
            await tx.rollback();
            return App.json(res, 417, App.t(['email', 'already', 'registered', 'please', 'login', 'or', 'use', 'different', 'email'], req.lang));
          }

          userUpdateData.email = cleanedEmail;
        }

        await mUser.update(userUpdateData, {transaction: tx});

        // Check if delivery address already exists for this order
        const existingOrderAddress = await App.getModel('OrderDeliveryAddress').findOne({
          where: {orderId: mOrder.id}
        });

        let mDeliveryAddress;

        if (existingOrderAddress) {
          // Update existing delivery address
          mDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
            where: {id: existingOrderAddress.deliveryAddressId}
          });

          if (App.isObject(mDeliveryAddress)) {
            await mDeliveryAddress.update({
              label: guestInfo.address.label || 'Delivery Address',
              street: guestInfo.address.street,
              apartment: guestInfo.address.apartment || '',
              city: guestInfo.address.city,
              stateId: guestInfo.address.stateId,
              zip: guestInfo.address.zip || '',
              lat: guestInfo.address.lat || 0,
              lon: guestInfo.address.lon || 0,
              description: guestInfo.address.description || '',
            }, {transaction: tx});
          }
        } else {
          // Create new delivery address
          mDeliveryAddress = await App.getModel('DeliveryAddress').create({
            clientId: mGuestSession.clientId,
            label: guestInfo.address.label || 'Delivery Address',
            street: guestInfo.address.street,
            apartment: guestInfo.address.apartment || '',
            city: guestInfo.address.city,
            stateId: guestInfo.address.stateId,
            zip: guestInfo.address.zip || '',
            lat: guestInfo.address.lat || 0,
            lon: guestInfo.address.lon || 0,
            description: guestInfo.address.description || '',
            isDefault: true,
          }, {transaction: tx});

          if (!App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id)) {
            await tx.rollback();
            return App.json(res, 417, App.t(['failed-to', 'create', 'delivery-address'], req.lang));
          }

          // Link delivery address to order
          await App.getModel('OrderDeliveryAddress').create({
            orderId: mOrder.id,
            deliveryAddressId: mDeliveryAddress.id,
          }, {transaction: tx});
        }

        // Recalculate delivery price with real address
        const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();

        if (App.isObject(mDeliveryPriceSettings) && App.isPosNumber(mDeliveryPriceSettings.id)) {
          // Get restaurants from order
          const mRestaurants = await App.getModel('Restaurant').findAll({
            include: [{
              model: App.getModel('OrderSupplier'),
              where: {orderId: mOrder.id},
              required: true,
            }]
          });

          if (mRestaurants && mRestaurants.length > 0) {
            const calcOptimalDistanceRes = await App.getModel('DeliveryPriceSettings')
              .calcOptimalDistance(mDeliveryAddress, mRestaurants, mDeliveryPriceSettings, {
                useGoogle: true,
              });

            if (calcOptimalDistanceRes.success) {
              // Update order with new delivery price
              const deliveryDistanceValue = calcOptimalDistanceRes.data.distance.mile || 0;
              const deliveryPrice = mOrder.isFreeDelivery ? 0 : calcOptimalDistanceRes.data.deliveryPrice;
              const finalPrice = App.getPosNumber((mOrder.totalPrice + deliveryPrice) - mOrder.discountAmount, {toFixed: 2});

              await mOrder.update({
                deliveryPrice: deliveryPrice,
                deliveryDistanceValue: deliveryDistanceValue,
                deliveryDistanceType: 'mile',
                finalPrice: finalPrice,
              }, {transaction: tx});
            }
          }
        }

        // If user wants to create account
        let conversionData = null;
        if (createAccount && password && password.length >= 6) {
          const convertRes = await App.getModel('GuestSession').convertToRegularUser(
            guestToken,
            {
              phone: guestInfo.phone,
              email: guestInfo.email || null,
              password: password,
              firstName: guestInfo.firstName,
              lastName: guestInfo.lastName,
            }
          );

          if (!convertRes.success) {
            await tx.rollback();
            return App.json(res, 417, App.t(convertRes.message, req.lang));
          }

          conversionData = {
            accountCreated: true,
            token: convertRes.data.token,
            user: convertRes.data.user,
          };
        }

        await tx.commit();

        // Fetch updated order
        const updatedOrder = await App.getModel('Order').getFullOrderWhere({id: mOrder.id});

        const responseData = {
          order: updatedOrder,
          accountCreated: !!conversionData,
        };

        if (conversionData) {
          responseData.token = conversionData.token;
          responseData.user = conversionData.user;
        }

        App.json(res, true, App.t('success', res.lang), responseData);

      } catch (e) {
        await tx.rollback();
        throw e;
      }

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }
  });

  return { router, method: 'post', autoDoc: {} };
};
