const express = require('express');
const router = express.Router();

/*
{
  "menuCategoryId": "required: <number> Ref. MenuCategory.id",
  "image": "required: <file:image/png>",
  "name": "required: <string>",
  "description": "optional: <string> default: '' ",
  "kcal": "optional: <number> default: 0",
  "proteins": "optional: <number> default: 0",
  "fats": "optional: <number> default: 0",
  "carbs": "optional: <number> default: 0",
  "price": "required: <float>",
  "isAvailable": "required: <boolean> [true | false]",
}
*/

// /private/restaurant/menu-items/create/

module.exports = function(App, RPath){

  router.use('', App.multer.upload.tmp.any(), async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const uploadRes = await App.S3.moveUploadedFile( req, 'image', mUser );
      if( !uploadRes.success )
        return App.json(res, 417, App.t( uploadRes.message, req.lang) );

      const menuItem_t = {
        restaurantId: mRestaurant.id,
        menuCategoryId: req.getCommonDataInt('menuCategoryId', null),
        image: uploadRes.data.fileName,
        name: App.tools.stripSpecialChars( req.getCommonDataString('name', '')),
        description: App.tools.stripSpecialChars( req.getCommonDataString('description', '')),
        // kcal: Math.floor( +req.getCommonDataInt('kcal', 0) ),
        // proteins: Math.floor( +req.getCommonDataInt('proteins', 0) ),
        // fats: Math.floor( +req.getCommonDataInt('fats', 0) ),
        // carbs: Math.floor( +req.getCommonDataInt('carbs', 0) ),
        price: App.isPosNumber( +(+data.price).toFixed(2) ) ? +(+data.price).toFixed(2) : null, 
        // updated: 2022-jun-20
        // https://interexy-com.atlassian.net/browse/MAI-882
        // Restaurant > Menu Manager: Items should have Available status once created. Currently they are "sold out".
        isAvailable: true, // => App.getBoolFromValue( req.getCommonDataString('isAvailable',false) ),
      };

      for( const mKey of Object.keys(menuItem_t) )
        if( App.isNull(menuItem_t[ mKey ]) )
          return App.json( res, 417, App.t(['field',`[${mKey}]`,'is-required'], req.lang));

      // added: 08-jul-2022: fields can be "unset == null" and will be hidden in mobile app
      for( const mKey of ['kcal','proteins','fats','carbs'] )
        // data is send via form-data, null => ['null' || '']
        menuItem_t[ mKey ] = App.isNull(data[ mKey ]) || data[ mKey ] === 'null' || data[ mKey ] === ''
          ? null
          : App.getNumber(data[ mKey ],{floor:true,abs:true});

      const issetMenuCategory = await App.getModel('MenuCategory').isset({
        restaurantId: mRestaurant.id,
        id: menuItem_t.menuCategoryId,
        isDeleted: false,
      });

      if( !issetMenuCategory )
        return App.json( res, 404, App.t(['Menu-Category','not','found'], req.lang));

      const maxNameLength = App.getModel('MenuItem').getValidLengthOf('name');
      const maxDescriptionLength = App.getModel('MenuItem').getValidLengthOf('description');

      if( !menuItem_t.name || menuItem_t.name.length < 2 || menuItem_t.name.length > maxNameLength )
        return App.json( res, 417, App.t(['Menu-Item','name','must-be','between','2','and',maxNameLength,'characters','long'], req.lang) );

      // this is not an option in UI at the moment
      if( menuItem_t.description.length > maxDescriptionLength )
        return App.json( res, 417, App.t(['Menu-Item','description','must-be','between','0','and',maxDescriptionLength,'characters','long'], req.lang) );

      const issetMenuItem = await App.getModel('MenuItem').isset({
        restaurantId: mRestaurant.id, 
        name: menuItem_t.name,
        menuCategoryId: menuItem_t.menuCategoryId,
        isDeleted: false,
        // id: { [ App.DB.Op.not ]: mMenuItem.id }
      });

      if( issetMenuItem )
        return App.json( res, 417, App.t(['Menu-Item','with','name',`[${menuItem_t.name}]`,'already','exists'], req.lang) );

      const mMenuItem = await App.getModel('MenuItem').create( menuItem_t );
      if( !App.isObject(mMenuItem) || !App.isPosNumber(mMenuItem.id) )
        return App.json( res, false, App.t(['failed-to','create','Menu-Item'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mMenuItem);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


