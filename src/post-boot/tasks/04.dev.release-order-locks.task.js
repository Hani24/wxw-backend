
module.exports = async (App, params={}, task='')=>{

  try{
    
    // NOTE: runs once @ server start up

    // console.ok(` #app:[post-boot-task]: [${task}]: inited ...`);

    // console.ok(` #app:[post-boot-task]: [${task}]: release all order locks ...`);
    // const relaseRes = await App.getModel('Order').update(
    //   {isLocked: false},
    //   {where:{}}
    // );

    // const datetime_t = App.DT.moment().subtract(1, 'minutes').format();
    // console.ok(` #app:[post-boot-task]: [${task}]: [auto] reject old [courier-order-requests] => lte: ${datetime_t}`);
    // const rejectOldCourierOrderRequests = await App.getModel('CourierOrderRequest')
    //   .update(
    //     {
    //       isRejected: true,
    //       rejectedAt: App.getISODate(),
    //     },
    //     {where:{
    //       createdAt: {
    //         [ App.DB.Op.lte ]: datetime_t
    //       },
    //       isRejected: false,
    //       isAccepted: false,
    //     }}
    //   );

    // console.json({rejectOldCourierOrderRequests});
    // console.ok(` #app:[post-boot-task]: [${task}]: inited ...`);

    return true;

  }catch(e){
    console.error(` #app:[post-boot-task]: [${task}]: ${e.message}`);
    return false;
  }

}