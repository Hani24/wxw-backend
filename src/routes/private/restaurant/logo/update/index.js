const express = require('express');
const router = express.Router();

// /routes/private/restaurant/logo/update/

module.exports = function(App, RPath){

  router.use('', App.multer.upload.form.any(), async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const uploadRes = await App.S3.moveUploadedFile( req, 'image', mUser );
      if( !uploadRes.success )
        return App.json(res, 417, App.t( uploadRes.message, req.lang) );

      const updateRes = await mRestaurant.update({image: uploadRes.data.fileName});
      if( !App.isObject(updateRes) )
        return App.json(res, 417, App.t(['failed-to','update','image'], req.lang) );

      App.json(res, true, App.t(['success'],req.lang), {
        image: updateRes.image,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


