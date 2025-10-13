const express = require('express');
const router = express.Router();

// /private/restaurant/menu-categories/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('MenuCategory').getOrderBy(by);

      const mMenuCategories = await App.getModel('MenuCategory').findAndCountAll({
        where: {
          restaurantId: mRestaurant.id,
          isDeleted: false,
        },
        distinct: true,
        attributes: ['id','name','description','order','createdAt'],
        include: [{
          model: App.getModel('MenuItem'),
          required: false,
          attributes: [
            'id','image','name','description','order',
            'kcal','proteins','fats','carbs','price','rating',
            'order','isAvailable','createdAt',
          ],
          where: {
            isDeleted: false,
            // isAvailable: true
          },
          // order: [['order','asc']],
        }],
        order: [[ 'order', 'asc' ]],
        offset: offset,
        limit: limit,
        // order: [[ orderBy, order ]],
        // offset: offset,
        // limit: limit,
      });

      // fix menu-items sorting
      mMenuCategories.rows = (App.isArray(mMenuCategories.rows) ? mMenuCategories.rows : [])
        .map((MenuCategory)=>{
          MenuCategory.MenuItems.dataValues = MenuCategory.MenuItems
            .sort((a, b)=>{
              return ((a.order>b.order)?1:-1)
            });
          return MenuCategory;
        });

      App.json( res, true, App.t('success', res.lang), mMenuCategories);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


