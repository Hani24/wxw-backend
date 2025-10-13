const express = require('express');
const router = express.Router();

/*
{
  "monday": {
    "isOpen": false,
    "openAt": 0,
    "closeAt": 0
  },
  "tuesday": {
    "isOpen": true,
    "openAt": 9,
    "closeAt": 10
  },
  "wednesday": {
    "isOpen": true,
    "openAt": 9,
    "closeAt": 10
  },
  "thursday": {
    "isOpen": true,
    "openAt": 9,
    "closeAt": 10
  },
  "friday": {
    "isOpen": true,
    "openAt": 10,
    "closeAt": 7
  },
  "saturday": {
    "isOpen": true,
    "openAt": 12,
    "closeAt": 12
  },
  "sunday": {
    "isOpen": true,
    "openAt": 9,
    "closeAt": 10
  }
}
*/


// /private/restaurant/working-time/update/

module.exports = function (App, RPath) {

  router.use('', async (req, res) => {

    try {

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const mRestaurantWorkingTime = await App.getModel('RestaurantWorkingTime')
        .getByRestaurantId(mRestaurant.id);

      const weekDays = App.getModel('RestaurantWorkingTime').getWeekDays({ asArray: true });

      for (const weekDay of weekDays) {
        if (!App.isObject(data[weekDay]))
          return App.json(res, 417, App.t(['please', 'provide', 'all', 'week-days'], res.lang));

      }

      const workingTime_t = {
        isMondayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.monday.isOpen) : true,
        mondayOpenAt: App.getNumber(+data.monday.openAt, { floor: true, abs: true }),
        mondayCloseAt: App.getNumber(+data.monday.closeAt, { floor: true, abs: true }),

        isTuesdayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.tuesday.isOpen) : true,
        tuesdayOpenAt: App.getNumber(+data.tuesday.openAt, { floor: true, abs: true }),
        tuesdayCloseAt: App.getNumber(+data.tuesday.closeAt, { floor: true, abs: true }),

        isWednesdayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.wednesday.isOpen) : true,
        wednesdayOpenAt: App.getNumber(+data.wednesday.openAt, { floor: true, abs: true }),
        wednesdayCloseAt: App.getNumber(+data.wednesday.closeAt, { floor: true, abs: true }),

        isThursdayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.thursday.isOpen) : true,
        thursdayOpenAt: App.getNumber(+data.thursday.openAt, { floor: true, abs: true }),
        thursdayCloseAt: App.getNumber(+data.thursday.closeAt, { floor: true, abs: true }),

        isFridayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.friday.isOpen) : true,
        fridayOpenAt: App.getNumber(+data.friday.openAt, { floor: true, abs: true }),
        fridayCloseAt: App.getNumber(+data.friday.closeAt, { floor: true, abs: true }),

        isSaturdayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.saturday.isOpen) : true,
        saturdayOpenAt: App.getNumber(+data.saturday.openAt, { floor: true, abs: true }),
        saturdayCloseAt: App.getNumber(+data.saturday.closeAt, { floor: true, abs: true }),

        isSundayOpen: App.isBoolean(data.monday.isOpen) ? App.getBoolFromValue(data.sunday.isOpen) : true,
        sundayOpenAt: App.getNumber(+data.sunday.openAt, { floor: true, abs: true }),
        sundayCloseAt: App.getNumber(+data.sunday.closeAt, { floor: true, abs: true }),
      };

      // console.json({ data });
      // console.json({ workingTime_t });

      const updateRes = await mRestaurantWorkingTime.update(workingTime_t);
      if (!App.isObject(updateRes) || !App.isPosNumber(updateRes.id))
        return App.json(res, false, App.t(['failed-to', 'update', 'bussiness', 'hours'], res.lang), mWorkingTime);

      await mRestaurant.update({ isOpeningHoursSet: true });
      const mWorkingTime = await App.getModel('RestaurantWorkingTime')
        .getAsObjectByRestaurantId(mRestaurant.id);

      App.json(res, true, App.t(['success'], res.lang), mWorkingTime);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc: {} };

};


