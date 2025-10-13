
module.exports = async (App, params={}, task='')=>{

  try{

    console.ok(` #app:[post-boot-task]: [${task}]: inited ...`);
    // return true;

    const mClients = await App.getModel('Client').findAll({
      where: {
        customerId: null
      },
      attributes: ['id','userId','customerId'],
      include: [{
        model: App.getModel('User'),
        required: true,
        attributes: ['id','firstName','lastName']
      }],
    });

    for( const mClient of mClients ){

      const stripeCustomerCreate = await App.payments.stripe.customerCreate({
        // email: '',
        // phone: '',
        name: `${mClient.User.firstName} ${mClient.User.lastName}`,
        description: '',
        metadata: {
          userId: mClient.userId,
          clientId: mClient.id,
        }
      });

      if( !stripeCustomerCreate.success ){
        console.error(`stripeCustomerCreate: ${stripeCustomerCreate.message}`);
        continue;
      }

      await mClient.update({
        customerId: stripeCustomerCreate.data.id,
      }); 

      console.log(` #stripeCustomerCreate: ${stripeCustomerCreate.message}: userId: ${mClient.userId}, clientId: ${mClient.id}, customerId: ${stripeCustomerCreate.data.id}`);
      await console.sleep(250);

    }

    console.ok(` #app:[post-boot-task]: [${task}]: inited ...`);
    return true;

  }catch(e){
    console.error(` #app:[post-boot-task]: [${task}]: ${e.message}`);
    return false;
  }

}