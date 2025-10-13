
module.exports = async (App, params={}, task='')=>{

  try{

    console.ok(` #post-boot: [${task}]: start: `);
    // return true;

    // [dev] clean up all
    if( App.getEnv('CLEAN_ORDERS') ){
      await App.getModel('Courier').update({
        hasActiveOrder: false,
        activeOrderId: null,
        activeOrderAt: null,
        isOrderRequestSent: 0,
        orderRequestSentAt: null,
      }, {where: {}});
      await App.getModel('Order').update({ courier: null }, {where: {}});
      await App.getModel('ClientNotification').truncate();
      await App.getModel('CourierNotification').truncate();
      await App.getModel('RestaurantNotification').truncate();
      await App.getModel('CourierOrderRequest').truncate();
      await App.getModel('Order').destroy({where:{}});
      console.ok('done...');
    }

    console.ok(` #post-boot: [${task}]: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: ${e.message}`);
    return false;
  }

}