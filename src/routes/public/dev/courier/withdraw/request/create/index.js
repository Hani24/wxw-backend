const express = require('express');
const router = express.Router();

// /public/dev/courier/withdraw/request/create/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{


      const devAuthTokens = App.dev.api.getDevAuthTokens();
      App.dev.api.setAuthToken(devAuthTokens.courier.token);

      const profileRes = await App.dev.api.post('/private/courier/profile/get',{});
      if( !profileRes.success ){
        console.error(`#withdraw-request: ${profileRes.message}`);
        return await App.json(res, profileRes );
      }

      const {courier, user} = profileRes.data;
      const {id, balance} = courier;
      // return await App.json(res, true, 'success', {id, balance});

      const withdrawRequestRes = await App.dev.api.post('/private/courier/withdraw/requests/create/',{
        amount: 5.12
      });

      if( !withdrawRequestRes.success ){
        console.error(`#withdraw-request: ${withdrawRequestRes.message}`);
        return await App.json(res, withdrawRequestRes );
      }

      await App.json(res, withdrawRequestRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
