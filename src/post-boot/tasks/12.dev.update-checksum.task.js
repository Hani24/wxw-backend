
module.exports = async (App, params={}, task='')=>{

  try{

    console.ok(` #post-boot: [${task}]: start: `);
    return true;

    // only for inital set-up
    const mRestaurant = await App.getModel('Restaurant').findOne({ /*where: {id: 2}*/ });
    if( !mRestaurant.isValidChecksum /*|| true*/ ){
      const models = [
        'OrderSupplier', 'Order', 'Restaurant','Courier','CourierWithdrawRequest', 'RestaurantTransfer'
      ];
      for( const model_t of models ){
        console.log({model_t});
        for( const mRec of await App.getModel(model_t).findAll({/*attributes: ['id','checksum']*/}) ){
          await mRec.update({
            ...( model_t === 'Courier' ? {balance: 777.77}: {}),
            checksum: true,
          });
        }
      }
    }

    console.ok(` #post-boot: [${task}]: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: ${e.message}`);
    console.error(e);
    return false;
  }

}