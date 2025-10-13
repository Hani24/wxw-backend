const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async (exportModelWithName, App, params, sequelize) => {

  const DISTANCE_UNITS = App.getDictByName('DISTANCE_UNITS');
  const INITIAL_DEFAULT_UNIT_PRICE = 0.25;

  const Model = sequelize.define(exportModelWithName, {
    unitType: {
      type: DataTypes.ENUM, required: true, values: DISTANCE_UNITS,
      defaultValue: DISTANCE_UNITS[0],
    },
    unitPrice: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: false, required: true
    },
    baseFee: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: false, defaultValue: 3.99,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
    maxSearchSquareInDegrees: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0.1,
    },
    maxSearchRadius: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
    },
    // Client pay: ((order-total-sum:items:each) *1.15 ) + ( (baseFee: 3.99)+ ( distance *unitPrice *1.02 ) )
    serviceFeePercent: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
    },
    deliveryPerUnitFeePercent: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 2.0,
    },
  });

  Model.getUnits = function ({ asArray = false } = {}) {
    return Model._mapDict(DISTANCE_UNITS, { asArray });
  };

  Model.getSettings = async function () {

    const mModel = await Model.findOne({
      where: {
        isDeleted: false,
      },
      attributes: {
        exclude: ['isDeleted', 'deletedAt', 'updatedAt', 'createdAt'],
      },
      order: [['id', 'desc']],
    });

    return App.isObject(mModel) && App.isPosNumber(mModel.id)
      ? mModel
      : await Model.create({
        // random initial values
        unitType: Model.getUnits({ asArray: true })[0],
        unitPrice: INITIAL_DEFAULT_UNIT_PRICE,
      });

  }

  Model.setUnitType = async function (unitType) {
    const unitTypes = Model.getUnits();

    if (!unitTypes.hasOwnProperty(unitType))
      return { success: false, message: 'Unsupported units, please use one of provided units', data: unitTypes };

    const updateSettings = await (await Model.getSettings()).update({ unitType });
    if (!App.isObject(updateSettings) || !App.isPosNumber(updateSettings.id))
      return { success: false, message: 'Failed to update delivery-settings' };

    return await Model.setMaxSearchRadius(updateSettings.maxSearchRadius);

  }

  Model.setMaxSearchRadius = async function (maxSearchRadius) {
    if (!App.isPosNumber(maxSearchRadius))
      return { success: false, message: 'Radius must be valid positive number' };
    const mSettings = await Model.getSettings();
    const unitTypes = Model.getUnits();

    let normUnits = 0;
    switch (mSettings.unitType) {
      case unitTypes.kilometer: {
        normUnits = maxSearchRadius;
        break;
      }
      case unitTypes.mile: {
        normUnits = App.geo.lib.milesToKms(maxSearchRadius)
        break;
      }
      case unitTypes.feet: {
        normUnits = +(App.geo.lib.feetsToMeters(maxSearchRadius) / 1000).toFixed(4);
        break;
      }
      case unitTypes.meter: {
        normUnits = +(maxSearchRadius / 1000).toFixed(4);
        break;
      }
    }

    const maxSearchSquareInDegrees = App.geo.lib.kmToAvgLatLonDeg(normUnits);

    const updateSettings = await mSettings.update({
      maxSearchRadius,
      maxSearchSquareInDegrees,
    });

    if (!App.isObject(updateSettings) || !App.isPosNumber(updateSettings.id))
      return { success: false, message: 'Failed to update delivery-settings' };

    return { success: true, message: 'success', data: updateSettings };

  }

  Model.calcOptimalDistance = async function (mDestination, /*mClient,*/ mRestaurants, mDeliveryPriceSettings, { useGoogle = false } = {}) {
    return (useGoogle /*&& (App.isEnv('stage') || App.isEnv('prod'))*/)
      ? await Model._calcOptimalDistanceGoogle(mDestination, /*mClient,*/ mRestaurants, mDeliveryPriceSettings)
      : await Model._calcOptimalDistanceLocal(mDestination, /*mClient,*/ mRestaurants, mDeliveryPriceSettings)
  }

  // google-apis
  Model._calcOptimalDistanceGoogle = async function (mDestination, /*mClient,*/ mRestaurants, mDeliveryPriceSettings) {

    if (!App.isArray(mRestaurants) || !mRestaurants.length)
      return { success: false, message: ['restaurants', 'must-be', 'valid', 'array'] };

    if (!App.isObject(mDestination) || !App.isNumber(mDestination.lat) || !App.isNumber(mDestination.lon))
      return { success: false, message: ['client', 'must-be', 'valid', 'object'] };

    if (!App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id))
      return { success: false, message: ['delivery', 'settings', 'is-not', 'valid', 'object'] };

    const { unitPrice, unitType, baseFee } = mDeliveryPriceSettings;

    const WPs = mRestaurants.map((mResto) => ({ lat: mResto.lat, lon: mResto.lon, }));
    WPs.push({ lat: mDestination.lat, lon: mDestination.lon });
    // console.json({WPs});

    const distanceRes = await App.geo.maps.calcDistanceOnWayPoints(WPs);
    if (!distanceRes.success) {
      console.json({ distanceRes });
      return distanceRes;
    }

    distanceRes.data.deliveryPrice = App.getNumber(
      baseFee + (unitPrice * distanceRes.data.distance[unitType]),
      { toFixed: 2 }
    );

    console.json({ _calcOptimalDistanceGoogle: distanceRes.data });
    return distanceRes;
  }

  // allows to calc trans-atlantic path
  // local geo-cumputing no external api calls
  Model._calcOptimalDistanceLocal = async function (mDestination, mRestaurants, mDeliveryPriceSettings) {

    if (!App.isArray(mRestaurants) || !mRestaurants.length)
      return { success: false, message: ['restaurants', 'must-be', 'valid', 'array'] };

    if (!App.isObject(mDestination) || !App.isPosNumber(mDestination.id))
      return { success: false, message: ['client', 'must-be', 'valid', 'object'] };

    if (!App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id))
      return { success: false, message: ['delivery', 'settings', 'is-not', 'valid', 'object'] };

    const { unitPrice, unitType, baseFee, maxSearchSquareInDegrees } = mDeliveryPriceSettings;

    // 1st point is (virtual) == maxSearchSquareInDegrees from first resto.
    const autoMaxVirtualCourierPoint = {
      lat: mRestaurants[0].lat + maxSearchSquareInDegrees,
      lon: mRestaurants[0].lon + maxSearchSquareInDegrees,
      name: 'auto:max-search-square',
      type: 'courier',
    };

    const mapRouteCoords = [];
    mRestaurants.map((mRestaurant) => {
      mapRouteCoords.push({
        id: mRestaurant.id,
        lat: mRestaurant.lat,
        lon: mRestaurant.lon,
        name: mRestaurant.name,
        type: 'restaurant',
      })
    });

    const destPoint = {
      id: mDestination.id,
      lat: mDestination.lat,
      lon: mDestination.lon,
      name: 'client',
      type: 'client',
    };

    const initalPathRes = App.geo.lib.calcOptimalDistance(
      autoMaxVirtualCourierPoint,
      mapRouteCoords,
      unitType
    );

    if (!initalPathRes.success) {
      console.json({ initalPathRes });
      return { success: false, message: ['failed-to', 'estimate', 'delivery', 'route', '[0]'] };
    }

    const finalPathRes = App.geo.lib.calcOptimalDistance(
      initalPathRes.data.pathRes[initalPathRes.data.pathRes.length - 1],
      [destPoint],
      unitType
    );

    if (!finalPathRes.success) {
      console.json({ finalPathRes });
      return { success: false, message: ['failed-to', 'estimate', 'delivery', 'route', '[1]'] };
    }

    initalPathRes.data.distance =
      +(initalPathRes.data.distance + finalPathRes.data.distance).toFixed(2);

    initalPathRes.data.pathRes[initalPathRes.data.pathRes.length - 1] =
      finalPathRes.data.pathRes[0];

    initalPathRes.data.pathRes.push(finalPathRes.data.pathRes[1]);
    initalPathRes.data.deliveryPrice = App.getNumber(
      baseFee + (unitPrice * initalPathRes.data.distance),
      { toFixed: 2 }
    );

    return initalPathRes;

  }

  Model.calculateFinalOrderPrice = async function (
    calcOptimalDistanceRes, mDeliveryPriceSettings, mOrder, highestOrderPrepTimeInSeconds
  ) {

    try {

      const discountTypes = App.getModel('DiscountCode').getTypes();

      const deliveryDuration = App.isObject(calcOptimalDistanceRes.data.duration)
        ? calcOptimalDistanceRes.data.duration.seconds || 0
        : 0;

      // console.debug({deliveryDuration});

      const {
        unitPrice, unitType, serviceFeePercent, deliveryPerUnitFeePercent
      } = mDeliveryPriceSettings;

      // console.debug({unitPrice, unitType, serviceFeePercent, deliveryPerUnitFeePercent});
      // console.json({distance: calcOptimalDistanceRes.data});

      const _deliveryPerUnitFeePercent = +(deliveryPerUnitFeePercent === 0 ? 0 : deliveryPerUnitFeePercent / 100).toFixed(4);
      const deliveryDistancePrice = calcOptimalDistanceRes.data.distance[unitType] * unitPrice;
      const deliveryPriceFee = +(
        mOrder.discountType !== discountTypes['free-delivery']
          ? (deliveryDistancePrice * _deliveryPerUnitFeePercent)
          : 0
      ).toFixed(3);

      // console.debug({_deliveryPerUnitFeePercent, deliveryDistancePrice, deliveryPriceFee});

      // pure-items-price
      const totalPriceFee = +(mOrder.totalPrice * (serviceFeePercent === 0 ? 0 : (serviceFeePercent / 100))).toFixed(2);
      let finalPrice = mOrder.totalPrice;
      const deliveryPrice = calcOptimalDistanceRes.data.deliveryPrice;

      if (mOrder.isFreeDelivery /* it is discount on its own */) {
        // no changes: (totalPrice:items) is (finalPrice:order)
        finalPrice += totalPriceFee;
      } else {
        discountAmount = ((mOrder.discountCode && mOrder.discountAmount) ? mOrder.discountAmount : 0);
        finalPrice = (mOrder.totalPrice + totalPriceFee) + (deliveryPrice + deliveryPriceFee);
        finalPrice -= discountAmount;
      }

      finalPrice = +(finalPrice.toFixed(2));

      const order_t = {
        // deliveryPrice: must be recalculated anyway for Couriers-Payments
        deliveryPrice: +(deliveryPrice.toFixed(2)),
        deliveryPriceFee: +(deliveryPriceFee.toFixed(2)),
        deliveryPriceUnitPrice: unitPrice,
        deliveryPriceUnitType: unitType,
        totalPrice: +(mOrder.totalPrice.toFixed(2)),
        totalPriceFee: +(totalPriceFee.toFixed(2)),
        finalPrice: +(finalPrice.toFixed(2)),
        deliveryDistanceValue: +(calcOptimalDistanceRes.data.distance[unitType].toFixed(2)),
        deliveryDistanceType: unitType,
        // _discountType: mOrder.discountType,
        // _discountCode: mOrder.discountCode,
        // _discountAmount: mOrder.discountAmount,
        expectedDeliveryTime: App.DT.moment(App.DT.moment().add(1, 'minute') /*mOrder.createdAt*/).add(
          highestOrderPrepTimeInSeconds + deliveryDuration,
          'seconds'
        ).format(App.getDateFormat()),
      };

      console.json({
        orderId: mOrder.id,
        calculateFinalOrderPriceses: order_t,
        distance: calcOptimalDistanceRes.data.distance[unitType],
        unitPrice,
      });

      return { success: true, message: 'success', data: order_t };

    } catch (e) {
      console.error(`#Order.calculateFinalOrderPriceses: ${e.message}`);
      return { success: false, message: 'Failed to process Order' };
    }

  }

  return Model;

}
