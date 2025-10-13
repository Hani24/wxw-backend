const express = require('express');
const router = express.Router();


module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // https://api.morris-armstrong-ii-dev.ru/public/share/restaurant/by/id/1
      // https://api.morris-armstrong-ii-dev.ru/public/share/restaurant/by/id/2
      // https://api.morris-armstrong-ii-dev.ru/public/share/restaurant/by/id/3

      const data = req.getPost();
      const mUser = await req.user;

      const id = req.getCommonDataInt('id', null);

      const mRestaurant = await App.getModel('Restaurant').findOne({
        where: {id},
        attributes: [
          'id','name','image','isOpen','description',
          'phone','email', 
          'zip','street','rating','type','lat','lon',
          'shareableLink',
        ],
        include: [
          {
            model: App.getModel('City'),
            attributes: ['id','name']
          }
        ]
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        return await App.renderUI( res, 'message.no-top-bar', {
          header: App.t(['Restaurant','not-found'],req.lang),
          message: App.t(['restaurant','id',`[${id}]`,'not-found'],req.lang),
        });
      }

      const mRestaurantWorkingTime = await App.getModel('RestaurantWorkingTime')
        .getAsObjectByRestaurantId( mRestaurant.id ); 


      return await App.renderUI( res, 'share', {
        ogWebsite: `${App.getEnv('WEBSITE')}`,
        ogTitle: `Restaurant: ${mRestaurant.name}`,
        ogUrl: ``,
        ogImage: mRestaurant.image,
        ogDescription: mRestaurant.description,
        content: {
          partial: '/share/restaurant',
          data: {
            data: {
              restaurant: mRestaurant,
              workingTime: mRestaurantWorkingTime,
              ios: {
                storeIcon: App.toAppPath( 'ios', 'apple.storeIcon', mRestaurant.id, false ),
                'open-restaurant': App.toAppPath( 'ios', 'public.open-restaurant', mRestaurant.id, false ),
                appLink: App.toAppPath( 'ios', 'apple.appLink', App.getEnv('APPLE_APP_STORE_ID'), false )
              },
              android: {
                storeIcon: App.toAppPath( 'android', 'google.storeIcon', mRestaurant.id, false ),
                'open-restaurant': App.toAppPath( 'android', 'public.open-restaurant', mRestaurant.id, false ),
                appLink: App.toAppPath( 'android', 'google.appLink', App.getEnv('GOOGLE_APP_STORE_ID'), false )
              }
            }
          }
        },
        ...(mRestaurant.toJSON()),
        isOpen: App.t([ mRestaurant.isOpen ? 'yes': 'no' ],'req.lang'),
      });        

      // return await App.renderUI( res, 'message', {
      //   header: App.t(['Error <title>'], req.lang),
      //   message: App.t(['Error','<message>'], req.lang),
      //   icon: { name: 'error', size: 100 },
      // });        

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


