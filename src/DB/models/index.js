const logger = require('mii-logger.js');

const models = {};
const PATTERN = '.model.js';
const commonMethods = require('../common-methods');

module.exports = async( App, params={}, sequelize )=>{

  console.line();
  console.ok(` #DB: => add models`);

  const modelsFiles = console.listDir( __dirname );

  // First pass: Load all models
  for( const Model of modelsFiles ){

    if( Model.endsWith( PATTERN ) ){

      const name = Model.replace( PATTERN, '' ).trim();

      try{
        // console.log(`    #add model: ${ console.B(name) }`);
        const inc = require( `${__dirname}/${ Model }` );
        models[ name ] = await inc( name, App, params, sequelize );
        commonMethods( App, models[ name ] );
        console.ok(`    #add model: ${ console.B(name) }: ${console.G('inited')}`);

      }catch(e){
        console.warn(`    #add model: ${ console.B(name) }: ${console.R(e.message)}`);
        const stack = e.stack.split('\n').map((val)=>val.trim()).splice(0,4);
        for( const message of stack )
          console.error(`      : ${message}`);

      }
    }
  };

  // Second pass: Set up associations after all models are loaded
  console.line();
  console.ok(` #DB: => setup associations`);
  for( const name in models ){
    try {
      if( typeof models[ name ].associate === 'function' ) {
        models[ name ].associate( sequelize );
        console.ok(`    #associate: ${ console.B(name) }: ${console.G('associated')}`);
      }
    } catch(e) {
      console.warn(`    #associate: ${ console.B(name) }: ${console.R(e.message)}`);
    }
  }

  // console.json({ models: Object.keys(models) });
  return models;

}
