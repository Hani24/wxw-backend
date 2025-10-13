const ITEMS_ROOT = `${__dirname}/items`;
const ITEMS_EXT = `.item.js`;

module.exports = (App, params={})=>{

  console.line();
  console.ok(` #dev:`);

  const items_t = {};

  const items = console.listDir(ITEMS_ROOT)
    .filter((item)=>item.endsWith(ITEMS_EXT));

  for( const item of items ){
    const itemName = item.replace(ITEMS_EXT, '').trim();
    try{
      const mFunc = require(`${ITEMS_ROOT}/${item}`)( App, itemName, params );
      console.ok(`   ${console.B(itemName)} => ${console.G('inited ...')}`);
      items_t[ itemName ] = mFunc;
    }catch(e){
      console.error(`   ${itemName} => ${e.message}`);
      console.log(e);
    }
  }

  return items_t;

}
