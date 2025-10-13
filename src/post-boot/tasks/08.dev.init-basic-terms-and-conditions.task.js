
module.exports = async (App, params={}, task='')=>{

  try{

    console.ok(` #post-boot: [${task}]: start: `);
    // return true;

    const dataFile = `${App.root}/dev-data/terms-and-conditions.items.js`;

    if( !console.isFile(dataFile) ){
      console.error(` #post-boot: [${task}]: items ${dataFile} not found`);
      return false;
    }

    const mData = require(dataFile);

    const mTermsAndConditions = await App.getModel('TermsAndConditions').getLatest({ limit: 2 });
    if( !App.isObject(mTermsAndConditions) || !App.isPosNumber(mTermsAndConditions.id) ){
      console.error(` #post-boot: [${task}]: mTermsAndConditions: cannot get main record`);
      return false;
    }
    await mTermsAndConditions.update(mData.main);

    if( App.isArray(mTermsAndConditions.TermsAndConditionsItems) && !mTermsAndConditions.TermsAndConditionsItems.length ){

      console.info(` #post-boot: [${task}]: adding items: ${mData.items.length}`);

      for( const item of mData.items ){
        try{

          // console.json({
          //   termsAndConditionsId: mTermsAndConditions.id,
          //   ...item,
          // });

          // continue;

          const mTermsAndConditionsItem = await App.getModel('TermsAndConditionsItem').create({
            termsAndConditionsId: mTermsAndConditions.id,
            ...item,
          });
          
          if( !App.isObject(mTermsAndConditionsItem) || !App.isPosNumber(mTermsAndConditionsItem.id) )
            throw Error(`mTermsAndConditionsItem: is null`);

          console.info(` #post-boot: [${task}]: item added: ${mTermsAndConditionsItem.id}`);
        }catch(e){
          console.error(` #post-boot: [${task}]: failed to add item: ${e.message}`);
        }
      }

    }

    console.ok(` #post-boot: [${task}]: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: ${e.message}`);
    return false;
  }

}