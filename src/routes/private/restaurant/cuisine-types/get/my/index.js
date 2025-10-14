const express = require('express');
const router = express.Router();

// POST /private/restaurant/cuisine-types/get/my
// Returns the current restaurant's selected cuisine types

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        return App.json(res, false, App.t(['Restaurant not found'], req.lang));
      }

      // Get restaurant's cuisine types via the junction table
      const cuisineTypes = await App.getModel('CuisineType').findAll({
        attributes: ['id', 'name', 'slug', 'description', 'image', 'order'],
        include: [{
          model: App.getModel('Restaurant'),
          where: { id: mRestaurant.id },
          through: { attributes: [] }, // Exclude junction table fields
          attributes: [], // Don't include restaurant data
          required: true,
        }],
        where: {
          isActive: true,
        },
        order: [['order', 'ASC'], ['name', 'ASC']],
      });

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
        restaurantId: mRestaurant.id,
        restaurantName: mRestaurant.name,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};
