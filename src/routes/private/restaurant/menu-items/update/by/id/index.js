const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. MenuItem.id",
  "image": "optional: <file:image/png>",
  "name": "optional: <string>",
  "description": "optional: <string>",
  "kcal": "optional: <number>",
  "proteins": "optional: <number>",
  "fats": "optional: <number>",
  "carbs": "optional: <number>",
  "price": "optional: <float>",
  "isAvailable": "optional: <boolean> true | false",
  "order": "optional: <number>"
}
*/

// /private/restaurant/menu-items/update/by/id/

module.exports = function(App, RPath){

  router.use('', App.multer.upload.tmp.any(), async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Menu-Item','id','is-required'], req.lang) );

      const mMenuItem = await App.getModel('MenuItem').getByFields({
        id,
        restaurantId: mRestaurant.id,
      });

      if( !App.isObject(mMenuItem) || !App.isPosNumber(mMenuItem.id) )
        return App.json( res, 404, App.t(['Menu-Item','id','not-found'], req.lang) );

      const menuItem_t = {
        // menuCategoryId: req.getCommonDataInt('menuCategoryId', mMenuItem.menuCategoryId),
        // image: mMenuItem.image,
        name: App.tools.stripSpecialChars( req.getCommonDataString('name', mMenuItem.name)),
        description: App.tools.stripSpecialChars( req.getCommonDataString('description', ''/*mMenuItem.description*/)),
        // kcal: Math.floor( +req.getCommonDataInt('kcal', 0/*mMenuItem.kcal*/) ),
        // proteins: Math.floor( +req.getCommonDataInt('proteins', 0/*mMenuItem.proteins*/) ),
        // fats: Math.floor( +req.getCommonDataInt('fats', 0/*mMenuItem.fats*/) ),
        // carbs: Math.floor( +req.getCommonDataInt('carbs', 0/*mMenuItem.carbs*/) ),
        price: App.isPosNumber( +(+data.price).toFixed(2) ) ? +(+data.price).toFixed(2) : mMenuItem.price, 
        // isAvailable: mMenuItem.isAvailable,
      };

      if( App.isNumber( +data.order ) )
        menuItem_t.order = App.getNumber( +data.order, {floor: true, abs: true} );

      if( App.isBoolean( data.isAvailable ) || App.isString( data.isAvailable ) )
        menuItem_t.isAvailable = App.getBoolFromValue( data.isAvailable );

      if( req.isFileAvailable('image') ){
        const uploadRes = await App.S3.moveUploadedFile( req, 'image', mUser );
        if( !uploadRes.success ){
          // return App.json(res, 417, App.t( uploadRes.message, req.lang) );
          console.error(uploadRes.message);
        }else{
          menuItem_t.image = uploadRes.data.fileName;
        }
      }

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
        id: mMenuItem.menuCategoryId,
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
        menuCategoryId: mMenuItem.menuCategoryId,
        id: { [ App.DB.Op.not ]: mMenuItem.id },
        isDeleted: false,
      });

      if( issetMenuItem )
        return App.json( res, 417, App.t(['Menu-Item','with','name',`[${menuItem_t.name}]`,'already','exists'], req.lang) );

      const updateRes = await mMenuItem.update( menuItem_t );
      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','Menu-Item'], req.lang) );

      App.json( res, true, App.t('success', res.lang), {
        id: updateRes.id,
        image: updateRes.image,
        name: updateRes.name,
        description: updateRes.description,
        kcal: updateRes.kcal,
        proteins: updateRes.proteins,
        fats: updateRes.fats,
        carbs: updateRes.carbs,
        price: updateRes.price,
        rating: updateRes.rating,
        isAvailable: updateRes.isAvailable,
        image: updateRes.image,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


