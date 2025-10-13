module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      const mObject = mEvent.object;

      const mMetadata = {
        id: mObject.id,
        object: mObject.object,
        address: mObject.address,
        name: mObject.name,
        email: mObject.email,
        phone: mObject.phone,
        userId: (+mObject.metadata.userId),
        clientId: (+mObject.metadata.clientId),
        created: mObject.created,
      };

      switch(mEvent.event){
        case 'created':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'updated':{
          console.debug(` type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'deleted':{
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
