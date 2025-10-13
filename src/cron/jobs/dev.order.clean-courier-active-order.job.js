module.exports = async ( App, params, BaseJob, jobName='n/a', config={} )=>{

  // if( !App.isNodeOfTypeEnabled('master') ){
  //   return false;
  // }

  // isNodeOfTypeEnabled('master')
  // getNodeConfigByType('master')

  const Job = new BaseJob( App, {
    name: jobName,
    allowMultipleTasksAtTheSameTime: false, // do not wait for prev. instance to end.
    isEnabled: false, // true,
    runOnce: false,
    runAtStart: false, // true,
    debug: config.debug,
    runAt: [
      { each: 30, type: 'seconds' }, // { each: 30, type: 'seconds' },
      // { each: 5, type: 'minutes' },
      // { each: 1, type: 'hours' },
      // { each: 10, type: 'minutes' },
      // { at: 10, type: 'hours' },
    ],
  });

  Job.on('task', async(job, {each=0,type='n/a'})=>{

    // NODE: for dev only ...
    // if( App.isEnv('prod') ) return;

    // const statuses = App.getModel('Order').getStatuses();

    // hasActiveOrder: true,
    // activeOrderAt: App.getISODate(),
    // activeOrderId: mOrder.id,

    // const minAgeOfOrderDate = App.DT.moment()
    //   .subtract('20', 'minutes')
    //   .format(App.getDateFormat()); 
    //     createdAt: { [ App.DB.Op.gt ]: minAgeOfOrderDate },

    // const mCourierOrdersToCleans = await App.getModel('Order').findAll({
    //   where: {
    //     [ App.DB.Op.and ] : [
    //       {status: {
    //         [ App.DB.Op.or ] : [
    //           // statuses['delivered'], 
    //           statuses['canceled'], 
    //         ]
    //       }},
    //       {courierId: {
    //         [ App.DB.Op.not ]: null
    //       }},
    //     ]
    //   },
    //   attributes: [
    //     'id','clientId', 'courierId','createdAt'
    //   ],
    //   include: [{
    //     model: App.getModel('Courier'),
    //     required: false,
    //     attributes: ['id','hasActiveOrder','activeOrderId','activeOrderAt'],
    //     where: {
    //       // hasActiveOrder: true
    //     }
    //   }]
    // });

    // if: for some reason (@dev state) order and/or courier get stack in unresolved/blocked state
    //  resolve it ...
    // if( mCourierOrdersToCleans.length ){
    //   console.json({mCourierOrdersToCleans});
    //   for( const mOrder of mCourierOrdersToCleans ){
    //     await mOrder.update({ courierId: null });
    //     if( mOrder.Courier.hasActiveOrder && mOrder.activeOrderId === mOrder.id ){
    //       await mOrder.Courier.update({
    //         hasActiveOrder: false,
    //         activeOrderId: null,
    //         activeOrderAt: null,
    //       });
    //     }
    //   }
    //   job.info(`done`);      
    // }

  });

  // Job.start();
  return Job;

}
