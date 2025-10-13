const logger = require('mii-logger.js');
const ITEMS_ROOT = `${__dirname}/patches`;
const ITEMS_EXT = `.patch.js`;

(async(params={})=>{

  console.line();
  console.ok(` #patches:`);
  const app_root = `${__dirname}/..`;

  const patches = console.listDir(ITEMS_ROOT)
    .filter((patch)=>patch.endsWith(ITEMS_EXT));

  for( const patch of patches ){
    const patchName = patch.replace(ITEMS_EXT, '').trim();
    try{
      const mPatch = require(`${ITEMS_ROOT}/${patch}`)( app_root, patchName, params );
      const execRes = await mPatch();
      console[execRes.success?'ok':'error'](`   ${console.B(patchName)} => ${ execRes.message }`);

    }catch(e){
      console.error(`   ${patchName} => ${e.message}`);
      console.log(e);
    }
  }

  return true;

})();
