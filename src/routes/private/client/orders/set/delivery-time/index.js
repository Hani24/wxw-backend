const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Order.id",
//   "deliveryDay": "required: ENUM: <string>: [ today | tomorrow ]",
//   "deliveryHour": "required: ENUM: <string>: [ now | set-by-user ]",

//   "// NOTE": "if deliveryHour == set-by-user:",
//   "deliveryTimeValue": "optional: <number>: [ range: 0-12 hours ]",
//   "deliveryTimeType": "optional: ENUM: <string>: [ AM | PM ]"
// }

// {
//   "id": 10000000004,
//   "deliveryDay": "today",
//   "deliveryHour": "now",
//   "deliveryTimeValue": "",
//   "deliveryTimeType": ""
// }

// /private/client/orders/set/delivery-time

module.exports = function (App, RPath) {

  router.use('', async (req, res) => {

    try {

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);

      if (!App.isPosNumber(id))
        return App.json(res, 417, App.t(['order', 'id', 'is-required'], req.lang));

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id,
          clientId: mClient.id,
        },
        distinct: true,
        // include: [
        //   {
        //     model: App.getModel('OrderDeliveryAddress'),
        //     include: [{
        //       model: App.getModel('DeliveryAddress'),
        //     }]
        //   },
        //   // {
        //   //   required: true,
        //   //   model: App.getModel('OrderSupplier'),
        //   //   attributes: ['id'],
        //   //   include: [{
        //   //     model: App.getModel('Restaurant'),
        //   //     attributes: ['id','timezone'],
        //   //   }],
        //   //   limit: 1,
        //   // },
        // ]
      });

      // console.debug({id});
      if (!App.isObject(mOrder) || !App.isPosNumber(mOrder.id))
        return App.json(res, 404, App.t(['order', 'not', 'found'], req.lang));

      if (mOrder.status !== App.getModel('Order').getStatuses().created)
        return App.json(res, 417, App.t(['current', 'order', 'cannot-be', 'updated'], req.lang));

      const deliveryDays = App.getModel('OrderDeliveryTime').getDeliveryDays( /*{asArray: true} */);
      const deliveryHours = App.getModel('OrderDeliveryTime').getDeliveryHours( /*{asArray: true} */);
      const timeTypes = App.getModel('OrderDeliveryTime').getTimeTypes( /*{asArray: true} */);

      const deliveryDay = req.getCommonDataString('deliveryDay', null);
      const deliveryHour = req.getCommonDataString('deliveryHour', null);

      const deliveryTimeValue = req.getCommonDataInt('deliveryTimeValue', 0);
      const deliveryTimeType = req.getCommonDataString('deliveryTimeType', timeTypes['NOT-SET']);

      if (!deliveryDays.hasOwnProperty(deliveryDay))
        return App.json(res, 417, App.t(['please', 'select', 'delivery-day'], req.lang));

      if (!deliveryHours.hasOwnProperty(deliveryHour))
        return App.json(res, 417, App.t(['please', 'select', 'delivery-hour'], req.lang));

      const orderDeliveryTime_t = {
        // deliveryTimeValue: 0,
        // deliveryTimeType: 
      };

      if (deliveryHour === deliveryHours.now) {

        if (deliveryDay !== deliveryDays.today)
          return App.json(res, 417, App.t(['delivery-hour', '[now]', 'cannot-be', '[tomorrow]'], req.lang));

        orderDeliveryTime_t.deliveryDay = deliveryDay;
        orderDeliveryTime_t.deliveryHour = deliveryHour;

      } else {

        if (deliveryHour !== deliveryHours['set-by-user'])
          return App.json(res, 417, App.t(['delivery-hour', 'must-be', 'set-to', '[set-by-user]'], req.lang));

        if (deliveryTimeType !== timeTypes.AM && deliveryTimeType !== timeTypes.PM) {
          return App.json(res, 417, App.t(['please', 'select', 'time'], req.lang));
        }

        if (deliveryTimeValue > 12)
          return App.json(res, 417, App.t(['time', 'value', 'cannot-be', 'greater', 'than', '12', 'hours'], req.lang));

        orderDeliveryTime_t.deliveryTimeType = deliveryTimeType;
        orderDeliveryTime_t.deliveryTimeValue = deliveryTimeValue;
        orderDeliveryTime_t.deliveryDay = deliveryDay;
        orderDeliveryTime_t.deliveryHour = deliveryHour;

      }

      const mOrderSuppliers = await App.getModel('OrderSupplier').findAll({
        where: {
          orderId: mOrder.id,
        },
        attributes: ['id', 'restaurantId'],
        distinct: true,
        include: [{
          model: App.getModel('Restaurant'),
          attributes: ['id', 'name', 'isOpen', 'timezone', 'orderPrepTime'],
          required: true,
          include: [{
            model: App.getModel('RestaurantWorkingTime'),
            attributes: { exclude: ['id', 'restaurantId', 'createdAt', 'updatedAt'] },
          }]
        }]
      });

      const mDate = App.getDetailedDate();
      const weekDays = App.getModel('RestaurantWorkingTime').getWeekDays({ asArray: true });

      for (const mOrderSupplier of mOrderSuppliers) {

        const mRestaurant = mOrderSupplier.Restaurant;
        const mRestaurantWorkingTime = mRestaurant.RestaurantWorkingTime;

        // orderDeliveryTime_t.deliveryDay; // today, tomorrow
        // orderDeliveryTime_t.deliveryHour; // now, set-by-user
        // orderDeliveryTime_t.deliveryTimeType; // AM, Pm
        // orderDeliveryTime_t.deliveryTimeValue; // 0-12
        // fridayOpenAt, fridayCloseAt, isFridayOpen;

        let iDayName = null;
        let uDayName = null;

        // console.log(` orderDeliveryTime_t.deliveryDay: ${orderDeliveryTime_t.deliveryDay}`)
        if (orderDeliveryTime_t.deliveryDay === deliveryDays.today) {
          iDayName = weekDays[mDate.weekDay];
          uDayName = App.tools.ucFirst(iDayName);

        } else {
          // tomorrow
          iDayName = weekDays[(mDate.weekDay + 1) > 6 ? 0 : (mDate.weekDay + 1)];
          uDayName = App.tools.ucFirst(iDayName);
        }

        // console.log(` mDate.weekDay: ${mDate.weekDay}`)
        // console.log(` iDayName: ${iDayName}`)
        // console.log(` uDayName: ${uDayName}`)
        // console.log(` mRestaurantWorkingTime[is${ uDayName }Open]: ${ mRestaurantWorkingTime[`is${ uDayName }Open`] }`)

        console.json({ mRestaurantWorkingTime });

        if (!mRestaurantWorkingTime[`is${uDayName}Open`]) {
          return App.json(res, 417, App.t([
            'Restaurant', mRestaurant.name, 'is-not', 'open', orderDeliveryTime_t.deliveryDay
          ], req.lang));
        }

        if (orderDeliveryTime_t.deliveryHour === deliveryHours['set-by-user']) {
          if (orderDeliveryTime_t.deliveryTimeType === timeTypes.AM) {
            // AM
            const from = mRestaurantWorkingTime[`${iDayName}OpenAt`];
            if (orderDeliveryTime_t.deliveryTimeValue < (from + (1))) { // add 1 extra hour 
              return App.json(res, 417, App.t([
                'Restaurant', mRestaurant.name, 'is-not', 'open', 'yet', 'at', 'this', 'time'
              ], req.lang));
            }
          } else {
            // PM
            const upto = mRestaurantWorkingTime[`${iDayName}CloseAt`];
            if (orderDeliveryTime_t.deliveryTimeValue > (upto - 1)) { // -1 == at least 1 hour before close time
              return App.json(res, 417, App.t([
                'Restaurant', mRestaurant.name, 'accepts', 'orders', 'at-least', '1', 'hour', 'before', 'close', 'time'
              ], req.lang));
            }
          }

          // client can change time multiple times
          // if( App.isNull(mOrder.pushToProcessingAt) ){

          const mRestaurantCurrentTime = App.DT.moment()
            .tz(mRestaurant.timezone);

          let pushToProcessingAt = mRestaurantCurrentTime
            .clone()
            .startOf('day')

          if (orderDeliveryTime_t.deliveryDay === deliveryDays.tomorrow)
            pushToProcessingAt.add(24, 'hours')

          pushToProcessingAt
            .add((+orderDeliveryTime_t.deliveryTimeValue) + (deliveryTimeType === timeTypes.PM ? 12 : 0), 'hours')

          // if( pushToProcessingAt < mRestaurantCurrentTime.add(1, 'hours') )
          //   return App.json( res, 417, App.t(['at-least','1','hour','before','delivery','time'], req.lang) );

          // if( !App.isEnv('dev') )
          if (pushToProcessingAt < mRestaurantCurrentTime.add((+mRestaurant.orderPrepTime), 'minutes')) {
            // return App.json( res, 417, App.t(['at-least', mRestaurant.orderPrepTime, 'minute','before','delivery','time'], req.lang) );
            return App.json(res, 417, App.t([
              mRestaurant.name, 'requires at least ', mRestaurant.orderPrepTime, ' minutes to prepare an order'
            ], req.lang));
          }

          await mOrder.update({
            pushToProcessingAt: pushToProcessingAt.clone().tz(App.getServerTz()).format(App.getDateFormat())
          });

          // }

        } else {

          // today => now

          const [currentRestoTimeValue, currentRestoTimeType] = App.DT.moment()
            .tz(mRestaurant.timezone)
            .format(App.DT.moment.humanTimeFormat)
            .split(' ');

          const from = mRestaurantWorkingTime[`${iDayName}OpenAt`];
          if ((+currentRestoTimeValue) < (from + (0))) {
            return App.json(res, 417, App.t([
              'Restaurant', mRestaurant.name, 'is-not', 'open', 'yet', 'at', 'this', 'time'
            ], req.lang));
          }

          const upto = mRestaurantWorkingTime[`${iDayName}CloseAt`];
          if ((+currentRestoTimeValue) > (upto - 1)) { // -1 == at least 1 hour before close time
            return App.json(res, 417, App.t([
              'Restaurant', mRestaurant.name, 'accepts', 'orders', 'at-least', '1', 'hour', 'before', 'close', 'time'
            ], req.lang));
          }

        }

      }

      let mOrderDeliveryTime = await App.getModel('OrderDeliveryTime').getByFields({
        orderId: mOrder.id
      });

      if (!App.isObject(mOrderDeliveryTime) || !App.isPosNumber(mOrderDeliveryTime.id)) {
        mOrderDeliveryTime = await App.getModel('OrderDeliveryTime').create({
          orderId: mOrder.id
        });

        if (!App.isObject(mOrderDeliveryTime) || !App.isPosNumber(mOrderDeliveryTime.id))
          return App.json(res, false, App.t(['failed-to', 'add', 'delivery-time'], req.lang));

      }

      const updateRes = await mOrderDeliveryTime.update(orderDeliveryTime_t);
      if (!App.isObject(updateRes) || !App.isPosNumber(updateRes.id)) {
        console.error(`orderDeliveryTime_t => `);
        console.json({ orderDeliveryTime_t });
        return App.json(res, false, App.t(['failed-to', 'set', 'delivery-time'], req.lang));
      }

      App.json(res, true, App.t('success', res.lang), updateRes);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc: {} };

};


