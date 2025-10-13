
// GET:
//    eg: req.sessionGet('User') // {id:12, ...}
//    or: req.sessionGet('non-existing-key'); // null

//SET:
//    eg: req.sessionSet('User', {id:12, ...});

// [SESSION-HELPER]
module.exports = function(req, res, next, App, helpenName=''){ 
  try{
    req.sessionGet = (name) => {
      if( !req.session.hasOwnProperty('store') ) req.session.store = {};
      return ( req.session.store[ name ] || null );
    }
    req.sessionSet = (name, val) => {
      if( !req.session.hasOwnProperty('store') ) req.session.store = {};
      req.session.store[ name ] = val;
    }

    return next();

  }catch(e){
    return next();
    console.error(` #express.helper: [${helpenName}]: ${e.message} `);
  }
}
