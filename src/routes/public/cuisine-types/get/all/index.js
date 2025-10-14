const express = require('express');
const router = express.Router();

// POST /public/cuisine-types/get/all
// Returns all active cuisine types for restaurant selection

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const cuisineTypes = await App.getModel('CuisineType').findAll({
        where: {
          isActive: true,
        },
        attributes: ['id', 'name', 'slug', 'description', 'image', 'order'],
        order: [['order', 'ASC'], ['name', 'ASC']],
      });

      if( !cuisineTypes || !cuisineTypes.length ){
        return App.json(res, false, App.t(['No cuisine types available'], req.lang));
      }

      const formattedCuisineTypes = cuisineTypes.map(ct => ({
        id: ct.id,
        name: ct.name,
        slug: ct.slug,
        description: ct.description,
        image: ct.image || '',
        order: ct.order,
      }));

      return App.json(res, true, App.t(['success'], req.lang), {
        cuisineTypes: formattedCuisineTypes,
        total: formattedCuisineTypes.length,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: '', autoDoc:{} };

};
