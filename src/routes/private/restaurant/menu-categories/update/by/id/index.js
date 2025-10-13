const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. MenuCategory.id",
  "name": "optional: <string>",
  "description": "optional: <string>",
  "order": "optional: <number>: default: next-index"
}

{
  "id": 1,
  "name": "KFC",
  "description": "Some info",
  "order": 2
}

*/

// /private/restaurant/menu-categories/update/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Menu-Category','id','is-required'], req.lang) );

      const mMenuCategory = await App.getModel('MenuCategory').getByFields({
        id,
        restaurantId: mRestaurant.id,
      });

      if( !App.isObject(mMenuCategory) || !App.isPosNumber(mMenuCategory.id) )
        return App.json( res, 404, App.t(['Menu-Category','id','not-found'], req.lang) );

      const maxNameLength = App.getModel('MenuCategory').getValidLengthOf('name');
      const maxDescriptionLength = App.getModel('MenuCategory').getValidLengthOf('description');

      const menuCategory_t = {
        name: App.tools.stripSpecialChars( req.getCommonDataString('name', mMenuCategory.name)),
        description: '', // App.tools.stripSpecialChars( req.getCommonDataString('description', mMenuCategory.description)),
        order: req.getCommonDataInt('order', null) || mMenuCategory.order,
      };

      if( !menuCategory_t.name || menuCategory_t.name.length < 2 || menuCategory_t.name.length > maxNameLength )
        return App.json( res, 417, App.t(['Menu-Category','name','must-be','between','2','and',maxNameLength,'characters','long'], req.lang) );

      // this is not an option in UI at the moment
      // if( !menuCategory_t.description || menuCategory_t.description.length < 2 || menuCategory_t.description.length > maxDescriptionLength )
      //   return App.json( res, 417, App.t(['Menu-Category','description','must-be','between','2','and',maxDescriptionLength,'characters','long'], req.lang) );

      const isset = await App.getModel('MenuCategory').isset({
        restaurantId: mRestaurant.id, 
        name: menuCategory_t.name,
        id: { [ App.DB.Op.not ]: mMenuCategory.id },
        isDeleted: false,
      });

      if( isset )
        return App.json( res, 417, App.t(['Menu-Category','with','name',`[${menuCategory_t.name}]`,'already','exists'], req.lang) );

      const updateRes = await mMenuCategory.update( menuCategory_t );
      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','Menu-Category'], req.lang) );

      App.json( res, true, App.t('success', res.lang), updateRes);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


