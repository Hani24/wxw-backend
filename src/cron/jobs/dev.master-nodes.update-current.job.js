module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  if( !App.isNodeOfTypeEnabled('master') ){
    return false;
  }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: true, // each sub-"process" own order
    isEnabled: true,
    runOnce: false,
    runAtStart: false,
    debug: config.debug, // App.isEnv('dev'),
    runAt: [
      // dev
      { each: 30, type: 'seconds' },
      // prod
      // { each: 60, type: 'seconds' },
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    const nuid = App.getNodeUID();
    // console.line();
    if(job.isDebugOn()) job.log(`#nuid: [${nuid}]: start at: ${App.getISODate()}`);

    if( !App.getModel('MasterNode').isValidNodeNuid(nuid) )
      return job.error(`#nuid: [${nuid}]: is not valid: [n]uid`);

    // const isset = await App.getModel('MasterNode').isset({ nuid, isDeleted: false, isLocked: false });
    const mMasterNode = await App.getModel('MasterNode').getNodeByNuid( nuid );
    // console.json({mMasterNode});

    if( !App.isObject(mMasterNode) || !App.isPosNumber(mMasterNode.id) )
      return job.error(`#nuid: [${nuid}]: failed to get (current) MasterNode record`);

    // const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

    try{

      // const mMasterNode = await App.getModel('MasterNode').findOne({
      //   where: {
      //     nuid,
      //     isDeleted: false,
      //     isLocked: false,
      //   },
      //   // transaction: tx,
      //   // lock: tx.LOCK.UPDATE,
      // });

      // if( !App.isObject(mMasterNode) || !App.isPosNumber(mMasterNode.id) ){
      //   // await tx.commit();
      //   return job.error(` #nuid: [${nuid}]: failed to get/create MasterNode record`);
      // }

      const updateMasterNode = await mMasterNode.update({
        lastSeenAt: App.getISODate(),
      } /*, {transaction: tx}*/);

      if( !App.isObject(updateMasterNode) || !App.isPosNumber(updateMasterNode.id) ){
        // await tx.rollback();
        return job.error(` #nuid: [${nuid}]: failed to update MasterNode record`);        
      }

      // await tx.commit();
      const lastSeenAt_f = App.DT.moment(updateMasterNode.lastSeenAt).format(App.getDateFormat());
      const lastSeenFromNow = App.DT.moment(updateMasterNode.lastSeenAt).fromNow();

      if(job.isDebugOn()){
        job.log(`   #nuid: ${updateMasterNode.nuid}: last-seen: ${lastSeenFromNow}, lastSeenAt: ${lastSeenAt_f} `);
        job.ok(`#nuid: [${nuid}]: done`);
        job.log(``);        
      }

    }catch(e){
      job.error(`#nuid: [${nuid}]: ${e.message}`);

      try{
        // await tx.rollback();
      }catch(e){
        job.error(`#nuid: [${nuid}]:rollback: ${e.message}`);
      }

    }

  });

  // Job.start();
  return Job;

}
