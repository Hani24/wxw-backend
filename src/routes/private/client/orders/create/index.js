const express = require('express');
const router = express.Router();

// {
//   "code": "optional: <string>: discount-code",
//   "ignoreUnavailableMenuItems": "optional: <boolean> sent:[true] only after user confirmation"
//   "isPickup": <boolean> //freedilevery
// }

// /private/client/orders/create

module.exports = function (App, RPath) {

  router.use('', async (req, res) => {

    try {

      const data = req.getPost();
console.log("order create data: ", data);
      const mUser = await req.user;
      const mClient = await req.client;

      if ((await App.getModel('Cart').isCartEmptyByClientId(mClient.id)))
        return App.json(res, 417, App.t(['Cart', 'is-empty'], req.lang));

      const code = req.getCommonDataString('code', null);
	const isPickup = App.getBoolFromValue(data.isPickup);
	    console.log("order create: isPickup: ", isPickup);
      const ignoreUnavailableMenuItems = App.getBoolFromValue(data.ignoreUnavailableMenuItems);
      const clientDescription = req.getCommonDataString('clientDescription', '').substr(0, 1024);

      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
      if (!App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id))
        return App.json(res, 417, App.t(['failed-to', 'get', 'system', 'settings'], req.lang));

      let mRestaurants = await App.getModel('Cart').getPopulatedByClientId(mClient.id);

      const unavailableMenuItems = [];
      for (const mRestaurant of mRestaurants) {
        for (const mCartItem of mRestaurant.CartItems) {
          const mMenuItem = mCartItem.MenuItem;
          if (!(await App.getModel('MenuItem').isset({ id: mMenuItem.id, isAvailable: true }))) {
            if (ignoreUnavailableMenuItems) {
              // [auto] remove all MenuItems if they are not available
              await App.getModel('CartItem').destroy({
                where: { id: mCartItem.id }
              });
              continue;
            }

            unavailableMenuItems.push(mMenuItem);

          }
        }
      }

      if (unavailableMenuItems.length > 0) {
        return App.json(res, 417, App.t([
          'Sorry, one or more menu-item is not available at the moment',
          'Would you like to proceed without it?'
        ], req.lang), { unavailableMenuItems });
      }

      // recheck if anything is left over
      if ((await App.getModel('Cart').isCartEmptyByClientId(mClient.id)))
        return App.json(res, 417, App.t(['Cart', 'is-empty'], req.lang));

      const discountTypes = App.getModel('DiscountCode').getTypes();
      const mDiscountCode = App.isString(code)
        ? await App.getModel('DiscountCode').getActiveByCode(code)
        : null;
      // console.debug({mDiscountCode});
      // if( !App.isObject(mDiscountCode) || !App.isPosNumber(mDiscountCode.id) )
      //   return App.json( res, 404, App.t(['Discount-Code','not','found'], req.lang) );

      // fetch updated data after [auto] deletion
      mRestaurants = await App.getModel('Cart').getPopulatedByClientId(mClient.id);

      const mDeliveryAddress = await App.getModel('DeliveryAddress').getDefaultByClientId(mClient.id);
      let mEndPoint = mUser; // default destination is User it self

      // if there is no default address, calc to client geo-pos. it self at the moment
      if (App.isObject(mDeliveryAddress) && App.isPosNumber(mDeliveryAddress.id)) {
        mEndPoint = mDeliveryAddress;
      }

      // use google api if default address is available, else dont spend api requests, client will have to select real delivery-address
      // => updated in: /private/client/orders/set/delivery-address
      let calcOptimalDistanceRes;

      if(isPickup){
        // For pickup orders, skip distance calculation
        calcOptimalDistanceRes = {
          success: true,
          message: 'success',
          data: {
            deliveryPrice: 0.0,
            duration: {
              seconds: 0,
            },
            distance: {
              mile: 0,
              kilometer: 0,
              meter: 0,
              feet: 0,
            },
          }
        };
      } else {
        calcOptimalDistanceRes = await App.getModel('DeliveryPriceSettings')
          .calcOptimalDistance(mEndPoint, mRestaurants, mDeliveryPriceSettings, {
            // useGoogle: App.isObject(mDeliveryAddress) && App.isPosNumber(mDeliveryAddress.id),
            useGoogle: true,
          });
      }

      // test:data
      // const calcOptimalDistanceRes = {
      //   success: true,
      //   message: 'success',
      //   data: {
      //     deliveryPrice: 14.00,
      //     duration: {
      //       seconds: 1400,
      //     },
      //     distance: {
      //       mile: 15,
      //     },
      //   }
      // };

      if (!calcOptimalDistanceRes.success) {
        console.json({ calcOptimalDistanceRes });
        return App.json(res, false, App.t(calcOptimalDistanceRes.message, res.lang), []);
      }

      const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());
      let mOrder = null;

      try {

        mOrder = await App.getModel('Order').create({
          clientId: mClient.id,
          discountAmount: (App.isObject(mDiscountCode) ? mDiscountCode.discount : 0),
          discountCode: (App.isObject(mDiscountCode) ? mDiscountCode.code : ''),
          discountType: (App.isObject(mDiscountCode) ? mDiscountCode.type : ''),
          deliveryPrice: calcOptimalDistanceRes.data.deliveryPrice,
          deliveryPriceUnitPrice: mDeliveryPriceSettings.unitPrice,
          deliveryPriceUnitType: mDeliveryPriceSettings.unitType,
          totalPrice: 0,
          totalItems: 0,
          finalPrice: 0,
          expectedDeliveryTime: 0,
          // createdAt: App.getISODate(),
        }, { transaction: tx });

        if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['[0]', 'Failed to create order'], req.lang));
        }

        // if [default] delivery-address
        if (App.isObject(mDeliveryAddress) && App.isPosNumber(mDeliveryAddress.id)) {
          const mOrderDeliveryAddress = await App.getModel('OrderDeliveryAddress').create({
            orderId: mOrder.id,
            deliveryAddressId: mDeliveryAddress.id,
          }, { transaction: tx });

          if (!App.isObject(mOrderDeliveryAddress) || !App.isPosNumber(mOrderDeliveryAddress.id)) {
            await tx.rollback();
            return App.json(res, false, App.t(['failed-to', 'create', 'order', 'delivery-address'], req.lang));
          }
        }


        let orderTotalPrice = 0;
        let orderTotalItems = 0;
        let highestOrderPrepTimeInSeconds = 0;

        for (const mRestaurant of mRestaurants) {

          highestOrderPrepTimeInSeconds = (mRestaurant.orderPrepTime * 60) > highestOrderPrepTimeInSeconds
            ? (mRestaurant.orderPrepTime * 60)
            : highestOrderPrepTimeInSeconds;

          // mRestaurant.
          //   id: 2,
          //   name: "KFC-Dev",
          //   image: "",
          //   isOpen: true,
          //   rating: 0,
          //   type: "stationary",

          let mOrderSupplier = await App.getModel('OrderSupplier').create({
            orderId: mOrder.id,
            restaurantId: mRestaurant.id,
            totalPrice: 0,
            totalItems: 0,
            isTakenByCourier: false,
            takenByCourierAt: null,
            isCanceledByRestaurant: false,
            canceledByRestaurantAt: null,
            isAcceptedByRestaurant: false,
            acceptedByRestaurantAt: null,
            isOrderReady: false,
            orderReadyAt: null,
          }, { transaction: tx });

          if (!App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id)) {
            await tx.rollback();
            return App.json(res, false, App.t(['[1]', 'Failed to create order'], req.lang));
          }

          let totalPrice = 0;
          let totalItems = 0;

          for (const mCartItem of mRestaurant.CartItems) {

            const mMenuItem = mCartItem.MenuItem;

            // {
            //   "id": 11,
            //   "amount": 2,
            //   "MenuItem": {
            //     "id": 6,
            //     "name": "Coca-Cola",
            //     "image": "d3f5e4af70a861ca5ef85b2494ca732c.jpg",
            //     "description": "string",
            //     "rating": 0,
            //     "price": 1.25
            //   }
            // },

            const mOrderSupplierItem = await App.getModel('OrderSupplierItem').create({
              orderSupplierId: mOrderSupplier.id,
              restaurantId: mRestaurant.id,
              menuItemId: mMenuItem.id,
              price: mMenuItem.price,
              amount: mCartItem.amount,
              totalPrice: App.getPosNumber(mCartItem.amount * mMenuItem.price, { toFixed: 2 }),
              isRatedByClient: false,
              ratedAt: null,
              rating: 0,
            }, { transaction: tx });

            if (!App.isObject(mOrderSupplierItem) || !App.isPosNumber(mOrderSupplierItem.id)) {
              await tx.rollback();
              return App.json(res, false, App.t(['[2]', 'Failed to create order'], req.lang));
            }

            totalPrice += mOrderSupplierItem.totalPrice;
            totalItems += mOrderSupplierItem.amount;

          }

          mOrderSupplier = await mOrderSupplier.update({
            totalPrice: App.getPosNumber(totalPrice, { toFixed: 2 }),
            totalItems,
            checksum: true,
          }, { transaction: tx });

          // mOrderSupplier = await mOrderSupplier.update({checksum: true}, {transaction: tx});

          if (!App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id)) {
            await tx.rollback();
            return App.json(res, false, App.t(['[3]', 'Failed to create order'], req.lang));
          }

          if (!mOrderSupplier.isValidChecksum)
            console.error(` #OrderSupplier: checksum error: id: ${mOrderSupplier.id}`);

          // const OrderSupplierChecksum = await App.getModel('OrderSupplier').getChecksum(mOrderSupplier);
          // if( !OrderSupplierChecksum ){
          //   console.error({OrderSupplierChecksum});
          //   await tx.rollback();
          //   return App.json( res, false, App.t(['[3:checksum error]','Failed to create order'], req.lang));
          // }

          // mOrderSupplier = await mOrderSupplier.update({ checksum: OrderSupplierChecksum }, {transaction: tx});
          // if( !App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id) ){
          //   await tx.rollback();
          //   return App.json( res, false, App.t(['[4]','Failed to create order'], req.lang));
          // }

          // console.warn(`#order-supplier: checksum: ${mOrderSupplier.checksum}`);
          orderTotalPrice += totalPrice;
          orderTotalItems += totalItems;

        }

        // NOTE [0]:
        //   Timoschenko Viacheslav  3 days ago
        //     >> будут ли *discount-codes* иметь ограничение на минимальную сумму ?
        //   Evgeniy Sergeyev  6:37 PM
        //     >>  @channel
        //     >> See below feedback to below:
        //     >> 1. Promo codes- Right now the max of 20% is fine. 
        //     >>   The other option we want to add is a free delivery promo code. 

        let isFreeDelivery = isPickup ? true :  false;
        let discountAmount = 0;
        let deliveryPrice = isPickup ? 0 :  mOrder.deliveryPrice;

        if (App.isObject(mDiscountCode) && App.isPosNumber(mDiscountCode.id)) {
          switch (mDiscountCode.type) {
            case discountTypes['free-delivery']: {
              isFreeDelivery = true;
              discountAmount = 0; // mOrder.deliveryPrice;
              deliveryPrice = 0;
              break;
            }
            case discountTypes['menu-discount']: {
              isFreeDelivery = false;
              // mDiscountCode.discount == in % of sum
              discountAmount = +((+orderTotalPrice * (mDiscountCode.discount / 100)).toFixed(2));
              break;
            }
          }

          await mDiscountCode.update({
            usedTimes: (mDiscountCode.usedTimes + 1),
            totalDiscount: +App.getPosNumber(mDiscountCode.totalDiscount + discountAmount, { toFixed: 2 }),
          });

        }

        const finalPrice = App.getPosNumber((orderTotalPrice + /*mOrder.*/deliveryPrice) - discountAmount, { toFixed: 2 });
        const deliveryDuration = App.isObject(calcOptimalDistanceRes.data.duration)
          ? calcOptimalDistanceRes.data.duration.seconds || 0
          : 0;


        mOrder = await mOrder.update({
          totalPrice: orderTotalPrice,
          totalItems: orderTotalItems,
          isFreeDelivery,
          discountAmount,
          finalPrice,
          // expectedDeliveryTime: App.DT.moment( mOrder.allSuppliersHaveConfirmedAt ),
          expectedDeliveryTime: App.DT.moment(App.DT.moment().add(1, 'minute') /*mOrder.createdAt*/).add(
            highestOrderPrepTimeInSeconds + deliveryDuration,
            'seconds'
          ).format(App.getDateFormat()),
        }, { transaction: tx });

        if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['[5]', 'Failed to create order'], req.lang));
        }

        const finalOrderPriceRes = await App.getModel('DeliveryPriceSettings').calculateFinalOrderPrice(
          calcOptimalDistanceRes, mDeliveryPriceSettings, mOrder, highestOrderPrepTimeInSeconds
        );

        if (!finalOrderPriceRes.success) {
          console.json({ finalOrderPriceRes });
          await tx.rollback();
          return App.json(res, false, App.t(finalOrderPriceRes.message, res.lang), []);
        }

        mOrder = await mOrder.update(finalOrderPriceRes.data, { transaction: tx });
        mOrder = await mOrder.update({ checksum: true }, { transaction: tx });

        if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)) {
          await tx.rollback();
          return App.json(res, false, App.t(['[6:update]', 'Failed to create order'], req.lang));
        }

        if (!mOrder.isValidChecksum)
          console.error(` #Order: checksum error: id: ${mOrder.id}`);

        if (!(await App.getModel('OrderDeliveryType').isset({ orderId: mOrder.id }))) {
          const mOrderDeliveryType = await App.getModel('OrderDeliveryType').create({
            orderId: mOrder.id,
            type: App.getModel('OrderDeliveryType').getTypes().Conventional
          }, { transaction: tx });

          if (!App.isObject(mOrderDeliveryType) || !App.isPosNumber(mOrderDeliveryType.id)) {
            await tx.rollback();
            return App.json(res, false, App.t(['[7]', 'Failed to create order'], req.lang));
          }

        }

        await tx.commit();

      } catch (e) {
        console.error(e.message);
        await tx.rollback();
        return await App.json(res, false, App.t(['[8]', 'Failed to create order'], req.lang));
      }

      console.json({ create: mOrder });
      await App.json(res, true, App.t('success', res.lang), mOrder);

      // [post-processing]: default order meta-data
      // const isEmpty = await App.getModel('Cart').emptyByClientId(mClient.id);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc: {} };

};


