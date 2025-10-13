
module.exports = async (App, params={}, task='')=>{

  try{

    console.ok(` #post-boot: [${task}]: start: `);

    {
      // will init [search-near-by] values
      // const units = App.getModel('SearchNearByClientSettings').getUnits();    
      const mSearchNearByClientSettings = await App.getModel('SearchNearByClientSettings').getSettings(!!'only-view');
      if( App.isObject(mSearchNearByClientSettings) && App.isPosNumber(mSearchNearByClientSettings.id) ){
        // await mSearchNearByClientSettings.update({});
        await App.getModel('SearchNearByClientSettings').setMaxSearchRadius( mSearchNearByClientSettings.maxSearchRadius );
      }
    }

    {
      // will init [price-units-and-seach-params] values
      // const units = App.getModel('DeliveryPriceSettings').getUnits();    
      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
      if( App.isObject(mDeliveryPriceSettings) && App.isPosNumber(mDeliveryPriceSettings.id) ){
        await App.getModel('DeliveryPriceSettings').setMaxSearchRadius( mDeliveryPriceSettings.maxSearchRadius );
      }
    }

    console.ok(` #post-boot: [${task}]: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: ${e.message}`);
    return false;
  }

}