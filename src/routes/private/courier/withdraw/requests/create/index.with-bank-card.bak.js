const express = require('express');
const router = express.Router();

// {
//   "cardHolderName": "required: <string>: latin text only (max: 15 sym. name and 15 sym. last-name)",
//   "cardNumber": "required: <string>: 16 characters",
//   "amount": "required: <float>"
// }

// {
//   "cardHolderName": "Bob Andersen",
//   "cardNumber": "1111222233334444",
//   "amount": "10.45"
// }

// /private/courier/withdraw/requests/create/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return App.json(res, 417, App.t(['disabled'], req.lang));

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const verifyAccessRes = App.getModel('Courier').verifyAccess( mCourier );
      if( !verifyAccessRes.success )
        return App.json(res, 417, App.t(verifyAccessRes.message, req.lang), verifyAccessRes.data);

      console.json({withdraw: {data}});

      const withdraw_t = {
        courierId: mCourier.id,
      };

      const validate_t = [
        { 
          key: 'cardNumber', 
          value: App.tools.cleanCardNumber(req.getCommonDataString('cardNumber','')),
          message: ['Please','provide','valid','Card','number'],
        },
        { 
          key: 'cardHolderName', 
          value: App.tools.cleanName( req.getCommonDataString('cardHolderName',''), true, true ),
          message: ['Please','provide','valid','Card','holder','full','name'],
        },
        { 
          key: 'amount', 
          value: App.getPosNumber( req.getCommonDataFloat('amount',0) ),
          message: ['Please','provide','valid','amount'],
        },
      ];

      for ( const mVal of validate_t ){
        if( App.isNull(mVal.value) || !mVal.value )
          return App.json( res, 417, App.t( mVal.message, res.lang) );

        withdraw_t[ mVal.key ] = mVal.value;
      }

      console.json({withdraw_t});

      if( withdraw_t.amount > mCourier.balance )
        return App.json( res, 417, App.t(['insufficient','balance','available',mCourier.balance,'usd'], res.lang) );

      // NOTE: TODO: Add minimum withdraw amount ???
      const MIN_WITHDRAW_AMOUNT = 5;

      if( withdraw_t.amount < MIN_WITHDRAW_AMOUNT )
        return App.json( res, 417, App.t(['withdraw','amount','cannot-be','less','then',`${MIN_WITHDRAW_AMOUNT}`,'usd'], res.lang) );

      if( withdraw_t.cardHolderName.length > ( 15 + 1 + 15 ) )
        return App.json( res, 417, App.t(['first','and','last','name','must-be','less','or','equal','to','15','charachters','each'], res.lang) );

      if( withdraw_t.cardHolderName.split(' ').length > 2 )
        return App.json( res, 417, App.t(['only','first','and','last','name','must-be','provided'], res.lang) );

      // NOTE: Use BIGINT instead of float/decimal ???
      const balance = +(mCourier.balance - withdraw_t.amount).toFixed(2);

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        await App.getModel('CourierWithdrawRequest').create({
          ...withdraw_t,
        }, { transaction: tx });

        await mCourier.update({
          balance,
        }, { transaction: tx });

        await tx.commit();
        console.ok(`#withdraw request: commited`);

      }catch(e){
        console.warn(`#withdraw request: ${e.message}`);
        console.error(e);
        console.json({withdraw_t, balance});

        try{
          await tx.rollback();
        }catch(e){
          console.warn(`#withdraw request: rollback: ${e.message}`);
          console.error(e);
        }

        return App.json( res, false, App.t(['failed-to','process','withdraw','request'], res.lang) );

      }

      App.json( res, true, App.t(['withdraw','request','created'], res.lang), {
        balance
      } );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

