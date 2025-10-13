const express = require('express');
const router = express.Router();

// {
//   "amount": "required: <float>"
// }

// {
//   "amount": "10.45"
// }

// /private/courier/withdraw/requests/create/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      if( !mCourier.isValidChecksum )
        return App.json( res, 403, App.t(['Courier Security check error'], req.lang) );

      const verifyAccessRes = App.getModel('Courier').verifyAccess( mCourier );
      if( !verifyAccessRes.success )
        return App.json(res, 417, App.t(verifyAccessRes.message, req.lang), verifyAccessRes.data);

      const withdraw_t = {
        courierId: mCourier.id,
        amount: App.getPosNumber( req.getCommonDataFloat('amount', 0), {toFixed: 2, abs: true}),
      };

      console.json({withdraw_t});
      if( App.isNull(withdraw_t.amount) )
        return App.json( res, 417, App.t( ['Please enter a valid amount'], res.lang) );

      if( withdraw_t.amount > mCourier.balance )
        return App.json( res, 417, App.t(['Insufficientbalance.','Available to withdraw usd',mCourier.balance], res.lang), {
          balance: mCourier.balance
        });

      const mCourierWithdrawSettings = await App.getModel('CourierWithdrawSettings').getSettings();
      if( !App.isObject(mCourierWithdrawSettings) || !App.isPosNumber(mCourierWithdrawSettings.id) )
        return App.json( res, false, App.t(['Failed to get withdraw settings'], res.lang) );

      if( !mCourierWithdrawSettings.isEnabled )
        return App.json( res, 417, App.t(['All withdrawals are currently disabled'], res.lang) );

      if( mCourierWithdrawSettings.minAmount > 0 )
      if( withdraw_t.amount < mCourierWithdrawSettings.minAmount )
        return App.json( res, 417, App.t(['The withdrawal amount cannot be less than','usd',`${mCourierWithdrawSettings.minAmount}`], res.lang) );

      if( mCourierWithdrawSettings.maxAmount > 0 )
      if( withdraw_t.amount > mCourierWithdrawSettings.maxAmount )
        return App.json( res, 417, App.t(['The withdrawal amount cannot exceed','usd',`${mCourierWithdrawSettings.maxAmount}`], res.lang) );

      const balance = +(mCourier.balance - withdraw_t.amount).toFixed(2);

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        let CWR = await App.getModel('CourierWithdrawRequest').create({...withdraw_t}, { transaction: tx });
        CWR = await CWR.update({ checksum: true },{transaction: tx});
        if( !CWR || !CWR.isValidChecksum )
          throw Error('Courier Withdrawal Request Security check error');

        let CR = await mCourier.update({ balance }, { transaction: tx });
        CR = await CR.update({ checksum: true },{transaction: tx});

        if( !CR || !CR.isValidChecksum )
          throw Error('Courier Security check error');

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

        return App.json( res, false, App.t(['Failed to process withdrawal request'], res.lang) );

      }

      App.json( res, true, App.t(['Withdrawal request created successfully'], res.lang), {
        balance,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

