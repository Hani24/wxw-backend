const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. PaymentCard.id",
  "cardHolderName": "required: <string>: latin text only (max: 15 symbols name and 15 symbols last name)",
  "cardNumber": "required: <string>: 16 characters",
  "cardExpiryDate": "required: <string>: eg: 03/27",
  "cardCVV": "required: <string>: 3 digits"
}

{
  "id": 2,
  "cardHolderName": "tsimaschenka viacheslau",
  "cardNumber": "1234 5678 9012 1234",
  "cardExpiryDate": "03/27",
  "cardCVV": "123"
}
*/

// /private/client/payment-cards/update/by/id/:id

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

      const decPaymentCard_t = {
        cardHolderName: App.tools.cleanName( req.getCommonDataString('cardHolderName',''), true, true ),
        cardNumber: App.tools.cleanCardNumber(req.getCommonDataString('cardNumber','')),
        cardExpiryDate: App.tools.cleanCardExpiryDate(req.getCommonDataString('cardExpiryDate','')),
        cardCVV: App.tools.cleanCardCVV(req.getCommonDataString('cardCVV','')),
      };

      for ( const mKey of Object.keys(decPaymentCard_t) ){
        if( App.isNull(decPaymentCard_t[ mKey ]) || !decPaymentCard_t[ mKey ] )
          delete decPaymentCard_t[ mKey ];
      }

      const expiryDate = decPaymentCard_t.cardExpiryDate.split('/').map((d)=>(+d)); 
      const mDate = App.getDetailedDate();

      if(
        (expiryDate[1] < mDate.y)
        ||
        (expiryDate[1] == mDate.y && expiryDate[0] < mDate.M )
      ){
        return App.json( res, 417, App.t(['Card','has-been','expired'], res.lang) );
      }

      if( expiryDate[0] > 12 )
        return App.json( res, 417, App.t(['wrong','card','date'], res.lang) );

      if( decPaymentCard_t.cardHolderName.length > ( 15 + 1 + 15 ) )
        return App.json( res, 417, App.t(['first','and','last','name','must-be','less','or','equal','to','15','charachters','each'], res.lang) );

      if( decPaymentCard_t.cardHolderName.replace(/(\s\s){1,}/g,' ').trim().split(' ').length > 2 )
        return App.json( res, 417, App.t(['only','first','and','last','name','must-be','provided'], res.lang) );

      if( !!(decPaymentCard_t.cardNumber) ){

        const mCards = await App.getModel('PaymentCard').findAll({
          where: {
            clientId: mClient.id,
            id: { [ App.DB.Op.not ]: mPaymentCard.id },
            isDeleted: false,
            isOneTimeCard: false,
          },
          attributes: ['id','encCardNumber'],
        });

        for( const mCard of mCards ){
          const decCardNumberRes = App.RSA.decrypt( mCard.encCardNumber );

          if( !decCardNumberRes.success ){
            console.json({decCardNumberRes});
            continue;
          }

          if( decCardNumberRes.data === decPaymentCard_t.cardNumber )
            return App.json( res, 417, App.t(['Payment-Card','already','added'], res.lang));
        }

      }

      const encPaymentCard_t = {
        // encCardHolderName: App.RSA.encrypt(decPaymentCard_t.cardHolderName).data,
        // encCardNumber: App.RSA.encrypt(decPaymentCard_t.cardNumber).data,
        // encCardExpiryDate: App.RSA.encrypt(decPaymentCard_t.cardExpiryDate).data,
        // encCardCVV: App.RSA.encrypt(decPaymentCard_t.cardCVV).data,
      };

      if( !!decPaymentCard_t.cardHolderName )
        encPaymentCard_t.encCardHolderName = App.RSA.encrypt(decPaymentCard_t.cardHolderName).data;

      if( !!decPaymentCard_t.cardNumber )
        encPaymentCard_t.encCardNumber = App.RSA.encrypt(decPaymentCard_t.cardNumber).data;

      if( !!decPaymentCard_t.cardExpiryDate )
        encPaymentCard_t.encCardExpiryDate = App.RSA.encrypt(decPaymentCard_t.cardExpiryDate).data;

      if( !!decPaymentCard_t.cardCVV )
        encPaymentCard_t.encCardCVV = App.RSA.encrypt(decPaymentCard_t.cardCVV).data;

      for ( const mKey of Object.keys(encPaymentCard_t) ){
        if( App.isNull(encPaymentCard_t[ mKey ]) || !encPaymentCard_t[ mKey ] )
          return App.json( res, false, App.t(['fatal','server','error'], res.lang) );
      }

      const updateRes = await mPaymentCard.update( encPaymentCard_t );

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','Payment-Card'], res.lang) );

      App.json( res, true, App.t('success', res.lang), 
        // dev
        // await App.getModel('PaymentCard').getAllByClientId( mClient.id )
      );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


