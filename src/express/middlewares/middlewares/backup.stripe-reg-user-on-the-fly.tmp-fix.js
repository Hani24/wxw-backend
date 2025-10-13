(async()=>{

  // TODO: temporary fix: remove it later .... 
  if( !req.client.customerId ){
    const stripeCustomerCreate = await App.payments.stripe.customerCreate({
      email: req.user.email,
      name: `${req.user.firstName} ${req.user.lastName}`,
      description: 'new customer',
      metadata: {
        userId: req.user.id,
        clientId: req.client.id,
      }
    });

    if( !stripeCustomerCreate.success ){
      console.json({stripeCustomerCreate});
    }else{
      const setClientCustomerId = await req.client.update({ customerId: stripeCustomerCreate.data.id });
      if( !App.isObject(setClientCustomerId) || !App.isPosNumber(setClientCustomerId.id) ){
        console.error(`failed to update: [Client.customerId]` );
      }                
    }
  }
})();