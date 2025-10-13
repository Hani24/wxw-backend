class MEDB{

  static get( key, _default=null ){
    try{
      let item = window.localStorage.getItem( key );
      if( item ){
        try{
          const json_t = JSON.parse(item);
          return json_t;
        }catch(e){ }
      }
      return item || _default;

    }catch(e){
      console.log(`MEDB::get( ${ key } ): ${e.message}`);
      return false || _default;
    }
  }

  static set( key, data={} ){
    try{
      data = (typeof data === 'object' ? JSON.stringify(data) : data);
      window.localStorage.setItem( key, data );
      return true;
    }catch(e){
      console.log(`MEDB::set( ${ key } ): ${e.message}`);
      return false;
    }
  }

  static update( key, data={} ){
    try{

      if( typeof data === 'object' ){
        const _data = MEDB.get( key );
        if( typeof _data === 'object' ){
          data = { ...data, ..._data };
        }
      }
      window.localStorage.setItem( key, data );
      return true;
    }catch(e){
      console.log(`MEDB::update( ${ key } ): ${e.message}`);
      return false;
    }
  }

  static remove( key ){
    try{
      window.localStorage.removeItem( key );
      return true;
    }catch(e){
      console.log(`MEDB::remove( ${ key } ): ${e.message}`);
      return false;
    }
  }

  static exists( key ){
    try{
      return window.localStorage.hasOwnProperty( key );
    }catch(e){
      console.log(`MEDB::remove( ${ key } ): ${e.message}`);
      return false;
    }
  }

  static getRawKeys(){
    try{
      return Object.keys( window.localStorage );
    }catch(e){
      console.log(`MEDB::getRawKeys: ${e.message}`);
      return false;
    }
  }

  static getRawValues(){
    try{
      return Object.values( window.localStorage );
    }catch(e){
      console.log(`MEDB::getRawValues: ${e.message}`);
      return false;
    }
  }

  static clear(){
    try{
      window.localStorage.clear();
    }catch(e){
      console.log(`MEDB::clear: ${e.message}`);
    }
  }

}

if( typeof window !== 'undefined' )
  window.MEDB = MEDB;

if( typeof module !== 'undefined' )
  module.exports = MEDB;
