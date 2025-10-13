const express = require('express');
const router = express.Router();

// {
//   "onlyActive": "optional: [boolean]: default: false"
// }

// /private/admin/discount-codes/get/all/?offset=0&limit=15&order=asc&by=id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('DiscountCode').getOrderBy(by);
      const onlyActive = App.getBoolFromValue(data.onlyActive);

      const where = {
        ...(onlyActive?{isActive: true}:{}),
        isDeleted: false,
      };

      const mDiscountCodes = await App.getModel('DiscountCode').findAndCountAll({
        where,
        order: [[orderBy, order]],
        offset: offset,
        limit: limit,
      });

      App.json( res, true, App.t('success', res.lang), mDiscountCodes);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


