const state = require("./state");

module.exports = async (App, params = {}) => {

  // console.json({ state });
  // return;

  const type = App.getModel('CourierNotification').getTypes()['courierOrderRequest'];

  const newRequestPushRes = await App.getModel('CourierNotification')
    .pushToCourier(state.mCourier, {
      type,
      title: `New Order #${state.ORDER_ID_LOCK}.`,
      message: `Request #${state.mRequest.id}`,
      data: {
        orderId: state.mOrder.id,
        requestId: state.mRequest.id,
      }
    });

  if (!newRequestPushRes.success)
    throw Error(App.t(newRequestPushRes.message));

  if (params?.debug) {
    console.json({ newRequestPushRes });
  }

}