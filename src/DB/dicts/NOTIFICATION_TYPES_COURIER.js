const NOTIFICATION_TYPES_COMMON = require('./NOTIFICATION_TYPES_COMMON');

module.exports = [
  ...NOTIFICATION_TYPES_COMMON,

  'supplierCanceledOrder',
  'supplierOrderIsReady',
  'supplierOrderCompleted',
  'supplierOrderDelayed',

  'courierOrderRequest',
  'courierAcceptedOrder',
  'courierCanceledOrder',
  'courierDeliveredOrder',
  'courierEmailVerificationRequired',
  'courierKycVerificationRequired',
  'courierRequestApproved',
  'courierRequestRejected',

  'clientCanceledOrder',
  'clientRejectedOrder',
  'clientDintGetInTouch',
  'clientPaidOrder',

  'orderRated',
  'orderDiscarded',

  'withdrawRequestApproved',
  'withdrawRequestRejected',
  'withdrawRequestCompleted',

];
