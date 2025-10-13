module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      // console.json({mEvent});
      const mObject = mEvent.object;
      const mMetadata = {};

      switch(mEvent.event){
        // case '******':{
        //   console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
        //   break;
        // }

        case 'created': {

          break;
        }
        case 'updated': {

          break;
        }
        case 'paid': {

          break;
        }
        case 'failed': {

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
