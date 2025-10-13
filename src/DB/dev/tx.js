(async()=>{
  
  try{

    const txRes = await App.DB.sequelize.transaction( App.DB.getTxOptions(), async(tx)=>{

      const mState = await App.getModel('State').create({
        // id: 1,
        name: 'X-State',
        code: '[state:code]',
        isEnabled: true,
      },{ transaction: tx });

      if( !App.isObject(mState) || !App.isPosNumber(mState.id) ){
        console.error(` #tx: [state]: rollback`);
        return tx.rollback();
      }
      console.ok(` #state: ${mState.id} => ${mState.name}`);
      const mCity = await App.getModel('City').create({
        stateId: mState.id,
        // stateId: 2345677654,
        name: 'X-City',
        code: '[city:code]',
        isEnabled: true,
      },{ transaction: tx });

      if( !App.isObject(mCity) || !App.isPosNumber(mCity.id) ){
        console.error(` #tx: [city]: rollback`);
        return tx.rollback();
      }
      console.ok(` #city: ${mCity.id} => ${mCity.name}`);

      // console.log(` #tx: commit`);
      // return tx.commit();
      return true;
    });
    console.json({txRes});

  }catch(e){
    console.error(` #tx: ${e.message}`);
  }

  // User.afterSave((instance, options) => {
  //   if (options.transaction) {
  //     // Save done within a transaction, wait until transaction is committed to
  //     // notify listeners the instance has been saved
  //     options.transaction.afterCommit(() => /* Notify */)
  //     return;
  //   }
  //   // Save done outside a transaction, safe for callers to fetch the updated model
  //   // Notify
  // });

  try{

    const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions());

    t.afterCommit(() => {
      // Your logic
    });

    let mState = await App.getModel('State').findOne({
      where: {
        name: 'X-State',
      },
    });

    try{
      await mState.destroy({ name: null }, {transaction: tx});
      // await mState.update({ name: null }, {transaction: tx});
    }catch(e){
      console.warn(`#catched: state: [0]: ${e.message}`);
      await tx.rollback();
      return false;
    }

    try{
      mState = await App.getModel('State').create({
        // id: 1,
        name: 'X-State',
        code: '[state:code]',
        isEnabled: true,
      },{ transaction: tx });
    }catch(e){
      console.warn(`#catched: state: [1]: ${e.message}`);
      await tx.rollback();
      return false;
    }

    // if( !App.isObject(mState) || !App.isPosNumber(mState.id) ){
    //   console.error(` #tx: [state]: rollback`);
    //   return tx.rollback();
    // }
    // console.ok(` #state: ${mState.id} => ${mState.name}`);
    // const mCity = await App.getModel('City').create({
    //   stateId: mState.id,
    //   // stateId: 2345677654,
    //   name: 'X-City',
    //   code: '[city:code]',
    //   isEnabled: true,
    // },{ transaction: tx });

    // if( !App.isObject(mCity) || !App.isPosNumber(mCity.id) ){
    //   console.error(` #tx: [city]: rollback`);
    //   return tx.rollback();
    // }
    // console.ok(` #city: ${mCity.id} => ${mCity.name}`);

    // console.log(` #tx: commit`);
    // return tx.commit();

    // console.json({ rollback: await tx.rollback() });
    console.json({ commit: await tx.commit() });

  }catch(e){
    console.error(` #tx: ${e.message}`);
  }

})();

// full-queue with NON-BLOCKING LOCK
(async()=>{

  // console.json({ ids: (await App.getModel('User').findAll({ attributes: ['id'] })).map((mU)=>mU.id).sort((a,b)=>a<b?-1:0) });
  // console.json({ ids: (await App.getModel('Restaurant').findAll({ attributes: ['id','userId'] })).map((mU)=>mU.userId).sort((a,b)=>a<b?-1:0) });
  // return;

  {

    // console.log( Object.keys(App.DB.Transaction.ISOLATION_LEVELS) );
    // {REPEATABLE_READ, REPEATABLE_READ, READ_UNCOMMITTED, SERIALIZABLE}

    // console.log( Object.keys(App.DB.Transaction.TYPES) );
    // >> {DEFERRED, IMMEDIATE, EXCLUSIVE}

    // console.log( Object.keys(App.DB.Transaction.LOCK) );
    // >> {UPDATE, SHARE, KEY_SHARE, NO_KEY_UPDATE}

    // return console.log( Object.keys(App.DB.TableHints) );
    // >> ["NOLOCK","READUNCOMMITTED","UPDLOCK","REPEATABLEREAD","SERIALIZABLE",
    //     "READCOMMITTED","TABLOCK","TABLOCKX","PAGLOCK","ROWLOCK","NOWAIT",
    //     "READPAST","XLOCK","SNAPSHOT","NOEXPAND"]

    console.log('0:0');
    const tx0 = await App.DB.sequelize.transaction({
      ...App.DB.getTxOptions(),
      autocommit: false,
      isolationLevel: App.DB.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      type: App.DB.Transaction.TYPES.EXCLUSIVE, // sqlite only ???
    });

    // const LOCK_TYPE = tx0.LOCK.UPDATE;
    const LOCK_TYPE = `${tx0.LOCK.UPDATE}`; // SKIP_LOCKED
    // console.ok({LOCK_TYPE});

    console.warn(`tx: ${tx0.id}`);
    App.getModel('User').findOne({
      where: {
        // status: { [ App.DB.Op.not ]: 'canceled' },
        id: 6,
      },
      attributes: ['id','firstName','updatedAt',/*'createdAt'*/],
      lock: LOCK_TYPE,
      transaction: tx0,
      // skipLocked: true,
      // tableHint: App.DB.TableHints.NOLOCK,
    }).then(async(mUser)=>{
      console.json({mUser});
      console.debug('sleep:3000:start');
      await console.sleep(3000);
      console.debug('sleep:3000:end');

      console.log(`tx: ${tx0.id}: update start`);
      const updateUser = await mUser.update({
        // firstName: await App.BCrypt.hash(`${(new Date()).getTime()}:${App.getISODate()}`),
        firstName: `${ (+mUser.firstName) +1 }`,
        // lock: LOCK_TYPE,
        // transaction: tx0,
      },{transaction: tx0});

      console.log(`tx: ${tx0.id}: commit/rollback: start`);
      const mT = (App.isObject(updateUser)) 
        ? await tx0.commit()
        : await tx0.rollback();
      console.log(`tx: ${tx0.id}: commit/rollback: end`);
      console.log(`tx: ${tx0.id}: update end`);

      console.json({
        txId: tx0.id,
        finished: tx0.finished, 
        updateUser,
      });
  
    });
    console.log('0:1');

    const tx1 = await App.DB.sequelize.transaction({
      ...App.DB.getTxOptions(),
      autocommit: false,
      isolationLevel: App.DB.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      type: App.DB.Transaction.TYPES.EXCLUSIVE, // sqlite only ???
    });

    console.debug(`tx: ${tx1.id}: get for update start`);

    const mUsers = await App.getModel('User').findAll({
      // where: {
      //   // isRestricted: false
      //   // id: 24,
      //   // id: { [App.DB.Op.gt]: 6 },
      // },
      attributes: ['id','firstName'],
      limit: 2,
      transaction: tx1,
      lock: LOCK_TYPE,
      // lock: tx1.LOCK.UPDATE,
      // lock: true,
      skipLocked: true,
      // tableHint: App.DB.TableHints.NOLOCK,
    });

    console.json({ mUsers });
    for( const mUser of mUsers ){
      const updateUser = await mUser.update({
        firstName: await App.BCrypt.hash(`${(new Date()).getTime()}:${App.getISODate()}`),
        // firstName: `${ (+mUser.firstName) +1 }`,
        // lock: LOCK_TYPE,
        // transaction: tx1,
      },{transaction: tx1});
      console.debug({updateUser});
    }

    await tx1.commit();
    console.debug(`tx: ${tx1.id}: get for update end`);

  }

})();