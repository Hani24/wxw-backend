module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      // const mObject = mEvent.object;
      // const mMetadata = {};

      // switch(mEvent.event){
      //   case 'available':{
      //     console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mEvent)}}`);
      //     break;
      //   }
      // }

      return {success: true, message: ['event',mEvent.event,'of-type',mEvent.type,'has-been','processed']};

    }catch(e){
      console.error(` #${mStripePayment.name}:[h]:${eventGroupType}: ${e.message}`);
      console.error(e);
      return {success: false, message: ['failed-to','handle',eventGroupType,'event']};
    }
  }

}
