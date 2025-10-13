module.exports = async (App, params={}, task='')=>{

  const nuid = App.getNodeUID();

  try{

    const nuid = App.getNodeUID();
    console.ok(` #post-boot: [${task}]: #nuid: ${nuid}: start: `);

    for( const nodeType_t of ['api','master'] ){
      if( App.isNodeOfTypeEnabled(nodeType_t) ){
        const modelName = `${App.tools.ucFirst(nodeType_t)}Node`;
        console.info(` #post-boot: [${task}]: #nuid: ${nuid}: is: [${nodeType_t}]: true`);          
        const mNode = await App.getModel(modelName).getNodeByNuid( nuid );
        if( !App.isModel(mNode) ){
          console.error(` #post-boot: [${task}]: #nuid: ${nuid}: type: [${nodeType_t}]: could not get ${modelName} record `);          
        }else{
          const updateNode = await mNode.update({ lastSeenAt: App.getISODate() });
          if( !App.isModel(updateNode) ){
            console.error(` #post-boot: [${task}]: #nuid: ${nuid}: type: [${nodeType_t}]: failed to update record `);          
            continue;
          }
          console.ok(` #post-boot: [${task}]: #nuid: ${nuid}: type: [${nodeType_t}]: updated`);          

        }
      }
    }

    console.log(` #post-boot: [${task}]: #nuid: ${nuid}: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: #nuid: ${nuid}: ${e.message}`);
    return false;
  }

}