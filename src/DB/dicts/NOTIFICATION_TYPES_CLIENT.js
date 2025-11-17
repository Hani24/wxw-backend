const NOTIFICATION_TYPES_COMMON = require('./NOTIFICATION_TYPES_COMMON');

module.exports = [
  ...NOTIFICATION_TYPES_COMMON,

  'supplierAcceptedOrder',
  'supplierCanceledOrder',
  'supplierOrderDelayed',
  // 'supplierOrderIsReady', // not applicable, only [inner] => courier
  'allSuppliersHaveConfirmed',

  'clientConfirmedOrder',
  'clientCanceledOrder',
  'clientRejectedOrder',
  'clientDintGetInTouch',

  'courierAcceptedOrder',
  'courierCanceledOrder',
  'courierDeliveredOrder',
  'courierHasCollectedTheOrders',

  'paymentSucceeded',
  'paymentFailed',
  'paymentActionRequired',

  'rateOrder',
  'orderRated',
  'orderRefunded',
  'orderDiscarded',

  // News Feed
  'newPost',
  'newEvent',

];
