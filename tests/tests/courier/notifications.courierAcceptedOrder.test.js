const state = require("./state");

module.exports = async (App, params = {}) => {

  return true;

  const type = App.getModel('CourierNotification').getTypes()['courierAcceptedOrder'];

  const acceptedOrderPushRes = await App.getModel('CourierNotification')
    .pushToCourier(state.mCourier, {
      type,
      title: `Order #${state.ORDER_ID_LOCK} Order Accepted.`,
      message: `${App.t(['You have accepted order'])}`,
      data: {
        orderId: state.mOrder.id,
        requestId: state.mRequest.id,
      }
    });

  if (!acceptedOrderPushRes.success)
    throw Error(App.t(acceptedOrderPushRes.message));

  if (params?.debug) {
    console.json({ acceptedOrderPushRes });
  }

}