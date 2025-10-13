
module.exports = async (App, params={}, task='')=>{

  try{

    console.ok(` #post-boot: [${task}]: start: `);
    // return true;

    const dataFile = `${App.root}/dev-data/privacy-policy.items.js`;

    if( !console.isFile(dataFile) ){
      console.error(` #post-boot: [${task}]: items ${dataFile} not found`);
      return false;
    }

    const mData = require(dataFile);

    const mPrivacyPolicy = await App.getModel('PrivacyPolicy').getLatest({ limit: 2 });
    if( !App.isObject(mPrivacyPolicy) || !App.isPosNumber(mPrivacyPolicy.id) ){
      console.error(` #post-boot: [${task}]: mPrivacyPolicy: cannot get main record`);
      return false;
    }
    await mPrivacyPolicy.update(mData.main);

    if( App.isArray(mPrivacyPolicy.PrivacyPolicyItems) && !mPrivacyPolicy.PrivacyPolicyItems.length ){

      console.info(` #post-boot: [${task}]: adding items: ${mData.items.length}`);

      for( const item of mData.items ){
        try{

          // console.json({
          //   privacyPolicyId: mPrivacyPolicy.id,
          //   ...item,
          // });

          // continue;

          const mPrivacyPolicyItem = await App.getModel('PrivacyPolicyItem').create({
            privacyPolicyId: mPrivacyPolicy.id,
            ...item,
          });
          
          if( !App.isObject(mPrivacyPolicyItem) || !App.isPosNumber(mPrivacyPolicyItem.id) )
            throw Error(`mPrivacyPolicyItem: is null`);

          console.info(` #post-boot: [${task}]: item added: ${mPrivacyPolicyItem.id}`);
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