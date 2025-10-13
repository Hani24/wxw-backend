
// eg: req.getPost('password') // 'user-post-passwod-field'
// or: req.getPost(); // {password: 'user-post-passwod-field', email: 'email...'}
// or: req.getPost('non-existing-key'); // ''

// [POST-HELPER]
module.exports = function(req, res, next, App, helpenName=''){ 
  try{

    req.getPost = (key=false, defaultValue=null) => {
      // console.debug({getPost:{key, typeofBody: typeof req.body }});
      const data = Object.assign({}, req.body);

      if( !App.isObject(data) ) return data;
      if( !App.isString(key) ) return data;
      key = key.trim();
      return (data.hasOwnProperty(key) ? data[ key ] : data );
    }

    req.reqRequestMethod = () => {
      return req.method.trim().toUpperCase();
    } 

    req.isPost = () => {
      return req.reqRequestMethod() == 'POST';
    } 

    /*
    req.isAjax = () => {
      // XMLHttpRequest
      return req.headers['x-requested-with'].trim().toLowerCase() == 'xmlhttprequest';
    } 

    req.getApiKey = ()=>{
      return ( req.headers['x-api-key'] || req.getPost('x-api-key') || false );
    }
    */

    req.getHeader = ( header )=>{
      return (req.headers && req.headers[ header ]) 
        ? req.headers[ header ]
        : false;
    }

    req.getHeaders = ()=>{
      return req.headers || {};
    }

    req.isFileAvailable = ( fileTag )=>{

      // string with name: [***]
      const data = req.getPost();
      if( data && data[ fileTag ] ) return true;

      if( req.file && req.file[ fileTag ] && file[ fileTag ].originalname ) return true;

      if( Array.isArray(req.files) && req.files.length ){
        for( const file of req.files )
          if( 
            file && file.originalname && file.path 
            && 
            file.fieldname === fileTag
          ) return true;
      }

      return false;
    }

    req.moveFile = ( targetPath, fileTag, checkFileType, debug=false )=>{
      if( !req.isFileAvailable( fileTag ) ) return false;
      return App.multer.moveFile( req, targetPath, fileTag, checkFileType, debug );
      // return App.multer.moveFile( req, 'profileImgsRoot' );
    }

    return next();

  }catch(e){
    return next();
    console.error(` #express.helper: [${helpenName}]: ${e.message} `);
  }
}
