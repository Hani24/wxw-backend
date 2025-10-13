const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierWithdrawRequest.id",
//   "amount": "required: <number>: eg. full amount to approve all, or partial",
//   "reason": "required | optional: <string>: required if [amount] is partial"
// }

// /private/admin/courier/withdraw/requests/approve/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return await App.json( res, 417, App.t(['disabled'], res.lang));

      const data = req.getPost();
      const mUser = await req.user;

      const request_t = {
        id: req.getCommonDataInt('id', null),
        amount: req.getCommonDataFloat('amount', null),
        reason: req.getCommonDataString('reason', null),
      };

      if( !App.isPosNumber(request_t.id) )
        return App.json(res, 417, App.t(['Withdraw request ID is required'],req.lang));

      if( !App.isPosNumber(request_t.amount) )
        return App.json(res, 417, App.t(['Withdraw amount cannot be zero (0)'],req.lang));

      const mCourierWithdrawRequest = await App.getModel('CourierWithdrawRequest').findOne({
        where: {
          id: request_t.id,
          // isAccepted: false,
          // isRejected: false,
          isInitialized: false,
          isCompleted: false, // only used to sync local && remove:stripe state
        },
        attributes: [
          'id','courierId','amount','transferId','payoutId',
          'isPartialyApproved','approvedAmount', 'partialyApprovedReason','refundedAmount',
          'isRejected','rejectedAt','rejectionReason',
          'isAccepted','acceptedAt',
          'isCompleted','completedAt',
          'createdAt',
          'isValidChecksum','checksum',
          ...App.getModel('CourierWithdrawRequest').getChecksumKeys(),
        ],
      });

      if( !App.isObject(mCourierWithdrawRequest) || !App.isPosNumber(mCourierWithdrawRequest.id) )
        return await App.json( res, 404, App.t(['Withdraw request not found and/or has been already processed'], res.lang));

      if( !mCourierWithdrawRequest.isValidChecksum )
        return await App.json( res, 417, App.t(['Withdraw request Security check error'], res.lang));

      if( mCourierWithdrawRequest.isRejected )
        return await App.json( res, 417, App.t(['Withdraw request has already been rejected'], res.lang));

      if( mCourierWithdrawRequest.isAccepted )
        return await App.json( res, 417, App.t(['Withdraw request has already been approved'], res.lang));

      if( mCourierWithdrawRequest.amount !== request_t.amount ){

        if( request_t.amount > mCourierWithdrawRequest.amount )
          return await App.json( res, 417, App.t(['Amount to withdraw cannot be greater that requested amount by the Driver'], res.lang));

        if( !App.isString(request_t.reason) || !request_t.reason.length )
          return await App.json( res, 417, App.t(['Partialy approved withdraw requires valid reason'], res.lang));

      }

      const mCourier = await App.getModel('Courier').findOne({
        where: {
          id: mCourierWithdrawRequest.courierId,
          isRestricted: false,
          isDeleted: false,
          isVerified: true,
        },
        // attributes: [
        //   'isValidChecksum','checksum',
        //   ...App.getModel('Courier').getChecksumKeys(),
        // ],
        include: [{
          required: true,
          model: App.getModel('User'),
          attributes: [
            'id','email','phone','fullName',
          ]
        }]
      });

      if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
        return await App.json( res, 404, App.t(['Courier not found and/or has been restricted'], res.lang));

      if( !mCourier.isValidChecksum )
        return await App.json( res, 417, App.t(['Courier Security check error'], res.lang));

      const stripeAccountRes = await App.payments.stripe.accountGetById(mCourier.accountId);
      if( !stripeAccountRes.success )
        return await App.json(res, stripeAccountRes);

      const {external_accounts: externalAccounts} = stripeAccountRes.data;
      const isExternalAccountConnecter = App.isArray(externalAccounts.data) && (!!externalAccounts.data.length);

      const platformBalanceRes = await App.payments.stripe.getBalanceOf(null); // owner 
      if( !platformBalanceRes.success )
        return await App.json(res, platformBalanceRes);

      // {
      //   "object": "balance",
      //   "livemode": false,
      //   "available": [
      //     { "amount": 993000, "currency": "usd", "source_types": { "card": 993000 } }
      //   ],
      //   "connect_reserved": [
      //     { "amount": 0, "currency": "usd" }
      //   ],
      //   "pending": [
      //     { "amount": 21379, "currency": "usd", "source_types": { "card": 21379 } }
      //   ]
      // }

      // const amount = Math.floor(mCourierWithdrawRequest.amount *100); // to cents
      const amountInCents = Math.floor(request_t.amount *100); // to cents

      let foundBalanceSource = false;
      let validSource = false;

      for( const sourceType of ['available','connect_reserved'] ){
        if( 
          !App.isArray( platformBalanceRes.data[ sourceType ] ) 
          || 
          !platformBalanceRes.data[ sourceType ].length
        ) continue;

        for( const source of platformBalanceRes.data[ sourceType ] ){
          if( source.amount < amountInCents )
            continue;

          validSource = source;
          foundBalanceSource = true;
          break;
        }

        if( foundBalanceSource ) break;
      }

      if( !foundBalanceSource )
        return await App.json( res, 417, App.t(['Stripe Account: insuficient inner balance'], res.lang));

      let transferId = null;
      let payoutId = null;
      let isCompleted = false;

      const description = `Payout: #ID${mCourierWithdrawRequest.id}CUID${mCourier.id}AMNT${amountInCents}`;
      const metadata = {
        courierWithdrawRequestId: mCourierWithdrawRequest.id,
        courierId: mCourier.id,
        amount: mCourierWithdrawRequest.amount,
        approvedAmount: request_t.amount,
        isPartialyApproved: (request_t.amount !== mCourierWithdrawRequest.amount),
        partialyApprovedReason: request_t.reason || '',
        refundedAmount: +(mCourierWithdrawRequest.amount - request_t.amount).toFixed(),
      };

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const mCourierWithdrawRequestUpdate = await mCourierWithdrawRequest.update({
          isInitialized: true,
          initializedAt: App.getISODate(),
          approvedAmount: request_t.amount,
          isPartialyApproved: metadata.isPartialyApproved,
          partialyApprovedReason: metadata.partialyApprovedReason,
          refundedAmount: metadata.refundedAmount,
          // transferId: 
          // payoutId: 
        }, {transaction: tx});

        if( !App.isObject(mCourierWithdrawRequestUpdate) || !App.isPosNumber(mCourierWithdrawRequestUpdate.id) ){
          await tx.rollback();
          return await App.json( res, false, App.t(['Failed to update withdraw record'], res.lang));
        }

        if( mCourierWithdrawRequestUpdate.isPartialyApproved ){

          if( !App.isPosNumber(metadata.refundedAmount) ){
            await tx.rollback();
            return await App.json( res, 417, App.t(['Failed to update partialy approved withdraw'], res.lang));
          }

          let updateCourierBalance = await mCourier.update({
            balance: +( mCourier.balance + metadata.refundedAmount ).toFixed(2),
          }, { transaction: tx });

          updateCourierBalance = await updateCourierBalance.update({
            checksum: true,
          }, { transaction: tx });

          if( !App.isObject(updateCourierBalance) || !App.isPosNumber(updateCourierBalance.id) ){
            await tx.rollback();
            return await App.json( res, false, App.t(['Failed to update Driver balance'], res.lang));
          }

        }

        // transfer funds from Owner:inner account to Courier:inner account
        const transferRes = await App.payments.stripe.transfer({
          accountId: mCourier.accountId,
          amount: amountInCents,
          description,
          metadata,
          // txGroup: `txTUID-${Math.floor( Math.random()*10e14 )}`,
        });
        if( !transferRes.success ){
          console.json({transferRes});
          await tx.rollback();
          return await App.json(res, transferRes);
        }

        transferId = transferRes.data.id;

        if( isExternalAccountConnecter ){
          // transfer funds from Courier:inner account to Courier:external account (Bank,Card, Any other method specified at KYC)
          // this step can faild, bcs of no valid external account or other reason,
          // in case of error, Courier will have to login into the stripe, set new external account, Card, etc.. 
          // and manually withdraw to selected destionation
          const payoutRes = await App.payments.stripe.payout({
            accountId: mCourier.accountId,
            amount: amountInCents,
            description,
            metadata,
          });
          if( !payoutRes.success ){
            console.warn(`payout: ${payoutRes.message}`);
            console.json(payoutRes.data);
          }else{
            payoutId = payoutRes.data.id;
          }
        }

        isCompleted = App.isString(transferId) && App.isString(payoutId);
        const mCourierWithdrawRequestCompleted = await mCourierWithdrawRequest.update({
          isAccepted: true,
          acceptedAt: App.getISODate(),
          transferId,
          payoutId,
          isCompleted,
          completedAt: (isCompleted ? App.getISODate() : null),
          checksum: true,
        }, {transaction: tx});

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return await App.json( res, false, App.t(['Could not approve withdraw requests'], res.lang));
      }

      await App.json( res, true, App.t(['Withdraw request has been completed'], res.lang) );

      // [post-processing]

      const cTypes = App.getModel('CourierNotification').getTypes();
      const type = cTypes[ isCompleted ? 'withdrawRequestCompleted' : 'withdrawRequestApproved'];

      // withdrawRequestApproved, withdrawRequestRejected, withdrawRequestCompleted
      const courierPushRes = await App.getModel('CourierNotification')
        .pushToCourier( mCourier, {
          type,
          title: `Withdraw #${mCourierWithdrawRequest.id} has been ${isCompleted ? 'completed' : 'approved, but requires your action in admin-panel'}`, 
          message: isCompleted ? `Expected payout in 3 days` : 'You will have to provide valid Bank-account/Card and withdraw manually',
          data: metadata
        });

      if( !courierPushRes.success )
        console.error(`#withdraw-request: ${mCourierWithdrawRequest.id}, #courier: ${mCourier.id}, ${courierPushRes.message}`);

      const courierWithdrawRes = await App.Mailer.send({
        to: mCourier.User.email,
        subject: App.t(`Withdraw #${mCourierWithdrawRequest.id} has been approved.`, req.lang),
        data: await App.Mailer.createEmailTemplate('courier-withdraw', { 
          amount: mCourierWithdrawRequest.amount,
          approvedAmount: metadata.approvedAmount, 
          isPartialyApproved: metadata.isPartialyApproved, 
          comment: metadata.partialyApprovedReason || '',
          refundedAmount: metadata.refundedAmount,
          isAccepted: true, 
          // firstName: '', 
          // lastName: '',
          lang: req.lang,
        })
      });

      // const dashboard = `https://dashboard.stripe.com/${mCourier.accountId}/test/dashboard`;
      if( !courierWithdrawRes.success ){
        console.error(courierWithdrawRes.message);
        console.json({courierWithdrawRes});
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


