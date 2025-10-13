module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      // console.json({mEvent});
      // const mObject = mEvent.object;

      // account.external_account.updated
      // account.external_account.deleted
      // account.external_account.created
      // account.application.authorized
      // account.updated

      // switch(mEvent.event){

      //   case 'succeeded':
      //   case 'captured': {
      //     console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]`);
      //     break;
      //   }

      //   default:{
      //     return {success: false, message: ['unsupported','event']};
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
