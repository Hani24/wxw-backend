const express = require('express');
const router = express.Router();

// /private/client/orders/get/all

module.exports = function(App, RPath) {

  router.use('', async (req, res) => {

    try {

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const { offset, limit, order, by } = req.getPagination({});
      const orderBy = App.getModel('Order').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();

      // Allow filtering by status (optional)
      const statusFilter = req.getCommonDataString('status', null);
      let statusCondition = {
        [App.DB.Op.or]: [
          statuses['created'], // Include created orders (default status for new orders)
          statuses['processing'],
          statuses['delivered'],
          statuses['refunded'],
          statuses['canceled'], // Include canceled orders
        ]
      };

      // If specific status requested, filter by that
      if(statusFilter && statuses[statusFilter]) {
        statusCondition = statuses[statusFilter];
      }

      const mOrders = await App.getModel('Order').findAndCountAll({
        where: {
          clientId: mClient.id,
          status: statusCondition,
        },
        distinct: true,
        attributes: [
          'id', 'status', 'orderType', 'totalItems', 'totalPrice', 'finalPrice', 'deliveryPrice',
          'discountAmount', 'discountCode',
          'isPaid', 'isRefunded',
          'isOrderRatedByClient', 'isPaymentRequested',
          'isCourierRatedByClient', 'courierRating',
          'isClientActionRequired', 'isClientActionExecuted',
          'isDeliveredByCourier', 'isCanceledByClient',
          'allSuppliersHaveConfirmedAt', 'expectedDeliveryTime',
          ['createdAt', 'orderTime'], 'updatedAt',
          'isValidChecksum', 'checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        include: [
          {
            model: App.getModel('OrderDeliveryTime'),
            required: false, // Optional - not needed for on-site presence orders
            attributes: [
              'id', 'deliveryDay', 'deliveryHour', 'deliveryTimeValue', 'deliveryTimeType'
            ],
          },
          {
            model: App.getModel('OrderDeliveryAddress'),
            required: false, // Optional - not needed for on-site presence orders
            attributes: ['id'],
            include: [{
              model: App.getModel('DeliveryAddress'),
              required: false,
              attributes: ['id', 'stateId', 'city', 'street', 'apartment'],
              include: [{
                model: App.getModel('State'),
                attributes: ['id', 'name', 'code'],
              }]
            }]
          },
          {
            model: App.getModel('OrderPaymentType'),
            required: false, // Optional - may not exist for on-site presence orders yet
            attributes: ['id', 'type', 'paymentCardId'], // Include 'paymentCardId' here
            include: [{
              model: App.getModel('PaymentCard'),
              required: false,
              attributes: ['id', 'encCardNumber'],
            }]
          },
          {
            model: App.getModel('OrderSupplier'),
            required: false,
            attributes: [
              'id', 'isOrderReady', 'orderReadyAt', 'totalPrice', 'totalItems',
              'isCanceledByRestaurant', 'canceledByRestaurantAt', 'cancellationReason',
              'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
              'isOrderDelayed', 'orderDelayedFor', 'orderDelayedAt'
            ],
            include: [{
              model: App.getModel('Restaurant'),
              attributes: ['id', 'name']
            }]
          },
          {
            required: false, // Optional - only for on-site presence orders
            model: App.getModel('OrderOnSitePresenceDetails'),
            attributes: [
              'id', 'eventDate', 'eventStartTime', 'eventEndTime',
              'numberOfPeople', 'numberOfHours', 'specialRequests',
              'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
              'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason',
              'acceptanceDeadline',
            ],
          },
          {
            required: false, // Optional - only for catering orders
            model: App.getModel('OrderCateringDetails'),
            attributes: [
              'id', 'eventDate', 'eventStartTime', 'eventEndTime',
              'deliveryMethod', 'deliveryAddress', 'deliveryLatitude', 'deliveryLongitude',
              'estimatedTotalPeople', 'specialRequests',
              'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
              'firstPaymentAmount', 'firstPaymentDueDate', 'firstPaymentPaidAt',
              'secondPaymentAmount', 'secondPaymentDueDate', 'secondPaymentPaidAt',
              'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason',
              'acceptanceDeadline',
            ],
          }
        ],
        order: [[orderBy, order]],
        offset: offset,
        limit: limit,
      });

      for (const mOrder of mOrders.rows) {
        // Get human-readable delivery time (only for order-now orders)
        if (mOrder.OrderDeliveryTime) {
          mOrder.dataValues.deliveryTime = App.getModel('OrderDeliveryTime')
            .getHumanTimeFromObject(mOrder.OrderDeliveryTime);
        } else {
          mOrder.dataValues.deliveryTime = null;
        }

        // Construct delivery address (only for order-now orders)
        if (mOrder.OrderDeliveryAddress && mOrder.OrderDeliveryAddress.DeliveryAddress) {
          const mDeliveryAddress = mOrder.OrderDeliveryAddress.DeliveryAddress;
          mOrder.dataValues.stateId = mDeliveryAddress.State ? mDeliveryAddress.State.id : null;
          mOrder.dataValues.deliveryAddress = mDeliveryAddress.State
            ? `${mDeliveryAddress.State.name}, ${mDeliveryAddress.city}, ${mDeliveryAddress.street}`
              + (mDeliveryAddress.apartment ? ` / ${mDeliveryAddress.apartment}` : '')
            : null;
        } else {
          mOrder.dataValues.stateId = null;
          mOrder.dataValues.deliveryAddress = null;
        }

        // Process payment type (may not exist for on-site presence orders)
        if (mOrder.OrderPaymentType) {
          if (mOrder.OrderPaymentType.type !== App.getModel('OrderPaymentType').getTypes().Card) {
            mOrder.dataValues.paymentType = mOrder.OrderPaymentType.type;
          } else if (mOrder.OrderPaymentType.PaymentCard) {
            const decCardNumberRes = App.RSA.decrypt(mOrder.OrderPaymentType.PaymentCard.encCardNumber);
            if (!decCardNumberRes.success) {
              mOrder.dataValues.paymentType = `n/a`;
            } else {
              const lastDigits = decCardNumberRes.data.substr(decCardNumberRes.data.length - 4);
              mOrder.dataValues.paymentType = `Card: **** ${lastDigits}`;
            }
          } else {
            mOrder.dataValues.paymentType = `n/a`;
          }
        } else {
          // No payment type set yet (common for on-site presence orders)
          mOrder.dataValues.paymentType = null;
        }

        // Add isOrderReady and orderReadyAt
        if (mOrder.OrderSuppliers && mOrder.OrderSuppliers.length > 0) {
          mOrder.dataValues.isOrderReady = mOrder.OrderSuppliers.every(supplier => supplier.isOrderReady);
          mOrder.dataValues.orderReadyAt = Math.max(...mOrder.OrderSuppliers.map(supplier =>
            supplier.orderReadyAt ? new Date(supplier.orderReadyAt).getTime() : 0));
        } else {
          mOrder.dataValues.isOrderReady = false;
          mOrder.dataValues.orderReadyAt = null;
        }

        // Add restaurants information
        mOrder.dataValues.restaurants = mOrder.OrderSuppliers ? mOrder.OrderSuppliers.map(supplier => ({
          id: supplier.Restaurant.id,
          name: supplier.Restaurant.name,
          isReady: supplier.isOrderReady,
          readyAt: supplier.orderReadyAt,
          isDelayed: supplier.isOrderDelayed,
          delayedFor: supplier.orderDelayedFor,
          isCanceled: supplier.isCanceledByRestaurant,
          cancelReason: supplier.cancellationReason
        })) : [];

        // Add on-site presence details if this is an on-site presence order
        const orderTypes = App.getModel('Order').getOrderTypes();
        if (mOrder.orderType === orderTypes['on-site-presence'] && mOrder.OrderOnSitePresenceDetail) {
          const details = mOrder.OrderOnSitePresenceDetail;
          mOrder.dataValues.onSitePresenceDetails = {
            eventDate: details.eventDate,
            eventStartTime: details.eventStartTime || null,
            eventEndTime: details.eventEndTime || null,
            numberOfPeople: details.numberOfPeople,
            numberOfHours: details.numberOfHours,
            specialRequests: details.specialRequests || null,
            estimatedBasePrice: details.estimatedBasePrice ? parseFloat(details.estimatedBasePrice) : null,
            estimatedServiceFee: details.estimatedServiceFee ? parseFloat(details.estimatedServiceFee) : null,
            estimatedTotalPrice: details.estimatedTotalPrice ? parseFloat(details.estimatedTotalPrice) : null,
            restaurantAcceptedAt: details.restaurantAcceptedAt || null,
            restaurantRejectedAt: details.restaurantRejectedAt || null,
            rejectionReason: details.rejectionReason || null,
            acceptanceDeadline: details.acceptanceDeadline || null,
          };
        }

        // Add catering details if this is a catering order
        if (mOrder.orderType === orderTypes['catering'] && mOrder.OrderCateringDetail) {
          const details = mOrder.OrderCateringDetail;
          mOrder.dataValues.cateringDetails = {
            eventDate: details.eventDate,
            eventStartTime: details.eventStartTime || null,
            eventEndTime: details.eventEndTime || null,
            deliveryMethod: details.deliveryMethod || null,
            deliveryAddress: details.deliveryAddress || null,
            deliveryLatitude: details.deliveryLatitude ? parseFloat(details.deliveryLatitude) : null,
            deliveryLongitude: details.deliveryLongitude ? parseFloat(details.deliveryLongitude) : null,
            estimatedTotalPeople: details.estimatedTotalPeople || 0,
            specialRequests: details.specialRequests || null,
            estimatedBasePrice: details.estimatedBasePrice ? parseFloat(details.estimatedBasePrice) : null,
            estimatedServiceFee: details.estimatedServiceFee ? parseFloat(details.estimatedServiceFee) : null,
            estimatedTotalPrice: details.estimatedTotalPrice ? parseFloat(details.estimatedTotalPrice) : null,
            firstPaymentAmount: details.firstPaymentAmount ? parseFloat(details.firstPaymentAmount) : null,
            firstPaymentDueDate: details.firstPaymentDueDate || null,
            firstPaymentPaidAt: details.firstPaymentPaidAt || null,
            secondPaymentAmount: details.secondPaymentAmount ? parseFloat(details.secondPaymentAmount) : null,
            secondPaymentDueDate: details.secondPaymentDueDate || null,
            secondPaymentPaidAt: details.secondPaymentPaidAt || null,
            restaurantAcceptedAt: details.restaurantAcceptedAt || null,
            restaurantRejectedAt: details.restaurantRejectedAt || null,
            rejectionReason: details.rejectionReason || null,
            acceptanceDeadline: details.acceptanceDeadline || null,
          };
        }

        // Remove unnecessary properties
        delete mOrder.dataValues.OrderPaymentType;
        delete mOrder.dataValues.OrderDeliveryTime;
        delete mOrder.dataValues.OrderDeliveryAddress;
        delete mOrder.dataValues.OrderSuppliers;
        delete mOrder.dataValues.OrderOnSitePresenceDetail;
        delete mOrder.dataValues.OrderCateringDetail;
      }

      App.json(res, true, App.t('success', res.lang), mOrders);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc: {} };
};

