const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. PaymentCard.id"
}

{
  "id": 1
}
*/

// /private/client/payment-cards/delete/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const id = req.getCommonDataInt('id', null);
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Payment-Card','id','is-required'], res.lang));

      const mPaymentCard = await App.getModel('PaymentCard').findOne({
        where: {
          id,
          clientId: mClient.id,
          isOneTimeCard: false,
          isDeleted: false,
        }
      });

      if( !App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id) )
        return App.json( res, 404, App.t(['Payment-Card','not','found'], res.lang) );

      const updateRes = await mPaymentCard.update({
        isDeleted: true,
        deletedAt: App.getISODate(),
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','delete','Payment-Card'], res.lang) );

      // const destroyRes = await mPaymentCard.destroy();
      // if( !App.isObject(destroyRes) || !App.isPosNumber(destroyRes.id) )
      //   return App.json( res, false, App.t(['failed-to','delete','Payment-Card'], res.lang) );

      await App.json( res, true, App.t('success', res.lang) );

      // [post-processing]
      if( mPaymentCard.isDefault ){

        const paymentTypes = App.getModel('OrderPaymentType').getTypes();
        const mClientPaymentSettings = await App.getModel('ClientPaymentSettings')
          .getByClientId( mClient.id );

        // find next/latest added payment-card && set it as default
        const mNextPaymentCard = await App.getModel('PaymentCard').findOne({
          where: {
            clientId: mClient.id,
            isOneTimeCard: false,
            isDeleted: false,
          },
          order: [['id','desc']]
        });

        console.json({mNextPaymentCard});

        if( App.isObject(mClientPaymentSettings) && App.isPosNumber(mClientPaymentSettings.id) ){

          if( App.isObject(mNextPaymentCard) && App.isPosNumber(mNextPaymentCard.id) ){

            const updateNextAsDefault = await mNextPaymentCard.update({
              isDefault: true,
            });

            if( App.isObject(updateNextAsDefault) && App.isPosNumber(updateNextAsDefault.id) ){
              if(
                mClientPaymentSettings.type === paymentTypes.Card 
                && App.isPosNumber( mClientPaymentSettings.paymentCardId )
              ){
                await mClientPaymentSettings.update({ paymentCardId: mNextPaymentCard.id });
              }              
            }else{
              console.error(`failed to set next payment-cards as default`);
              console.json({ mClientPaymentSettings, mNextPaymentCard });
            }

          }else{
            const updateClientPaymentSettings = await mClientPaymentSettings.update({
              paymentCardId: null,
              type: paymentTypes.ApplePay
            });

            if( !App.isObject(updateClientPaymentSettings) || !App.isPosNumber(updateClientPaymentSettings.id) ){
              console.error(`failed to update client payment settings`);
              console.json({ mClientPaymentSettings });
            }

          }
        }

      }


    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


