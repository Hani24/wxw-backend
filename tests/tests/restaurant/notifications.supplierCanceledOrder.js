
const test = __filename.split("/").pop().replace('.js', '');

module.exports = async (App, params = {}) => {

  return true;

  const ackTimeout = (10 * 1000);
  const notifyData = {
    ack: false, // no-ack
    event: App.getModel('RestaurantNotification').getEvents()['supplierCanceledOrder'],
    type: App.getModel('RestaurantNotification').getTypes()['supplierCanceledOrder'],
    data: {
      orderId: mOrder.id,
      // restaurantId: mOrderSupplier.restaurantId,
      // reason: mOrderSupplier.cancellationReason || 'n/a',
    },
  };

  if (params?.debug) {
    console.json({ notifyData });
  }

  const notifyRes = await App.getModel('RestaurantNotification')
    .notifyById(mOrderSupplier.restaurantId, notifyData, ackTimeout);

  if (!emailVerificationRes.success)
    throw Error(App.t(notifyRes.message));

  if (params?.debug) {
    console.json({ notifyRes });
  }


}