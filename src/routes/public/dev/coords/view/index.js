const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mRestaurants = await App.getModel('Restaurant').findAll({
        where:{
          // isVerified: true,
          // isKycCompleted: true,
          // isDeleted: false,
          // isRestricted: false,
        },
        attributes: ['id','name','lat','lon','shareableLink','isVerified','isDeleted','isRestricted','isKycCompleted'],
        order: [['id','desc']],
      });

      const mUsers = await App.getModel('User').findAll({
        attributes: ['id','firstName','lastName','email','phone','role'],
        where: {
          // isDeleted: false,
          // isRestricted: false,
        },
        order: [['id','desc']],
        distincs: true,
        include: [
          { 
            model: App.getModel('Client'),
            attributes: ['id'],
            include: [{ 
              model: App.getModel('DeliveryAddress'),
              // where: {isDeleted: false},
              attributes: ['id','label','street','lat','lon','description','isDefault','isOneTimeAddress'],
            }]
          },
          { 
            model: App.getModel('Courier'),
            // where: {
            //   isVerified: true,
            //   isKycCompleted: true,
            //   isDeleted: false,
            //   isRestricted: false,
            // },
            attributes: ['id','lat','lon','isVerified','isDeleted','isRestricted','isKycCompleted'],
          },
        ]
      });

      // App.json( res, true, App.t('success', res.lang), {
      //   restaurants: mRestaurants,
      //   users: mUsers,
      // });

      return await App.renderUI( res, 'dev-internal-set-all-coords', {
        title: 'Set Up all coords',
        header: App.t(['Set Up all coords'], req.lang,'<br/>'),
        // message: App.t(['Success message'], req.lang),
        // icon: { name: 'success', size: 100 },
        content: {
          partial: '/dev-internal-set-all-coords/set-all-coords',
          data: {
            data: {
              restaurants: mRestaurants,
              users: mUsers,
            },
          },
        },
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
