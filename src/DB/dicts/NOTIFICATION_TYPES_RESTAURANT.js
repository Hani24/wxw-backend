const NOTIFICATION_TYPES_COMMON = require('./NOTIFICATION_TYPES_COMMON');

module.exports = [
  ...NOTIFICATION_TYPES_COMMON,

  // other [suppliers] in order chain
  'supplierCanceledOrder',
  'supplierOrderIsReady',
  'supplierOrderCompleted',

  'clientConfirmedOrder',
  'clientCanceledOrder',
  'clientRejectedOrder',
  'clientDintGetInTouch',
  'clientPaidOrder',

  'courierAcceptedOrder',
  'courierCanceledOrder',
  'courierArrived',
  'courierDeliveredOrder',

  'newUnpaidOrder',
  'orderRated',
  'orderCanceled', // by: [server]
  'orderDiscarded', // by: [server]

];
