class EventEmitter{

  constructor( params={} ){
    this._subscribers = {};
    this.name = 'EventEmitter';
  }

  on( event, callback ){
    if( !Array.isArray(this._subscribers[ event ]) )
      this._subscribers[ event ] = [];

    if( typeof callback !== 'function' )
      return false;

    this._subscribers[ event ].push( callback );
    return true;

  }

  emit( event, data={} ){
    if( Array.isArray(this._subscribers[ event ]) && this._subscribers[ event ].length ){
      for( const subscriber of this._subscribers[ event ] ){
        if( typeof subscriber === 'function' ){
          try{
            subscriber( data );
          }catch(e){
            console.error(` #${this.name}:emit: ${e.message}`);
          }
        }
      }
    }
  }

  async sleep( msec ){
    return new Promise( async(resolve, reject)=>{
      try{
        const timeout_t = setTimeout(async()=>{
          resolve(true);
        }, msec);
      }catch(e){
        console.error(` #${this.name}:sleep: ${e.message}`);
        resolve(true);
      }
    });
  }

}
