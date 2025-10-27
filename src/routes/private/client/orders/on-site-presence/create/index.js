const express = require('express');
const router = express.Router();

// {
//   "restaurantId": "required: <number>: Ref. Restaurant.id",
//   "eventDate": "required: <string>: YYYY-MM-DD format",
//   "numberOfPeople": "required: <number>: Number of people attending",
//   "numberOfHours": "required: <number>: Hours of service required",
//   "specialRequests": "optional: <string>: Any special requirements",
//   "eventStartTime": "optional: <string>: HH:MM format",
//   "eventEndTime": "optional: <string>: HH:MM format"
// }

// /private/client/orders/on-site-presence/create

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      // Validate required fields
      const restaurantId = req.getCommonDataInt('restaurantId', null);
      const eventDate = req.getCommonDataString('eventDate', null);
      const numberOfPeople = req.getCommonDataInt('numberOfPeople', null);
      const numberOfHours = req.getCommonDataInt('numberOfHours', null);
      const specialRequests = req.getCommonDataString('specialRequests', '').substr(0, 2000);
      const eventStartTime = req.getCommonDataString('eventStartTime', null);
      const eventEndTime = req.getCommonDataString('eventEndTime', null);

      if(App.isNull(restaurantId))
        return App.json(res, 417, App.t(['Restaurant ID is required'], req.lang));

      if(App.isNull(eventDate))
        return App.json(res, 417, App.t(['Event date is required'], req.lang));

      if(App.isNull(numberOfPeople) || numberOfPeople <= 0)
        return App.json(res, 417, App.t(['Number of people is required and must be greater than 0'], req.lang));

      if(App.isNull(numberOfHours) || numberOfHours <= 0)
        return App.json(res, 417, App.t(['Number of hours is required and must be greater than 0'], req.lang));

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if(!dateRegex.test(eventDate))
        return App.json(res, 417, App.t(['Invalid date format. Use YYYY-MM-DD'], req.lang));

      // Check if date is in the future
      const eventDateTime = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if(eventDateTime < today)
        return App.json(res, 417, App.t(['Event date must be in the future'], req.lang));

      // Check if restaurant exists
      const mRestaurant = await App.getModel('Restaurant').findByPk(restaurantId);
      if(!App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id))
        return App.json(res, 404, App.t(['Restaurant not found'], req.lang));

      // Check if restaurant supports on-site presence
      const isSupported = await App.getModel('RestaurantOrderTypeSettings').isOrderTypeEnabled(
        restaurantId,
        'on-site-presence'
      );

      if(!isSupported)
        return App.json(res, 417, App.t(['Restaurant does not support on-site presence orders'], req.lang));

      // Check if date is available
      const isDateAvailable = await App.getModel('RestaurantUnavailableDates').isDateAvailable(
        restaurantId,
        eventDate
      );

      if(!isDateAvailable)
        return App.json(res, 417, App.t(['Selected date is not available for this restaurant'], req.lang));

      // Check for existing unaccepted on-site presence orders for the same restaurant
      const statuses = App.getModel('Order').getStatuses();
      const orderTypes = App.getModel('Order').getOrderTypes();

      // Find existing on-site presence orders that are not yet accepted
      const existingUnacceptedOrder = await App.getModel('Order').findOne({
        where: {
          clientId: mClient.id,
          orderType: orderTypes['on-site-presence'],
          status: {
            [App.DB.Op.or]: [
              statuses['created'],
              statuses['processing'],
            ]
          },
        },
        include: [
          {
            model: App.getModel('OrderSupplier'),
            where: {
              restaurantId: restaurantId,
              isAcceptedByRestaurant: false,  // Not yet accepted
            },
            attributes: ['restaurantId', 'isAcceptedByRestaurant'],
          },
          {
            model: App.getModel('OrderOnSitePresenceDetails'),
            where: {
              restaurantAcceptedAt: null,  // Restaurant hasn't accepted yet
            },
            attributes: ['id', 'restaurantAcceptedAt'],
            required: false,
          }
        ]
      });

      if(existingUnacceptedOrder) {
        return App.json(res, 417, App.t([
          'You already have a pending on-site presence order for this restaurant that has not been accepted yet. Please wait for the restaurant to respond before placing a new order.'
        ], req.lang));
      }

      // Calculate price estimate
      const priceResult = await App.getModel('RestaurantOrderTypeSettings').calculateOnSitePresencePrice(
        restaurantId,
        {
          numberOfPeople,
          numberOfHours,
        }
      );

      if(!priceResult.success)
        return App.json(res, 417, App.t([priceResult.message], req.lang));

      const estimatedBasePrice = priceResult.data.basePrice;
      const estimatedServiceFee = priceResult.data.serviceFee;
      const estimatedTotalPrice = priceResult.data.totalPrice;

      // Start transaction
      const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());

      try {

        // Create the order with orderType = 'on-site-presence'
        const orderTypes = App.getModel('Order').getOrderTypes();
        let mOrder = await App.getModel('Order').create({
          clientId: mClient.id,
          orderType: orderTypes['on-site-presence'],
          status: statuses['created'],
          totalPrice: 0,
          deliveryPrice: 0,
          finalPrice: estimatedTotalPrice,
          totalItems: 0,
          discountAmount: 0,
          discountCode: '',
          discountType: '',
          clientDescription: specialRequests,
        }, { transaction: tx });

        if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to create order'], req.lang));
        }

        // Calculate acceptance deadline (24 hours from now)
        const acceptanceDeadline = App.getModel('OrderOnSitePresenceDetails').calculate24HourDeadline();

        // Create on-site presence details
        const mOnSiteDetails = await App.getModel('OrderOnSitePresenceDetails').create({
          orderId: mOrder.id,
          eventDate,
          eventStartTime,
          eventEndTime,
          numberOfPeople,
          numberOfHours,
          specialRequests,
          estimatedBasePrice,
          estimatedServiceFee,
          estimatedTotalPrice,
          acceptanceDeadline,
        }, { transaction: tx });

        if(!App.isObject(mOnSiteDetails) || !App.isPosNumber(mOnSiteDetails.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to create order details'], req.lang));
        }

        // Create OrderSupplier record (for consistency with existing order structure)
        const mOrderSupplier = await App.getModel('OrderSupplier').create({
          orderId: mOrder.id,
          restaurantId: restaurantId,
          totalPrice: estimatedBasePrice,
          totalItems: 0,
          isTakenByCourier: false,
          isCanceledByRestaurant: false,
          isAcceptedByRestaurant: false,
          isOrderReady: false,
        }, { transaction: tx });

        if(!App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to create order supplier record'], req.lang));
        }

        // Update order checksum
        mOrder = await mOrder.update({checksum: true}, {transaction: tx});

        // Update OrderSupplier checksum
        await mOrderSupplier.update({checksum: true}, {transaction: tx});

        // Get default payment settings
        const mClientPaymentSettings = await App.getModel('ClientPaymentSettings').getByClientId(mClient.id);
        const paymentTypes = App.getModel('OrderPaymentType').getTypes();

        if(App.isObject(mClientPaymentSettings) && App.isPosNumber(mClientPaymentSettings.id)) {

          if(App.getModel('OrderPaymentType').isValidType(mClientPaymentSettings.type)) {

            let paymentCardId = null;

            if(mClientPaymentSettings.type === paymentTypes.Card) {
              if(App.isNull(mClientPaymentSettings.paymentCardId)) {
                await tx.rollback();
                return App.json(res, 417, App.t(['Payment card is required'], req.lang));
              }

              const mPaymentCard = await App.getModel('PaymentCard').getByFields({
                clientId: mClient.id,
                id: mClientPaymentSettings.paymentCardId,
              });

              if(!App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id)) {
                await tx.rollback();
                return App.json(res, 404, App.t(['Payment card not found'], req.lang));
              }

              paymentCardId = mPaymentCard.id;
            }

            // Create order payment type
            const mOrderPaymentType = await App.getModel('OrderPaymentType').create({
              orderId: mOrder.id,
              type: mClientPaymentSettings.type,
              paymentCardId: paymentCardId,
            }, { transaction: tx });

            if(!App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id)) {
              await tx.rollback();
              return App.json(res, false, App.t(['Failed to create order payment type'], req.lang));
            }
          }
        }

        // Update order checksum before commit
        mOrder = await mOrder.update({ checksum: true }, { transaction: tx });

        if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to finalize order'], req.lang));
        }

        await tx.commit();

        // Return response with order details (payment intent will be created in order/confirm)
        await App.json(res, true, App.t(['On-site presence order created successfully'], req.lang), {
          id: mOrder.id,
          status: mOrder.status,
          orderType: 'on-site-presence',
          order: mOrder,
        });

        // Update client statistics
        await mClient.update({
          totalOrders: (mClient.totalOrders + 1),
        });

      } catch(e) {
        console.error(e);
        await tx.rollback();
        return App.json(res, false, App.t(['Failed to create order'], req.lang));
      }

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
