const NOTIFICATION_TYPES_COMMON = require('./NOTIFICATION_TYPES_COMMON');
module.exports = [
  ...NOTIFICATION_TYPES_COMMON,
  'newUnpaidOrder',

  // other [suppliers] in order chain
  'supplierCanceledOrder',
  'supplierOrderIsReady',
  'supplierOrderCompleted',

  'clientConfirmedOrder',
  'clientPaidOrder',
  'clientCanceledOrder',
  'clientRejectedOrder',
  'clientDintGetInTouch',

  'courierAssignedToOrder',
  'courierCanceledOrder',
  'courierArrived',
  'courierGotOrder',

  'orderHasBeenPaid',
  'orderCompleted',
  'orderRated',
  'orderCanceled',
  'orderDiscarded',

  'adminP2pMessage',
  'adminBroadcastMessage',
];
