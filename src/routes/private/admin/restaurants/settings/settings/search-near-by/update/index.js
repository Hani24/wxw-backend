const express = require('express');
const router = express.Router();

// {
//   "unitType": "required: ENUM: <string>: [ kilometer, mile, feet, meter ] => /private/admin/delivery/price-settings/units/get/",
//   "maxSearchRadius": "required: <float:unsigned>"
// }

// {
//   "unitType": "mile",
//   "maxSearchRadius": 15
// }

// /private/admin/restaurants/settings/settings/search-near-by/update/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mSearchNearByClientSettings = await App.getModel('SearchNearByClientSettings').getSettings(!!'only-view');
      if( !App.isObject(mSearchNearByClientSettings) || !App.isPosNumber(mSearchNearByClientSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','delivery','price','settings'], res.lang), );

      const units = App.getModel('SearchNearByClientSettings').getUnits({asArray: true});

      const settings_t = {
        maxSearchRadius: App.getPosNumber( req.getCommonDataFloat('maxSearchRadius', mSearchNearByClientSettings.maxSearchRadius || 15),{toFixed: 2} ),
        unitType: req.getCommonDataString('unitType', mSearchNearByClientSettings.unitType),
      };

      if( !units.includes(settings_t.unitType) )
        return App.json( res, 417, App.t(['provided','unit','type','is-not','supported'], res.lang), {units} );

      const updateSettings = await mSearchNearByClientSettings.update( settings_t );
      if( !App.isObject(updateSettings) || !App.isPosNumber(updateSettings.id) )
        return App.json( res, false, App.t(['failed-to','update','delivery','price','settings'], res.lang), );

      const updateRes = await App.getModel('SearchNearByClientSettings').setMaxSearchRadius( settings_t.maxSearchRadius );
      if( !updateRes.success ){
        console.json({updateRes});
        return await App.json( res, updateRes );
      }

      const viewSettings = await App.getModel('SearchNearByClientSettings').getSettings(!!'only-view');
      await App.json( res, true, App.t('success',req.lang), viewSettings);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


