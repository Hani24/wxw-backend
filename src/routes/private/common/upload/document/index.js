const express = require('express');
const router = express.Router();


module.exports = function(App, RPath){

  router.use('', App.multer.upload.tmp.any(), async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const uploadRes = await App.S3.moveUploadedFile( req, 'document', mUser );
      // console.json({ uploadRes });
      // uploadRes.data.fileName
      if( !uploadRes.success )
        return App.json(res, 417, App.t( uploadRes.message, req.lang) );

      App.json(res, true, App.t(['success'],req.lang), {
        ...uploadRes.data.toJSON(),
        fileName: App.S3.getUrlByName(uploadRes.data.fileName),
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


