module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      // const mObject = mEvent.object;
      // const mMetadata = {};

      //   case 'issuing_card.created': break;
      //   case 'issuing_card.updated': break;

      // switch(mEvent.event){
      //   case '******':{
      //     console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
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
