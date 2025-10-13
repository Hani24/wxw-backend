
module.exports = Customer = class Customer{

  static parse( App, clientInfo={}, addressInfo={} ){

    try{

      // https://stripe.com/docs/api/customers/create?lang=node
      const customer_t = {
        // optional
        description: (App.isString(clientInfo.description) ? clientInfo.description : null),
        email: (App.isString(clientInfo.email) ? clientInfo.email : null), 
        phone: (App.isString(clientInfo.phone) ? clientInfo.phone : null), 
        name: (App.isString(clientInfo.name) ? clientInfo.name : null), // The customer’s full name or business name.
        metadata: (App.isObject(clientInfo.metadata) ? clientInfo.metadata : null),
        balance: (App.isNumber(+clientInfo.balance)?(+clientInfo.balance):0),
        // => this is not the same method for adding data, see docs
        // payment_method: // The ID of the PaymentMethod to attach to the customer.
      };

      for( const mKey of Object.keys(customer_t) )
        if( App.isNull(customer_t[ mKey ]) )
          delete customer_t[ mKey ];

      if( App.isObject(addressInfo) ){
        customer_t.address = {
          country : (App.isString(addressInfo.country) ? addressInfo.country : 'US'), // Two-letter country code (ISO 3166-1 alpha-2).
          state : (App.isString(addressInfo.state) ? addressInfo.state : null), // State, county, province, or region
          city : (App.isString(addressInfo.city) ? addressInfo.city : null), // City, district, suburb, town, or village.
          postal_code : (App.isString(addressInfo.postal_code) ? addressInfo.postal_code : null), // ZIP or postal code
          line1 : (App.isString(addressInfo.line1) ? addressInfo.line1 : null), // (e.g., street, PO Box, or company name).
          line2 : (App.isString(addressInfo.line2) ? addressInfo.line2 : null), // (e.g., apartment, suite, unit, or building).
        };

        for( const mKey of Object.keys(customer_t.address) )
          if( App.isNull(customer_t.address[ mKey ]) )
            delete customer_t.address[ mKey ];

      }

      return {success: true, message: 'OK', data: customer_t}

    }catch(e){
      console.warn(` #stripe:Customer: ${e.message}`);
      console.error(e.stack);
      return {success: false, message: 'Failed to parse Customer', data: {}}
    }

  }

}