const express = require('express');
const router = express.Router();

// {
//   "search": "required: <string>: e.g.: kfc"
// }

// /private/admin/statistics/global/find/restaurant/by/name

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user; // admin
      // const mRestaurant = await req.restaurant; // => global resto admin panel (if selected)
      const search = req.getCommonDataString('search', null);

      if( !App.isString(search) )
        return App.json( res, 417, App.t(['search','is-required'], res.lang))

      const mResto = await App.getModel('Restaurant').findOne({
        where: {
          [ App.DB.Op.or ] : {
            name: { [ App.DB.Op.like ]: `%${App.tools.stripSpecialChars(search)}%` },
            timezone: { [ App.DB.Op.like ]: `%${App.tools.stripSpecialChars(search)}%` },
            street: { [ App.DB.Op.like ]: `%${App.tools.stripSpecialChars(search)}%` },
          }
        },
        attributes: [
          'id','name','timezone','street','zip',
          // 'phone','email'
          // 'image',
        ]
      });

      if( !App.isObject(mResto) || !App.isPosNumber(mResto.id) )
        return App.json( res, 404, App.t(['restaurant','not-found'], res.lang));

      const timezone = (''+mResto.timezone.split('/').pop()).replace('_',' ');
      App.json( res, true, App.t(['success'], res.lang), {
        id: mResto.id,
        // image: mResto.image,
        name: `${ App.tools.ucFirst(mResto.name) } - ${timezone} - ${mResto.street} ${mResto.zip}`,
        timezone: mResto.timezone,
        street: mResto.street,
        zip: mResto.zip,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


