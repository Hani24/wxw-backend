const express = require('express');
const router = express.Router();

// {
//   "unitType": "required: ENUM: <string>: [ kilometer, mile, feet, meter ] => /private/admin/delivery/price-settings/units/get/",
//   "unitPrice": "required: <float:unsigned>",
//   "maxSearchRadius": "required: <float:unsigned>",
//   "baseFee": "require: <float:unsigned>",
//   "serviceFeePercent": "require: <float:unsigned>",
//   "deliveryPerUnitFeePercent": "require: <float:unsigned>"
// }

// {
//   "unitType": "mile",
//   "unitPrice": 0.50,
//   "maxSearchRadius": 15,
//   "baseFee": 3.99,
//   "serviceFeePercent": 15.0,
//   "deliveryPerUnitFeePercent": 2.0
// }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();

      if( !App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','delivery','price','settings'], res.lang), );

      const units = App.getModel('DeliveryPriceSettings').getUnits({asArray: true});

      const settings_t = {
        unitPrice: App.getNumber( req.getCommonDataFloat('unitPrice', 0),{toFixed: 2, abs: true} ),
        baseFee: App.getNumber( req.getCommonDataFloat('baseFee', 0),{toFixed: 2, abs: true} ),
        maxSearchRadius: App.getNumber( req.getCommonDataFloat('maxSearchRadius', 0),{toFixed: 2, abs: true} ),
        unitType: req.getCommonDataString('unitType', mDeliveryPriceSettings.unitType),
        serviceFeePercent: App.getNumber( req.getCommonDataFloat('serviceFeePercent', ),{toFixed: 2, abs: true} ),
        deliveryPerUnitFeePercent: App.getNumber( req.getCommonDataFloat('deliveryPerUnitFeePercent', ),{toFixed: 2, abs: true} ),
      };

      settings_t.serviceFeePercent = App.constrainNumber( settings_t.serviceFeePercent, 0, 100 );
      settings_t.deliveryPerUnitFeePercent = App.constrainNumber( settings_t.deliveryPerUnitFeePercent, 0, 100 );

      if( !units.includes(settings_t.unitType) )
        return App.json( res, 417, App.t(['provided','unit','type','is-not','supported'], res.lang), {units} );

      const updateSettings = await mDeliveryPriceSettings.update( settings_t );
      if( !App.isObject(updateSettings) || !App.isPosNumber(updateSettings.id) )
        return App.json( res, false, App.t(['failed-to','update','delivery','price','settings'], res.lang), );

      const updateRes = await App.getModel('DeliveryPriceSettings').setMaxSearchRadius( settings_t.maxSearchRadius );
      if( !updateRes.success ){
        console.error(`DeliveryPriceSettings: update: ${updateRes.message}`);
        console.json({uploadRes});
      }

      await App.json( res, updateRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


