const modelPattern = '.middleware.js';

module.exports = async( App, express )=>{

  console.line();
  console.ok(` #middlewares: `);

  // [BOOT-ORDER]
  const middlewaresRoot = `${__dirname}/middlewares`;
  const middlewares = console.listDir( middlewaresRoot )
    .sort(( a, b )=>{
      return (+(a.split('.')[0])) < (+(b.split('.')[0])) ? -1 : +1;
    });

  for( const middlewareFile of middlewares ){

    if( middlewareFile.endsWith( modelPattern ) ){
      const name = middlewareFile.replace( modelPattern, '' )
        .split('.')
        .map((item)=>item.trim())

      try{
        const middleware = require( `${middlewaresRoot}/${ middlewareFile }` );
        const middlewareRes = middleware( App, express, name[1] );
        console[ middlewareRes ? 'ok': 'warn' ](`    #add middleware: [${name[0]}] ${ console.B(name[1]) } ${ middlewareRes ? 'inited': 'aborting' }`);
      }catch(e){
        console.error(`    #add middleware: [${name[0]}] ${ console.B(name[1]) }: ${e.message}`);
        await console.sleep(10000);
      }

    }
  };

  return true;

}


