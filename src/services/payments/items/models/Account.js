// https://stripe.com/docs/api/accounts/create?lang=node#create_account

// {
//   country: 'US',
//   type: 'custom',
//   email: '', // The email address of the account holder. This is only to make the account easier to identify to you. Stripe only emails Custom accounts with your consent.
//   // business_type: ENUM: [string] [ individual | company | non_profit | government_entity(US only) ],
//   business_type: 'individual', // ENUM: [string] [ individual | company | non_profit | government_entity(US only) ],
//   default_currency: 'USD', // https://stripe.com/docs/payouts
//   capabilities: {
//     card_payments: {requested: true},
//     transfers: {requested: true},
//     bank_transfer_payments: {requested: true},
//     // sofort_payments
//     // sepa_debit_payments
//     // link_payments
//   },
//   metadata: {
//     ... 
//   },
//   // NOTE: Information about the person represented by the account. This field is null unless business_type is set to individual.
//   individual: {
//     // full_name_aliases: '',
//     // gender: ENUM: [string]: [male | female],
//     first_name: '', // optional
//     last_name: '', // optional
//     maiden_name: '', // optional
//     id_number: null, // optional // The government-issued ID number of the individual, as appropriate for the representative’s country. (Examples are a Social Security Number in the U.S., or a Social Insurance Number in Canada)
//     email: '', // optional
//     phone: '', // optional
//     address: {
//       country: 'US', // Two-letter country code (ISO 3166-1 alpha-2).
//       state: '',
//       postal_code: null,
//       city: '',
//       line1: '', // (e.g., street, PO Box, or company name).
//       line2: '', // (e.g., apartment, suite, unit, or building)
//     },
//     dob: {
//       day: 1, // required, The day of birth, between 1 and 31.
//       month: 1, // required, // The month of birth, between 1 and 12.
//       year: 2022, // required, // The four-digit year of birth.
//     },
//   },
//   tos_acceptance: {
//     date: 1609798905,
//     ip: '8.8.8.8',
//     // https://stripe.com/docs/connect/updating-accounts#tos-acceptance
//     // const account = await stripe.accounts.update(
//     //   '{{CONNECTED_STRIPE_ACCOUNT_ID}}',
//     //   {tos_acceptance: {date: 1609798905, ip: '8.8.8.8'}}
//     // );
//   },
//   business_profile: {
//     // https://stripe.com/docs/api/accounts/create?lang=node#create_account-business_profile
//   },

// }


// const clientInfo = {
//   firstName: 'Bob',
//   lastName: 'Andersen',
//   email: 'Bob.Andersen@email.tld',
//   phone: '+14081234567', // '+32498403994',
//   birthday: (new Date('1988-01-01')).toISOString(),
//   metadata: {
//     userId: 123,
//     courierId: 456,
//   }
// };

// const addressInfo = {
//   state: 'California',
//   zip: '94941',
//   city: 'Mill Valley',
//   street: '24, Walnut Avenue',
// };

// console.json({
//   account: await App.payments.stripe.accountCreate( clientInfo, addressInfo, {ip:false} )
// });

// account.data.id === acct_***;
// account.data.individual.id === person_***;

module.exports = Account = class Account{

  // Account.parse( App, {firstName,lastName,email,phone,name,birthday, metadata}, {state,zip,city,street}, {ip:false} );
  static parse( App, clientInfo={}, addressInfo={}, extra={} ){
 
    try{

      // const account = await stripe.accounts.update(
      //   '{{CONNECTED_STRIPE_ACCOUNT_ID}}',
      //   {tos_acceptance: {date: 1609798905, ip: '8.8.8.8'}}
      // );

      clientInfo = (App.isObject(clientInfo) ? clientInfo : {});
      addressInfo = (App.isObject(addressInfo) ? addressInfo : {});
      extra = (App.isObject(extra) ? extra : {});

      const metadata_t = (App.isObject(clientInfo.metadata) ? clientInfo.metadata : null);
      const firstName = (App.isString(clientInfo.firstName)?clientInfo.firstName : null);
      const lastName = (App.isString(clientInfo.lastName)?clientInfo.lastName : null);
      const email = (App.isString(clientInfo.email) ? clientInfo.email : null);
      const phone = (App.isString(clientInfo.phone) ? clientInfo.phone : null);
      const birthday = (App.isString(clientInfo.birthday)?(new Date(clientInfo.birthday)):null);
      const country = 'US';

      let address_t = {
        country, 
        state: (addressInfo.state || null),
        postal_code: (addressInfo.zip || null),
        city: (addressInfo.city || null),
        line1: (addressInfo.street || null),
        line2: null,
      };

      // remove all non-valid-fields, else it will be nulled-out if not pressent 
      for( const mKey of Object.keys(address_t) )
        if( App.isNull(address_t[mKey]) ) delete address_t[ mKey ];

      address_t = (Object.keys(address_t).length ? address_t : null);

      let dob_t = (App.isObject(birthday)) ? {
        year: (birthday.getFullYear()),
        month: (birthday.getMonth() +1),
        day: (birthday.getDate()),
      } : null;

      if( App.isObject(dob_t) ){
        for( const mKey of Object.keys(address_t) )
          if( App.isNull(address_t[mKey]) ) delete address_t[ mKey ];

        dob_t = (Object.keys(dob_t).length ? dob_t : null);
        if( App.isObject(dob_t) && dob_t.year && ( (new Date()).getFullYear() - dob_t.year) < 13 )
          return {success: false, message: 'Client must be at least 13 years old', data: {}};

      }

      // Line 1: Apt. 123 (or other secondary designation, i.e. suite, floor).
      // Line 2: 321 Main Street (street address)
      // Line 3: City, State, ZIP Code
      // ||
      // LINE 1 : House no.45 second floor, 5th cross.
      // LINE 2 : Banaswadi, Bangalore, KA 560043.

      const account_t = {
        country, // - remove on:update
        type: 'custom', // - remove on:update
        email: email,
        business_type: 'individual',
        default_currency: 'USD',
        capabilities: {
          card_payments: {requested: true},
          transfers: {requested: true},
          // bank_transfer_payments: {requested: true}, // "The bank_transfer_payments capability is not requestable for accounts in US."
          // sofort_payments: {requested: true},
          // sepa_debit_payments: {requested: true},
          // link_payments: {requested: true},
        },
        individual: {
          // full_name_aliases: '',
          // gender: ENUM: [string]: [male | female],
          first_name: firstName, // optional
          last_name: lastName, // optional
          maiden_name: null, // optional
          id_number: null, // optional // The government-issued ID number of the individual, as appropriate for the representative’s country. (Examples are a Social Security Number in the U.S., or a Social Insurance Number in Canada)
          email: email, // optional
          // phone: phone, // optional
          // address: address_t,
          // dob: dob_t,
        },
        tos_acceptance: {
          date: Math.floor( (new Date()).getTime() /1000 ),
          ip: (extra.ip || '127.0.0.1'),
        },
      };

      if( App.isObject(address_t) )
        account_t.individual.address = address_t;

      if( App.isObject(dob_t) )
        account_t.individual.dob = dob_t;

      if( App.isObject(metadata_t) )
        account_t.metadata = metadata_t;

      return {success: true, message: 'OK', data: account_t}

    }catch(e){
      console.warn(` #stripe:Account: ${e.message}`);
      console.error(e.stack);
      return {success: false, message: 'Failed to parse Account', data: {}}
    }

  }

}

// {
//   "account": {
//     "success": true,
//     "message": "success",
//     "data": {
//       "id": "acct_1L5ULcQ9MHkXq0vl",
//       "object": "account",
//       "business_profile": {
//         "mcc": null,
//         "name": null,
//         "product_description": null,
//         "support_address": null,
//         "support_email": null,
//         "support_phone": null,
//         "support_url": null,
//         "url": null
//       },
//       "business_type": "individual",
//       "capabilities": {
//         "card_payments": "inactive",
//         "link_payments": "inactive",
//         "sepa_debit_payments": "inactive",
//         "sofort_payments": "inactive",
//         "transfers": "inactive"
//       },
//       "charges_enabled": false,
//       "company": {
//         "address": {
//           "city": "Mill Valley",
//           "country": "US",
//           "line1": "24, Walnut Avenue",
//           "line2": null,
//           "postal_code": "94941",
//           "state": "California"
//         },
//         "directors_provided": true,
//         "executives_provided": true,
//         "name": null,
//         "owners_provided": true,
//         "phone": "+14081234567",
//         "tax_id_provided": false,
//         "verification": {
//           "document": {
//             "back": null,
//             "details": null,
//             "details_code": null,
//             "front": null
//           }
//         }
//       },
//       "country": "US",
//       "created": 1654000737,
//       "default_currency": "usd",
//       "details_submitted": false,
//       "email": "Bob.Andersen@email.tld",
//       "external_accounts": {
//         "object": "list",
//         "data": [],
//         "has_more": false,
//         "total_count": 0,
//         "url": "/v1/accounts/acct_1L5ULcQ9MHkXq0vl/external_accounts"
//       },
//       "future_requirements": {
//         "alternatives": [],
//         "current_deadline": null,
//         "currently_due": [],
//         "disabled_reason": null,
//         "errors": [],
//         "eventually_due": [],
//         "past_due": [],
//         "pending_verification": []
//       },
//       "individual": {
//         "id": "person_1L5ULcQ9MHkXq0vlZqBTyOuL",
//         "object": "person",
//         "account": "acct_1L5ULcQ9MHkXq0vl",
//         "address": {
//           "city": "Mill Valley",
//           "country": "US",
//           "line1": "24, Walnut Avenue",
//           "line2": null,
//           "postal_code": "94941",
//           "state": "California"
//         },
//         "created": 1654000737,
//         "dob": {
//           "day": 1,
//           "month": 1,
//           "year": 1988
//         },
//         "email": "Bob.Andersen@email.tld",
//         "first_name": "Bob",
//         "future_requirements": {
//           "alternatives": [],
//           "currently_due": [],
//           "errors": [],
//           "eventually_due": [],
//           "past_due": [],
//           "pending_verification": []
//         },
//         "id_number_provided": false,
//         "last_name": "Andersen",
//         "metadata": {},
//         "phone": "+14081234567",
//         "relationship": {
//           "director": false,
//           "executive": false,
//           "owner": false,
//           "percent_ownership": null,
//           "representative": true,
//           "title": null
//         },
//         "requirements": {
//           "alternatives": [],
//           "currently_due": [
//             "ssn_last_4"
//           ],
//           "errors": [],
//           "eventually_due": [
//             "ssn_last_4"
//           ],
//           "past_due": [
//             "ssn_last_4"
//           ],
//           "pending_verification": [
//             "address.city",
//             "address.line1",
//             "address.postal_code",
//             "address.state"
//           ]
//         },
//         "ssn_last_4_provided": false,
//         "verification": {
//           "additional_document": {
//             "back": null,
//             "details": null,
//             "details_code": null,
//             "front": null
//           },
//           "details": null,
//           "details_code": null,
//           "document": {
//             "back": null,
//             "details": null,
//             "details_code": null,
//             "front": null
//           },
//           "status": "unverified"
//         }
//       },
//       "metadata": {
//         "userId": "123",
//         "courierId": "456"
//       },
//       "payouts_enabled": false,
//       "requirements": {
//         "alternatives": [],
//         "current_deadline": null,
//         "currently_due": [
//           "business_profile.mcc",
//           "business_profile.url",
//           "external_account",
//           "individual.ssn_last_4"
//         ],
//         "disabled_reason": "requirements.past_due",
//         "errors": [],
//         "eventually_due": [
//           "business_profile.mcc",
//           "business_profile.url",
//           "external_account",
//           "individual.ssn_last_4"
//         ],
//         "past_due": [
//           "business_profile.mcc",
//           "business_profile.url",
//           "external_account",
//           "individual.ssn_last_4"
//         ],
//         "pending_verification": [
//           "individual.address.city",
//           "individual.address.line1",
//           "individual.address.postal_code",
//           "individual.address.state"
//         ]
//       },
//       "settings": {
//         "bacs_debit_payments": {},
//         "branding": {
//           "icon": null,
//           "logo": null,
//           "primary_color": null,
//           "secondary_color": null
//         },
//         "card_issuing": {
//           "tos_acceptance": {
//             "date": null,
//             "ip": null
//           }
//         },
//         "card_payments": {
//           "decline_on": {
//             "avs_failure": false,
//             "cvc_failure": false
//           },
//           "statement_descriptor_prefix": null
//         },
//         "dashboard": {
//           "display_name": null,
//           "timezone": "Etc/UTC"
//         },
//         "payments": {
//           "statement_descriptor": null,
//           "statement_descriptor_kana": null,
//           "statement_descriptor_kanji": null
//         },
//         "payouts": {
//           "debit_negative_balances": false,
//           "schedule": {
//             "delay_days": 2,
//             "interval": "daily"
//           },
//           "statement_descriptor": null
//         },
//         "sepa_debit_payments": {}
//       },
//       "tos_acceptance": {
//         "date": 1654000736,
//         "ip": "127.0.0.1",
//         "user_agent": null
//       },
//       "type": "custom"
//     }
//   }
// }