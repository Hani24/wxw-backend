module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      // console.json({mEvent});
      const mObject = mEvent.object;
      const mMetadata = {};

      // const mMetadata = {
      //   orderId: ( + mEvent.object.metadata.orderId) || null,
      //   userId: ( + mEvent.object.metadata.userId) || null,
      //   clientId: ( + mEvent.object.metadata.clientId) || null,
      //   totalItems: ( + mEvent.object.metadata.totalItems) || null,
      //   totalPrice: ( + mEvent.object.metadata.totalPrice) || null,
      //   deliveryPrice: ( + mEvent.object.metadata.deliveryPrice) || null,
      //   finalPrice: Math.floor( (( + mEvent.object.metadata.finalPrice) || 0) *100 ), // cents
      // };

      // for( const mKey of Object.keys(mMetadata) ){
      //   if( App.isNull(mMetadata[ mKey ]) ){
      //     console.error(`{mMetadata}: mKey: ${mKey} => has not valid data`);
      //     console.json({mMetadata});
      //     return {success: false, message: ['one-of-the','required','keys','is-missing']};
      //   }
      // }

      switch(mEvent.event){
        case 'created':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'updated':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'reversed':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'paid':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'failed':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
      }

      return {success: true, message: ['event',mEvent.event,'of-type',mEvent.type,'has-been','processed']};

    }catch(e){
      console.error(` #${mStripePayment.name}:[h]:${eventGroupType}: ${e.message}`);
      console.error(e);
      return {success: false, message: ['failed-to','handle',eventGroupType,'event']};
    }
  }

}
