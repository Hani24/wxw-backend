const express = require('express');
const router = express.Router();

// /public/common/system/genders/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{
    try{

      const data_t = App.getModel('User').getGenders({asArray: true});
      App.json( res, true, App.t('success', res.lang), data_t);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }
  });

  return { router, method: '', autoDoc:{} };

};


