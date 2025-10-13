
const test = __filename.split("/").pop().replace('.js', '');

module.exports = async (App, params = {}) => {

  return true;

  const ORDER_ID_LOCK = '012345678';
  const type = App.getModel('ClientNotification').getTypes()['courierAcceptedOrder'];

  // const mRequest = { id: 1 };
  const mOrder = { id: 2 };
  const mClient = { id: 3, userId: 4 };

  const mCourier = { id: 3, userId: 4, lat: 53, lon: 3.45 };
  const mCourierUser = {
    toJSON: () => ({
      id: mCourier.userId,
      firstName: 'Bob',
      lastName: 'Andersen',
      phone: '+1 234 5678 900',
    })
  };

  const clientAcceptedOrderPushRes = await App.getModel('ClientNotification')
    .pushToClient(mClient, {
      type,
      title: `Order #${ORDER_ID_LOCK} Updated.`,
      message: `We found a driver to deliver your order. Will get there soon!`,
      data: {
        Courier: {
          courierId: mCourier.id,
          orderId: mOrder.id,
          lat: mCourier.lat,
          lon: mCourier.lon,
          User: {
            ...({
              id=0,
              firstName='n/a',
              lastName='n/a',
              phone='n/a',
            } = App.isObject(mCourierUser) ? mCourierUser.toJSON() : {})
          },
        }
      }
    });

  if (!clientAcceptedOrderPushRes.success)
    throw Error(App.t(clientAcceptedOrderPushRes.message));

  if (params?.debug) {
    console.json({ clientAcceptedOrderPushRes });
  }


}