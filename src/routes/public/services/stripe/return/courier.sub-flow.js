module.exports = async(App, req, res, {data, accountId, mCourier}={})=>{

  try{

    const mUser = await App.getModel('User').getByFields({ id: mCourier.userId });
    const accountRes = await App.payments.stripe.accountGetById( accountId );
    if( !App.isObject(mUser) || !accountRes.success ){
      return await App.renderUI( res, 'message', {
        header: App.t(['Server Error'], req.lang),
        message: App.t(['server error'], req.lang, ''),
        icon: { name: 'error', size: 200 },
      });        
    }

    if( mUser.isVerified && mCourier.isKycCompleted ){
      return await App.renderUI( res, 'message', {
        header: App.t(['Info'], req.lang),
        message: App.t(['account-is-already-verified'], req.lang, ''),
        icon: { name: 'success', size: 200 },
      });
    }

    if( !mUser.isVerified && mCourier.isKycCompleted ){
      return await App.renderUI( res, 'message', {
        header: App.t(['Info'], req.lang),
        message: App.t(['kyc-after-success...'], req.lang, ''),
        icon: { name: 'success', size: 200 },
      });
    }

    const {
      id, object, business_profile, business_type, capabilities, charges_enabled, company, 
      country, created, default_currency, details_submitted, email, external_accounts, 
      future_requirements, individual, metadata, payouts_enabled, requirements, 
      settings, tos_acceptance, type
    } = accountRes.data;

    const { 
      verification,
      address: address_t, // city, country, line1, line2, postal_code, state
      first_name: firstName,
      last_name: lastName,
      phone,
    } = individual;

    if( verification.status !== 'verified' ){
      return await App.renderUI( res, 'message', {
        header: App.t(['KYC Error'], req.lang),
        message: App.t(['please-complete-kyc'], req.lang, ''),
        icon: { name: 'error', size: 200 },
      });        
    }

    await mUser.update({
      firstName,
      lastName,
      zip: address_t.postal_code || null,
      street: (`${address_t.line1 || ''} ${address_t.line1 || ''}`).trim(),
    });

    const updateCourier = await mCourier.update({
      isKycCompleted: true,
      kycCompletedAt: App.getISODate(),
      checksum: true,
    });

    await App.renderUI( res, 'message', {
      header: App.t(['Thank you!'], req.lang),
      message: App.t(['kyc-after-success...'], req.lang, '\n'),
      icon: { name: 'success', size: 200 },
    });

  }catch(e){
    console.log(e);
    await App.renderUI( res, 'message', {
      header: App.t(['Error'], req.lang),
      message: App.t(['request-could-not-be-processed'], req.lang, ''),
      icon: { name: 'error', size: 200 },
    });
    // App.onRouteError( req, res, e );
    // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
  }

}

// [get, https, BE, 141.135.200.102, api.3dmadcat.ru] [/public/services/stripe/return/account/id/acct_1L5WSMPxlFFJYO1g : {}]
// {
//   "accountRes": {
//     "success": true,
//     "message": "success",
//     "data": {
//       "id": "acct_1L5WSMPxlFFJYO1g",
//       "object": "account",
//       "business_profile": {
//         "mcc": null,
//         "name": null,
//         "product_description": "hello",
//         "support_address": null,
//         "support_email": null,
//         "support_phone": null,
//         "support_url": null,
//         "url": null
//       },
//       "business_type": "individual",
//       "capabilities": {
//         "card_payments": "active",
//         "link_payments": "active",
//         "sepa_debit_payments": "active",
//         "sofort_payments": "active",
//         "transfers": "active"
//       },
//       "charges_enabled": true,
//       "company": {
//         "address": {
//           "city": "Woodlake",
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
//         "phone": "+12011231231",
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
//       "created": 1654008844,
//       "default_currency": "usd",
//       "details_submitted": false,
//       "email": "cyyk2@coooooool.com",
//       "external_accounts": {
//         "object": "list",
//         "data": [],
//         "has_more": false,
//         "total_count": 0,
//         "url": "/v1/accounts/acct_1L5WSMPxlFFJYO1g/external_accounts"
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
//         "id": "person_1L5WSNPxlFFJYO1g2MF8CaFI",
//         "object": "person",
//         "account": "acct_1L5WSMPxlFFJYO1g",
//         "address": {
//           "city": "Woodlake",
//           "country": "US",
//           "line1": "24, Walnut Avenue",
//           "line2": null,
//           "postal_code": "94941",
//           "state": "California"
//         },
//         "created": 1654008843,
//         "dob": {
//           "day": 18,
//           "month": 9,
//           "year": 1988
//         },
//         "email": "cyyk2@coooooool.com",
//         "first_name": "Bob",
//         "future_requirements": {
//           "alternatives": [],
//           "currently_due": [],
//           "errors": [],
//           "eventually_due": [],
//           "past_due": [],
//           "pending_verification": []
//         },
//         "id_number_provided": true,
//         "last_name": "Andersen",
//         "metadata": {},
//         "phone": "+12011231231",
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
//           "currently_due": [],
//           "errors": [],
//           "eventually_due": [],
//           "past_due": [],
//           "pending_verification": []
//         },
//         "ssn_last_4_provided": true,
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
//             "front": "file_1L5YDAGYmfBHZbWKaFLo4cY0"
//           },
//           "status": "verified"
//         }
//       },
//       "metadata": {
//         "userId": "29",
//         "courierId": "6"
//       },
//       "payouts_enabled": false,
//       "requirements": {
//         "alternatives": [],
//         "current_deadline": null,
//         "currently_due": [
//           "external_account"
//         ],
//         "disabled_reason": "requirements.past_due",
//         "errors": [],
//         "eventually_due": [
//           "external_account"
//         ],
//         "past_due": [
//           "external_account"
//         ],
//         "pending_verification": []
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
//         "date": 1654008842,
//         "ip": "141.135.200.102",
//         "user_agent": null
//       },
//       "type": "custom"
//     }
//   }
// }
