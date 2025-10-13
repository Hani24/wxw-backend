const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. MenuCategory.id",
}
*/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['menu','category','id','is-required'], req.lang) );

      const isset = await App.getModel('MenuCategory').isset({
        id,
        restaurantId: mRestaurant.id,
        isDeleted: false,
      });

      if( !isset )
        return App.json( res, 404, App.t(['menu','category','not-found'], req.lang) );

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('MenuCategory').getOrderBy(by);

      const mMenuCategory = await App.getModel('MenuCategory').findOne({
        where: {
          id,
          restaurantId: mRestaurant.id,
          isDeleted: false,
        },
        attributes: ['id','name','description','order','isDeleted'],
        distinct: true,
        include: [{
          required: true,
          model: App.getModel('MenuItem'),
          where: {
            isDeleted: false,
          },
          attributes: [
            'id','image','name','description','kcal','proteins','fats',
            'carbs','price','rating','isAvailable', 'updatedAt'
          ],
          order: [[ orderBy, order ]],
          offset: offset,
          limit: limit,
        }]
      });

      if( !App.isObject(mMenuCategory) || !App.isPosNumber(mMenuCategory.id) )
        return await App.json( res, 404, App.t(['menu','category','not-found'], res.lang), {});

      // for( const mMenuItem of mMenuCategory.MenuItems ){
      //   if( App.isObject(mMenuItem) && mMenuItem.image ){
      //     mMenuItem.image = App.S3.getUrlByName(mMenuItem.image);
      //   }
      // }

      App.json( res, true, App.t('success', res.lang), mMenuCategory);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


