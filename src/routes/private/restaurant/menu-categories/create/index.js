const express = require('express');
const router = express.Router();

/*
{
  "name": "required: <string>",
  "description": "optional: <string>",
  "order": "optional: <number>: default: next-index"
}

{
  "name": "KFC",
  "description": "Some info",
  "order": "optional: <number>: default: next-index"
}

*/

// /private/restaurant/menu-categories/create/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const menuCategory_t = {
        restaurantId: mRestaurant.id,
        name: App.tools.stripSpecialChars( req.getCommonDataString('name', '')),
        description: '', // App.tools.stripSpecialChars( req.getCommonDataString('description', '')),
        order: App.getNumber( req.getCommonDataInt('order', 0), {abs:true} ),
      };

      if( !App.isNumber(menuCategory_t.order) ){
        menuCategory_t.order = (await App.getModel('MenuCategory')
          .getTotalWhere({ restaurantId: mRestaurant.id }));
      }

      const maxNameLength = App.getModel('MenuCategory').getValidLengthOf('name');
      const maxDescriptionLength = App.getModel('MenuCategory').getValidLengthOf('description');

      if( !menuCategory_t.name || menuCategory_t.name.length < 2 || menuCategory_t.name.length > maxNameLength )
        return App.json( res, 417, App.t(['Menu-Category','name','must-be','between','2','and',maxNameLength,'characters','long'], req.lang) );

      // this is not an option in UI at the moment
      // if( !menuCategory_t.description || menuCategory_t.description.length < 2 || menuCategory_t.description.length > maxDescriptionLength )
      //   return App.json( res, 417, App.t(['Menu-Category','description','must-be','between','2','and',maxDescriptionLength,'characters','long'], req.lang) );

      const isset = await App.getModel('MenuCategory').isset({
        restaurantId: mRestaurant.id, 
        name: menuCategory_t.name,
        isDeleted: false,
        // id: { [ App.DB.Op.not ]: mMenuCategory.id }
      });

      if( isset )
        return App.json( res, 417, App.t(['Menu-Category','with','name',`[${menuCategory_t.name}]`,'already','exists'], req.lang) );

      const mMenuCategory = await App.getModel('MenuCategory').create( menuCategory_t );
      if( !App.isObject(mMenuCategory) || !App.isPosNumber(mMenuCategory.id) )
        return App.json( res, false, App.t(['failed-to','create','Menu-Category'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mMenuCategory);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


