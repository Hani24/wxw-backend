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

      const mOrders = await App.getModel('Order').findAndCountAll({
        where: {
          clientId: mClient.id,
          status: {
            [App.DB.Op.or]: [
              statuses['processing'],
              statuses['delivered'],
              statuses['refunded'],
            ]
          },
        },
        distinct: true,
        attributes: [
          'id', 'status', 'totalItems', 'totalPrice', 'finalPrice', 'deliveryPrice',
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
            required: true,
            attributes: [
              'id', 'deliveryDay', 'deliveryHour', 'deliveryTimeValue', 'deliveryTimeType'
            ],
          },
          {
            model: App.getModel('OrderDeliveryAddress'),
            required: true,
            attributes: ['id'],
            include: [{
              model: App.getModel('DeliveryAddress'),
              required: true,
              attributes: ['id', 'stateId', 'city', 'street', 'apartment'],
              include: [{
                model: App.getModel('State'),
                attributes: ['id', 'name', 'code'],
              }]
            }]
          },
          {
            model: App.getModel('OrderPaymentType'),
            required: true,
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
          }
        ],
        order: [[orderBy, order]],
        offset: offset,
        limit: limit,
      });

      for (const mOrder of mOrders.rows) {
        // Get human-readable delivery time
        mOrder.dataValues.deliveryTime = App.getModel('OrderDeliveryTime')
          .getHumanTimeFromObject(mOrder.OrderDeliveryTime);

        // Construct delivery address
        const mDeliveryAddress = mOrder.OrderDeliveryAddress.DeliveryAddress;
        mOrder.dataValues.stateId = mDeliveryAddress.State.id;
        mOrder.dataValues.deliveryAddress = `${mDeliveryAddress.State.name}, ${mDeliveryAddress.city}, ${mDeliveryAddress.street}`
          + (mDeliveryAddress.apartment ? ` / ${mDeliveryAddress.apartment}` : '');

        // Process payment type
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

        // Remove unnecessary properties
        delete mOrder.dataValues.OrderPaymentType;
        delete mOrder.dataValues.OrderDeliveryTime;
        delete mOrder.dataValues.OrderDeliveryAddress;
        delete mOrder.dataValues.OrderSuppliers;
      }

      App.json(res, true, App.t('success', res.lang), mOrders);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc: {} };
};

