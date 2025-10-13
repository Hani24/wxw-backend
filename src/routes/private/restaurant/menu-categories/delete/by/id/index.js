const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. MenuItem.id"
}

{
  "id": 1
}

*/

// /private/restaurant/menu-categories/delete/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Menu-Category','id','is-required'], req.lang) );

      const mMenuCategory = await App.getModel('MenuCategory').getByFields({
        id,
        restaurantId: mRestaurant.id,
        isDeleted: false,
      });

      if( !App.isObject(mMenuCategory) || !App.isPosNumber(mMenuCategory.id) )
        return App.json( res, 404, App.t(['Menu-Category','id','not-found'], req.lang) );

      const menuItemIds = (await App.getModel('MenuItem').findAll({
        where: {
          menuCategoryId: mMenuCategory.id,
          isDeleted: false,
        },
        attributes: ['id']
      }))
        .map((mMenuItem)=>((+mMenuItem.id)));

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateMenuCategory = await mMenuCategory.update({
          isDeleted: true,
          deletedAt: App.getISODate(),
        }, {transaction: tx});

        if( !App.isObject(updateMenuCategory) || !App.isPosNumber(updateMenuCategory.id) )
          throw Error('failed update menu-category');

        const updateMenuItems = await App.getModel('MenuItem').update(
          {
            isDeleted: true,
            deletedAt: App.getISODate(),
          }, 
          { 
            where: { 
              menuCategoryId: mMenuCategory.id,
              isDeleted: false,
            },
            transaction: tx,
          },
        );

        // can be zero-size array, but must be valid array
        if( !App.isArray(updateMenuItems) )
          throw Error('failed update menu-items');

        await App.getModel('FavoriteMenuItem').destroy({
          where: {
            // menuItemId: { [App.DB.Op.in]: menuItemIds },
            menuItemId: menuItemIds,
          }
        });

        await tx.commit();

      }catch(e){
        await tx.rollback();
        return App.json( res, false, App.t(['failed-to','delete','Menu-Category'], req.lang) );
      }

      App.json( res, true, App.t(['deleted','successfully'], res.lang), {});

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


