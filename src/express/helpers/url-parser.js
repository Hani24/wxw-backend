
// if URL => /some/pah/some/value/age/43/name/Tom/page/23/show-info/true/show-page/

// req.getBool('show-info') >> true
// req.getBool('show-page') >> false
// req.getParam('age') >> "43" || null
// req.getInt('age') >> 43 || null
// req.getParam('page') >> "23" || null

// [URL-PARSER-HELPER]
module.exports = function(req, res, next, App, helpenName=''){ 

  try{
    const path = (''+req.path.trim()).split('/');

    req.getParam = (key)=>{
      if( !App.isString(key) ) return null;
      const keyIndex = path.indexOf(key);
      if( keyIndex != -1 && path[ keyIndex +1 ] )
        return (decodeURIComponent(''+path[ keyIndex +1 ])).trim();
      return null;
    };

    // fast-types
    req.getInt = (key, defaultValue=null)=>{
      const v = req.getParam(key);
      return ( ! App.isNull(v)) ? parseInt(v) : defaultValue;
    };

    req.getFloat = (key, defaultValue=null)=>{
      const v = req.getParam(key);
      return ( ! App.isNull(v)) ? parseFloat(v) : defaultValue;
    };

    req.getString = (key, defaultValue=null)=>{
      const v = req.getParam(key);
      return ( ! App.isNull(v) && v.length ) ? v : defaultValue;
    };

    req.getBool = (key, defaultValue=null)=>{
      const v = req.getString(key);
      return ( ! App.isNull(v)) 
        ? (v.toLowerCase() == 'true' || v == '1' ? true : false )
        : defaultValue;
    };

    req.getCommonDataInt = (key, defaultValue=false)=>{
      try{
        // const _postValue = req.getPost(key);
        const _getValue = req.getInt(key);
        const data = req.getPost();
        // console.json({getCommonDataInt: {data, _getValue} });
        // post.id || get(/url/id/:id)
        const value = App.isObject(data) && data.hasOwnProperty(key) && App.isNumber( +data[ key ] ) 
          ? Math.floor((+data[ key ]))
          : App.isNumber(_getValue)
            ? _getValue
            : defaultValue;
        return value;
      }catch(e){
        console.error(` req.getCommonDataInt: key: [${key}] ${e.message}`);
        return defaultValue;
      }
    }

    req.getCommonDataFloat = (key, defaultValue=false)=>{
      try{
        // const _postValue = req.getPost(key);
        const _getValue = req.getFloat(key);
        const data = req.getPost() || {};
        // post.id || get(/url/id/:id)
        const value = App.isObject(data) && data.hasOwnProperty(key) && App.isNumber( +data[ key ] ) 
          ? parseFloat(+data[ key ])
          : App.isNumber(_getValue)
            ? _getValue
            : defaultValue;

        return value;
      }catch(e){
        console.error(` req.getCommonDataFloat: ${e.message}`);
        return defaultValue;
      }
    }

    req.getCommonDataString = (key, defaultValue='')=>{
      try{
        // const _postValue = req.getPost(key);
        const _getValue = req.getString(key);
        const data = req.getPost() || {};
        // post.id || get(/url/id/:id)
        const value = App.isObject(data) && data.hasOwnProperty(key) && App.isString( data[ key ] ) 
          ? (data[ key ].trim())
          : App.isString(_getValue)
            ? _getValue
            : defaultValue;
        return value;
      }catch(e){
        console.error(` req.getCommonDataString: ${e.message}`);
        return defaultValue;
      }
    }

    return next();

  }catch(e){
    return next();
    console.error(` #express.helper: [${helpenName}]: ${e.message} `);
  }
}
