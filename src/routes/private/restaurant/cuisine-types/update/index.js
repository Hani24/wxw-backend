const express = require('express');
const router = express.Router();

// POST /private/restaurant/cuisine-types/update
// Updates the restaurant's cuisine type selections
// Expected body: { cuisineTypeIds: [1, 3, 5] }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        return App.json(res, false, App.t(['Restaurant not found'], req.lang));
      }

      // Get cuisine type IDs from request body
      const cuisineTypeIds = data.cuisineTypeIds || [];

      // Validate that cuisineTypeIds is an array
      if( !Array.isArray(cuisineTypeIds) ){
        return App.json(res, false, App.t(['Invalid cuisine type data'], req.lang));
      }

      // Convert to array of numbers and filter out invalid values
      const validCuisineIds = cuisineTypeIds
        .map(id => Math.floor(+id))
        .filter(id => App.isPosNumber(id));

      // Validate that at least one cuisine type is selected
      if( validCuisineIds.length === 0 ){
        return App.json(res, false, App.t(['Please select at least one cuisine type'], req.lang));
      }

      // Verify that all cuisine type IDs exist and are active
      const validCuisineTypes = await App.getModel('CuisineType').findAll({
        where: {
          id: validCuisineIds,
          isActive: true,
        },
        attributes: ['id'],
      });

      if( validCuisineTypes.length !== validCuisineIds.length ){
        return App.json(res, false, App.t(['One or more selected cuisine types are invalid'], req.lang));
      }

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        // First, remove all existing cuisine type associations for this restaurant
        await App.DB.sequelize.query(
          `DELETE FROM RestaurantCuisines WHERE restaurantId = ?`,
          {
            replacements: [mRestaurant.id],
            transaction: tx,
          }
        );

        // Then, insert the new cuisine type associations
        const insertData = validCuisineIds.map(cuisineTypeId => ({
          restaurantId: mRestaurant.id,
          cuisineTypeId: cuisineTypeId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await App.DB.sequelize.getQueryInterface().bulkInsert(
          'RestaurantCuisines',
          insertData,
          { transaction: tx }
        );

        await tx.commit();

        // Fetch the updated cuisine types to return to the client
        const updatedCuisineTypes = await App.getModel('CuisineType').findAll({
          where: {
            id: validCuisineIds,
            isActive: true,
          },
          attributes: ['id', 'name', 'slug', 'description', 'image', 'order'],
          order: [['order', 'ASC'], ['name', 'ASC']],
        });

        const formattedCuisineTypes = updatedCuisineTypes.map(ct => ({
          id: ct.id,
          name: ct.name,
          slug: ct.slug,
          description: ct.description,
          image: ct.image || '',
          order: ct.order,
        }));

        return App.json(res, true, App.t(['Cuisine types updated successfully'], req.lang), {
          cuisineTypes: formattedCuisineTypes,
          total: formattedCuisineTypes.length,
          restaurantId: mRestaurant.id,
        });

      }catch(e){
        await tx.rollback();
        console.error('Transaction failed:', e);
        return App.json(res, false, App.t(['Failed to update cuisine types'], req.lang));
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};
