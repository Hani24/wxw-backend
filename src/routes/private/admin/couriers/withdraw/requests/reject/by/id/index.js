const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierWithdrawRequest.id",
//   "reason": "required: <string>: rejection reason"
// }

// /private/admin/courier/withdraw/requests/reject/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const id = req.getCommonDataInt('id', null);
      const rejectionReason = req.getCommonDataString('reason', null);

      if( !App.isPosNumber(id) || !App.isString(rejectionReason) || rejectionReason.length <= 3 )
        return App.json(res, 417, App.t(['Withdraw request ID and rejection reason is required'],req.lang));

      const mCourierWithdrawRequest = await App.getModel('CourierWithdrawRequest').findOne({
        where: {
          id,
          // isAccepted: false,
          // isRejected: false,
          // isCompleted: false, // only used to sync local && remove:stripe state
        },
        attributes: [
          'id','amount','courierId',
          'isAccepted','acceptedAt',
          'isRejected','rejectedAt','rejectionReason',
          'isCompleted','completedAt',
          'createdAt',
          // 'id','courierId','amount','transferId','payoutId',
          // 'isPartialyApproved','approvedAmount', 'partialyApprovedReason','refundedAmount',
          // 'isRejected','rejectedAt','rejectionReason',
          // 'isAccepted','acceptedAt',
          // 'isCompleted','completedAt',
          // 'createdAt',
          'isValidChecksum','checksum',
          ...App.getModel('CourierWithdrawRequest').getChecksumKeys(),
        ],
      });

      if( !App.isObject(mCourierWithdrawRequest) || !App.isPosNumber(mCourierWithdrawRequest.id) )
        return await App.json( res, 404, App.t(['Withdraw request not found'], res.lang));

      if( !mCourierWithdrawRequest.isValidChecksum )
        return await App.json( res, 417, App.t(['Withdraw request Security check error'], res.lang));

      if( mCourierWithdrawRequest.isRejected )
        return await App.json( res, 417, App.t(['Withdraw request has already been rejected'], res.lang));

      if( mCourierWithdrawRequest.isAccepted )
        return await App.json( res, 417, App.t(['Withdraw request has already been approved'], res.lang));

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
        // ]
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

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        let updateCourierBalance = await mCourier.update({
          balance: +(mCourier.balance + mCourierWithdrawRequest.amount).toFixed(2),
        },{transaction: tx});

        updateCourierBalance = await updateCourierBalance.update({
          checksum: true,
        }, { transaction: tx });

        if( !App.isObject(updateCourierBalance) )
          throw Error('Failed update courier');

        const updateCourierWithdrawRequest = await mCourierWithdrawRequest.update({
          isRejected: true,
          rejectedAt: App.getISODate(),
          rejectionReason,
          checksum: true,
        },{transaction: tx});

        if( !App.isObject(updateCourierWithdrawRequest) )
          throw Error('Failed update withdraw-request');

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return await App.json( res, false, App.t(['Could not reject withdraw requests'], res.lang));
      }

      await App.json( res, true, App.t(['Withdraw request has been rejected successfully'], res.lang) );

      // [post-processing]
      // withdrawRequestApproved, withdrawRequestRejected, withdrawRequestCompleted
      const courierPushRes = await App.getModel('CourierNotification')
        .pushToCourier( mCourier, {
          type: App.getModel('CourierNotification').getTypes()['withdrawRequestRejected'],
          title: `Withdraw #${mCourierWithdrawRequest.id} has been rejected`, 
          message: `Reason: ${rejectionReason}`,
          data: {
            amount: mCourierWithdrawRequest.amount,
            courierWithdrawRequestId: mCourierWithdrawRequest.id,
            courierId: mCourier.id,
          }
        });

      if( !courierPushRes.success )
        console.error(`#withdraw-request: ${mCourierWithdrawRequest.id}, #courier: ${mCourier.id}, ${courierPushRes.message}`);

      const courierWithdrawRes = await App.Mailer.send({
        to: mCourier.User.email,
        subject: App.t(`Withdraw #${mCourierWithdrawRequest.id} has been rejected.`, req.lang),
        data: await App.Mailer.createEmailTemplate('courier-withdraw', { 
          amount: mCourierWithdrawRequest.amount,
          approvedAmount: 0, 
          isPartialyApproved: false, 
          comment: rejectionReason,
          refundedAmount: 0,
          isAccepted: false, 
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


