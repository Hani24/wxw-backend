module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  if( !App.isNodeOfTypeEnabled('master') ){
    return false;
  }

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // do not wait for prev. instance to end.
    isEnabled: true, // App.isEnv('dev'),
    runOnce: false,
    runAtStart: false, // true,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      App.isEnv('dev')
        ? { each: 10, type: 'seconds' }
        : { each: 30, type: 'seconds' },
        // : { each: 7, type: 'days' },
    ],
  });

  const statuses = App.getModel('RestaurantTransfer').getTransferStatuses();
  const mAdmins = await App.getModel('User').findAll({
    where: {
      role: App.getModel('User').getRoles().admin,
    },
    attributes:['id','email','phone']
  });

  Job.on('task', async(job, {each=0}={})=>{

    // return;
    // if( !App.isEnv('dev') ) return;

    const mSettings = await App.getModel('RestaurantWithdrawSettings').getSettings();

    const mRestaurants = await App.getModel('Restaurant').findAll({
      where: {
        balance: { [ App.DB.Op.gte ]: mSettings.minAmount },
        isDeleted: false,
        isRestricted: false,
        isVerified: true,
        isKycCompleted: true,
      },
      attributes: [
        'id','balance',
        // ,'isValidChecksum','checksum',
        // ...App.getModel('Restaurant').getChecksumKeys(),
        'isValidChecksum','checksum',
        ...App.getModel('Restaurant').getChecksumKeys(),
      ],
      order: [['id','asc']],
      limit: 10,
    });

    if( !App.isArray(mRestaurants) || !mRestaurants.length ){
      if(job.isDebugOn()) job.debug(`#no restaurants found`);      
      return;
    }

    for( const {id/*, isValidChecksum*/} of mRestaurants ){

      // if( !isValidChecksum ){
      //   job.error(`#failed to verify restaurant checksum: id: ${id}, valid: ${isValidChecksum} `);      
      //   continue;        
      // }

      let mRestaurant = await App.getModel('Restaurant').getById(id);
      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        job.error(`#failed to get restaurant: id: ${id} `);      
        continue;        
      }

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        job.error(`Failed to get Restaurant by id: ${id}`);
        continue;
      }

      if( !mRestaurant.isValidChecksum ){
        job.error(`Security checksum error: restaurant id: ${id}`);
        continue;
      }

      // stripe
      const stripeAccountRes = await App.payments.stripe.accountGetById(mRestaurant.accountId);
      if( !stripeAccountRes.success ){
        job.error(`#stripe: get resto account: ${mRestaurant.accountId}: ${stripeAccountRes.message}`);
        continue;
      }

      const {external_accounts: externalAccounts} = stripeAccountRes.data;
      const isExternalAccountConnecter = App.isArray(externalAccounts.data) && (!!externalAccounts.data.length);

      const platformBalanceRes = await App.payments.stripe.getBalanceOf(null); // owner 
      if( !platformBalanceRes.success ){
        job.error(`#stripe: get owner account: ${platformBalanceRes.message}`);
        continue;
      }

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

      const amountInCents = Math.floor(mRestaurant.balance *100); // to cents
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

      if( !foundBalanceSource ){
        for( const mAdmin of mAdmins ){
          await App.Mailer.send({
            to: mAdmin.email,
            subject: App.t('Insuficient stripe balance', 'en'),
            data: await App.Mailer.createEmailTemplate('admin-insuficient-stripe-balance', {})
          });          
        }

        job.error(`#stripe: Stripe Account: insuficient inner balance`);
        continue;        
      }

      let mRestaurantTransfer = await App.getModel('RestaurantTransfer').create({
        restaurantId: mRestaurant.id,
        amount: mRestaurant.balance,
        status: statuses.none,
        isTransfered: false,
        transferedAt: null,
        transferError: '',
        isPaidOut: false,
        paidOutAt: null,
        paidOutError: '',
        transferId: null,
        payoutId: null,
        isInited: false,
        initedAt: null,
        checksum: true,
      });

      if( !App.isObject(mRestaurantTransfer) || !App.isPosNumber(mRestaurantTransfer.id) ){
        if(job.isDebugOn()) job.error(`#failed to create restaurant-transfer record`);      
        continue;        
      }

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions({}) );

      try{

        mRestaurantTransfer = await mRestaurantTransfer.update({
          isInited: true,
          initedAt: App.getISODate(),
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(mRestaurantTransfer) || !App.isPosNumber(mRestaurantTransfer.id) )
          throw Error('Failed to inititalize restaurant-transfer');

        if( !mRestaurantTransfer.isValidChecksum )
          throw Error('Security checksum error, transfer: inited');

        const updatedRowRes = await App.DB.sequelize.query(
          `update Restaurants set balance = balance -${mRestaurant.balance} where id=${mRestaurant.id}`, 
          { transaction: tx }
        );

        // updatedRowRes: => [
        //   { "affectedRows": 1, "insertId": 0, "warningStatus": 0 },
        //   null
        // ];

        job.warn(`[b]: balance: ${mRestaurant.balance}, checksum: ${mRestaurant.checksum}`);
        const mRestoBalance = await App.getModel('Restaurant').findOne({
          where: {
            id: mRestaurant.id
          }, 
          transaction: tx,
          attributes:['id','balance']
        });

        if( !App.isObject(mRestoBalance) || !App.isPosNumber(mRestoBalance.id) )
          throw Error(`Failed to get Restaurant balance: restaurant-id: ${mRestaurant.id}`);

        mRestaurant = await mRestaurant.update({
          balance: mRestoBalance.balance,
          checksum: true,
        }, {transaction: tx});
        job.warn(`[a]: balance: ${mRestaurant.balance}, checksum: ${mRestaurant.checksum}`);

        if( !App.isObject(mRestaurant) || !mRestaurant.isValidChecksum )
          throw Error('Security checksum error, restaurant');

        if(job.isDebugOn())
          job.json({updatedRowRes});

        const transferRes = await App.payments.stripe.transfer({
          accountId: mRestaurant.accountId,
          amount: amountInCents,
          currency: 'usd',
          description: `#Transfer: #${mRestaurantTransfer.id}`,
          metadata: {
            restaurantId: mRestaurant.id,
            amount: mRestaurantTransfer.amount,
            description: `#Restaurant-Transfer: #${mRestaurantTransfer.id}`,
          },
        });

        if( !transferRes.success || !App.isString(transferRes.data.id) || !transferRes.data.id.match(/^tr_/gi) ){
          await mRestaurantTransfer.updated({
            transferError: transferRes.message,
            status: statuses.errored,
          });
          throw Error(`Failed to execute transfer: ${transferRes.message}`);
        }

        mRestaurantTransfer = await mRestaurantTransfer.update({
          isTransfered: true,
          transferedAt: App.getISODate(),
          transferId: transferRes.data.id,
          status: statuses.transfered,
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(mRestaurantTransfer) || !App.isPosNumber(mRestaurantTransfer.id) ){
          // await mRestaurantTransfer.updated({transferError: 'Failed to set restaurant-transfer transfer-id'});
          throw Error(`Failed to set restaurant-transfer transfer-id: ${transferRes.data.id}`);
        }

        if( !mRestaurantTransfer.isValidChecksum )
          throw Error(`Security checksum error, restaurant-transfer: transfer-id: ${transferRes.data.id}`);

        // Restaurant have connected card/bank account
        if( isExternalAccountConnecter ){

          const payoutRes = await App.payments.stripe.payout({
            accountId: mRestaurant.accountId,
            amount: amountInCents,
            currency: 'usd',
            description: `#Payout: #${mRestaurantTransfer.id}`,
            metadata: {
              restaurantId: mRestaurant.id,
              amount: mRestaurantTransfer.amount,
            },
          });

          if( !payoutRes.success || !App.isString(payoutRes.data.id) || !payoutRes.data.id.match(/^po_/gi) ){
            job.error(`Failed to execute payout: ${payoutRes.message}`);
            mRestaurantTransfer = await mRestaurantTransfer.update({
              paidOutError: payoutRes.message
              // status: statuses.errored,
            });
            // do not throw error: Funds are transfered successfully to the Restaurant-Stripe-Account, but no external-account (Bank/Card/etc...) is available
            // manual withdraw by restaurant is required
          }else{

            mRestaurantTransfer = await mRestaurantTransfer.update({
              isPaidOut: true,
              paidOutAt: App.getISODate(),
              payoutId: payoutRes.data.id,
              status: statuses.completed,
              checksum: true,
            }, {transaction: tx});

            if( !App.isObject(mRestaurantTransfer) || !App.isPosNumber(mRestaurantTransfer.id) )
              throw Error(`Failed to set restaurant-transfer: payout-id: ${payoutRes.data.id}`);
 
           if( !mRestaurantTransfer.isValidChecksum )
            throw Error(`Security checksum error, payout-id: ${payoutRes.data.id}`);

          }
        }

        await tx.commit();
        if(job.isDebugOn()){
          job.ok(` #resto-transfer: ${mRestaurantTransfer.id} => #restaurant: ${mRestaurant.id} => #amount: ${mRestaurantTransfer.amount}`);
          job.ok(`   #transfer-id: ${mRestaurantTransfer.transferId}, #payout-id: ${mRestaurantTransfer.payoutId}, `);          
        }

        // job: [dev.order-supplier.apply-balance]: [1], done
        // {"balance":20.5}
        // job: [dev.restaurants-auto-payout]: [1]: 
        // {
        //   "updatedRowRes": [
        //     {
        //       "affectedRows": 1,
        //       "insertId": 0,
        //       "warningStatus": 0
        //     },
        //     null
        //   ]
        // }
        // job: [dev.restaurants-auto-payout]: [1],  #resto-transfer: 6 => #restaurant: 2 => #amount: 20.5
        // job: [dev.restaurants-auto-payout]: [1],    #transfer-id: tr_1LONueI4FCePIbHHZ3GRZTFM, #payout-id: po_1LONufRGD3D1h01BqWEqgVbZ, 
        // job: [dev.restaurants-auto-payout]: [1], done
        // job: [dev.order-supplier.apply-balance]: [2], done


      }catch(e){
        job.error(e.message);
        await tx.rollback();
      }

    }

    if(job.isDebugOn()) job.ok(`done`);      

  });

  // Job.start();
  return Job;

}

// transferRes.data => 
// {
//   "id": "tr_1LL75jI4FCePIbHHwBvGJYnV",
//   "object": "transfer",
//   "amount": 1000,
//   "amount_reversed": 0,
//   "balance_transaction": "txn_1LL75jI4FCePIbHH9Nch7iRM",
//   "created": 1657724587,
//   "currency": "usd",
//   "description": null,
//   "destination": "acct_1LL4GZRHKA0POM0K",
//   "destination_payment": "py_1LL75jRHKA0POM0KHsfqbdvI",
//   "livemode": false,
//   "metadata": {},
//   "reversals": {
//     "object": "list",
//     "data": [],
//     "has_more": false,
//     "total_count": 0,
//     "url": "/v1/transfers/tr_1LL75jI4FCePIbHHwBvGJYnV/reversals"
//   },
//   "reversed": false,
//   "source_transaction": null,
//   "source_type": "card",
//   "transfer_group": null
// }

// payoutRes.data => 
// {
//   "id": "po_1LL75lRHKA0POM0K6UQrjsTc",
//   "object": "payout",
//   "amount": 2000,
//   "arrival_date": 1657756800,
//   "automatic": false,
//   "balance_transaction": "txn_1LL75lRHKA0POM0KvPPfwNvv",
//   "created": 1657724589,
//   "currency": "usd",
//   "description": null,
//   "destination": "ba_1LL5R0RHKA0POM0Kgn2wVlCj",
//   "failure_balance_transaction": null,
//   "failure_code": null,
//   "failure_message": null,
//   "livemode": false,
//   "metadata": {},
//   "method": "standard",
//   "original_payout": null,
//   "reversed_by": null,
//   "source_type": "card",
//   "statement_descriptor": null,
//   "status": "pending",
//   "type": "bank_account"
// }