module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      const mObject = mEvent.object;

      const mMetadata = {
        orderId: ( + mObject.metadata.orderId) || null,
        userId: ( + mObject.metadata.userId) || null,
        clientId: ( + mObject.metadata.clientId) || null,
        totalItems: ( + mObject.metadata.totalItems) || null,
        totalPrice: ( + mObject.metadata.totalPrice) || null,
        // For catering and on-site-presence orders, deliveryPrice can be 0
        deliveryPrice: mObject.metadata.deliveryPrice !== undefined ? ( + mObject.metadata.deliveryPrice) : null,
        finalPrice: Math.floor( (( + mObject.metadata.finalPrice) || 0) *100 ), // cents
      };

      // console.json({mMetadata});

      for( const mKey of Object.keys(mMetadata) ){
        // Allow deliveryPrice to be 0 for catering and on-site-presence orders
        if( mKey === 'deliveryPrice' ){
          if( mMetadata[ mKey ] === null || mMetadata[ mKey ] === undefined ){
            console.error(`{mMetadata}: mKey: ${mKey} => has not valid data`);
            return {success: false, message: ['one-of-the','required','keys','is-missing']};
          }
        } else {
          if( App.isNull(mMetadata[ mKey ]) ){
            console.error(`{mMetadata}: mKey: ${mKey} => has not valid data`);
            return {success: false, message: ['one-of-the','required','keys','is-missing']};
          }
        }
      }

      const PAYMENT_INTENT = mObject.id;

      // Check if this is a first payment or second payment
      const paymentType = mObject.metadata.paymentType || 'full_payment';
      const ORDER_TYPES = App.getModel('Order').getOrderTypes();

      let mOrder = await App.getModel('Order').findOne({
        where: {
          paymentIntentId: PAYMENT_INTENT,
          id: mMetadata.orderId,
          clientId: mMetadata.clientId,
        },
      });

      // If not found with main paymentIntentId, check split payment intents
      if(!App.isObject(mOrder) && (paymentType === 'first_payment' || paymentType === 'second_payment')){
        // Search in catering details
        const cateringDetails = await App.getModel('OrderCateringDetails').findOne({
          where: {
            [paymentType === 'first_payment' ? 'firstPaymentIntentId' : 'secondPaymentIntentId']: PAYMENT_INTENT
          },
          include: [{
            model: App.getModel('Order'),
            as: 'Order',
            where: {
              id: mMetadata.orderId,
              clientId: mMetadata.clientId,
            }
          }]
        });

        if(App.isObject(cateringDetails) && cateringDetails.Order){
          mOrder = cateringDetails.Order;
        } else {
          // Search in on-site presence details
          const onSiteDetails = await App.getModel('OrderOnSitePresenceDetails').findOne({
            where: {
              [paymentType === 'first_payment' ? 'firstPaymentIntentId' : 'secondPaymentIntentId']: PAYMENT_INTENT
            },
            include: [{
              model: App.getModel('Order'),
              as: 'Order',
              where: {
                id: mMetadata.orderId,
                clientId: mMetadata.clientId,
              }
            }]
          });

          if(App.isObject(onSiteDetails) && onSiteDetails.Order){
            mOrder = onSiteDetails.Order;
          }
        }
      }

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return{ success: false, message: ` #${mMetadata.id}: Payment-Intent: [${PAYMENT_INTENT}]: is not available in the orders` };

      if( !mOrder.isValidChecksum )
        return {success: false, message: `Order: ${mOrder.id} Security check error`};

      switch(mEvent.event){

        case 'created':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'processing':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'amount_capturable_updated':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }
        case 'payment_failed':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        case 'succeeded': {
          // pass: no extra action => handled in [event]:./charge.handler.js
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        case 'partially_funded': {
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        case 'requires_action':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);

          if( mOrder.isPaid )
            return {success: true, message: ['order','already','has-been','paid']};

          if( mOrder.isRefunded )
            return {success: true, message: ['order','already','has-been','refunded']};

          // mObject.
          //   "charges": {
          //     "object": "list",
          //     "data": [],
          //     "has_more": false,
          //     "total_count": 0,
          //     "url": "/v1/charges?payment_intent=pi_3KOOcWLkgFoZ4U2T1bLdljst"
          //   },
          //   "client_secret": "pi_3KOOcWLkgFoZ4U2T1bLdljst_secret_2MbNVhLSJDHNJMuBhnylGvXhu",

          const updateOrderRes = await mOrder.update({
            isClientActionRequired: true,
            clientActionRequiredAt: App.getISODate(),
            clientSecret: mObject.client_secret,
            checksum: true,
          });

          if( !App.isObject(updateOrderRes) || !App.isPosNumber(updateOrderRes.id) )
            return {success: false, message: ` failed to update order [isPaid] status`};

          const paymentActionRequiredPushRes = await App.getModel('ClientNotification')
            .pushToClientById( mOrder.clientId, {
              type: App.getModel('ClientNotification').getTypes()['paymentActionRequired'],
              title: `Order: #${mOrder.id}: ${App.t(['action is required'])}`, 
              message: App.t(['Payment action is required']),
              data: {
                orderId: mOrder.id,
              }
            });
          console.debug(`paymentActionRequiredPushRes: ${paymentActionRequiredPushRes.message}`);
          break;
        }

        case 'canceled': {
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);

          // {
          //   "mEvent": {
          //     "type": "payment_intent",
          //     "event": "canceled",
          //     "object": {
          //       "id": "pi_3KTFfvLkgFoZ4U2T0ISsvWx2",
          //       "object": "payment_intent",
          //       "amount": 711,
          //       "amount_capturable": 0,
          //       "amount_received": 0,
          //       "application": null,
          //       "application_fee_amount": null,
          //       "automatic_payment_methods": null,
          //       "canceled_at": 1644888712,
          //       "cancellation_reason": "abandoned",
          //       "capture_method": "automatic",
          //       "charges": {
          //         "object": "list",
          //         "data": [],
          //         "has_more": false,
          //         "total_count": 0,
          //         "url": "/v1/charges?payment_intent=pi_3KTFfvLkgFoZ4U2T0ISsvWx2"
          //       },
          //       "client_secret": "pi_3KTFfvLkgFoZ4U2T0ISsvWx2_secret_EKxSNchgAao3esuYYg4iCCGJy",
          //       "confirmation_method": "automatic",
          //       "created": 1644887871,
          //       "currency": "eur",
          //       "customer": "cus_KcmMsBW1A2E0nl",
          //       "description": "Order: #10000000172",
          //       "invoice": null,
          //       "last_payment_error": null,
          //       "livemode": false,
          //       "metadata": {
          //         "orderId": "10000000172",
          //         "userId": "6",
          //         "clientId": "2",
          //         "totalItems": "2",
          //         "totalPrice": "2.5",
          //         "deliveryPrice": "4.61",
          //         "finalPrice": "7.11"
          //       },
          //       "next_action": null,
          //       "on_behalf_of": null,
          //       "payment_method": "pm_1JxWpgLkgFoZ4U2TLaGC98hz",
          //       "payment_method_options": {
          //         "card": {
          //           "installments": null,
          //           "network": null,
          //           "request_three_d_secure": "automatic"
          //         }
          //       },
          //       "payment_method_types": [
          //         "card"
          //       ],
          //       "processing": null,
          //       "receipt_email": "ch3ll0v3k@yandex.com",
          //       "review": null,
          //       "setup_future_usage": null,
          //       "shipping": null,
          //       "source": null,
          //       "statement_descriptor": null,
          //       "statement_descriptor_suffix": null,
          //       "status": "canceled",
          //       "transfer_data": null,
          //       "transfer_group": null
          //     }
          //   }
          // }

          // Update order ???

        }

        default: {

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


// [created]
// {
//   "mEvent": {
//     "type": "payment_intent",
//     "event": "created",
//     "object": {
//       "id": "pi_3KOORzLkgFoZ4U2T19lhfVyp",
//       "object": "payment_intent",
//       "amount": 586,
//       "amount_capturable": 0,
//       "amount_received": 0,
//       "application": null,
//       "application_fee_amount": null,
//       "automatic_payment_methods": null,
//       "canceled_at": null,
//       "cancellation_reason": null,
//       "capture_method": "automatic",
//       "charges": {
//         "object": "list",
//         "data": [],
//         "has_more": false,
//         "total_count": 0,
//         "url": "/v1/charges?payment_intent=pi_3KOORzLkgFoZ4U2T19lhfVyp"
//       },
//       "client_secret": "pi_3KOORzLkgFoZ4U2T19lhfVyp_secret_yTFWcoaisjhaItSg7f7UjYYvN",
//       "confirmation_method": "automatic",
//       "created": 1643729963,
//       "currency": "eur",
//       "customer": "cus_KcmMsBW1A2E0nl",
//       "description": "Order: #10000000163",
//       "invoice": null,
//       "last_payment_error": null,
//       "livemode": false,
//       "metadata": {
//         "orderId": "10000000163",
//         "userId": "6",
//         "clientId": "2",
//         "totalItems": "1",
//         "totalPrice": "1.25",
//         "deliveryPrice": "4.61",
//         "finalPrice": "5.86"
//       },
//       "next_action": null,
//       "on_behalf_of": null,
//       "payment_method": null,
//       "payment_method_options": {
//         "card": {
//           "installments": null,
//           "network": null,
//           "request_three_d_secure": "automatic"
//         }
//       },
//       "payment_method_types": [
//         "card"
//       ],
//       "processing": null,
//       "receipt_email": "ch3ll0v3k@yandex.com",
//       "review": null,
//       "setup_future_usage": null,
//       "shipping": null,
//       "source": null,
//       "statement_descriptor": null,
//       "statement_descriptor_suffix": null,
//       "status": "requires_payment_method",
//       "transfer_data": null,
//       "transfer_group": null
//     }
//   }
// }


// [requires_action]

// {
//   "mEvent": {
//     "type": "payment_intent",
//     "event": "requires_action",
//     "object": {
//       "id": "pi_3KOOcWLkgFoZ4U2T1bLdljst",
//       "object": "payment_intent",
//       "amount": 586,
//       "amount_capturable": 0,
//       "amount_received": 0,
//       "application": null,
//       "application_fee_amount": null,
//       "automatic_payment_methods": null,
//       "canceled_at": null,
//       "cancellation_reason": null,
//       "capture_method": "automatic",
//       "charges": {
//         "object": "list",
//         "data": [],
//         "has_more": false,
//         "total_count": 0,
//         "url": "/v1/charges?payment_intent=pi_3KOOcWLkgFoZ4U2T1bLdljst"
//       },
//       "client_secret": "pi_3KOOcWLkgFoZ4U2T1bLdljst_secret_2MbNVhLSJDHNJMuBhnylGvXhu",
//       "confirmation_method": "automatic",
//       "created": 1643730616,
//       "currency": "eur",
//       "customer": "cus_KcmMsBW1A2E0nl",
//       "description": "Order: #10000000165",
//       "invoice": null,
//       "last_payment_error": null,
//       "livemode": false,
//       "metadata": {
//         "orderId": "10000000165",
//         "userId": "6",
//         "clientId": "2",
//         "totalItems": "1",
//         "totalPrice": "1.25",
//         "deliveryPrice": "4.61",
//         "finalPrice": "5.86"
//       },
//       "next_action": {
//         "type": "use_stripe_sdk",
//         "use_stripe_sdk": {
//           "type": "stripe_3ds2_fingerprint",
//           "merchant": "acct_1JwPICLkgFoZ4U2T",
//           "three_d_secure_2_source": "src_1KOOckLkgFoZ4U2TOIkCNBzl",
//           "directory_server_name": "visa",
//           "server_transaction_id": "cf0c84de-6a6a-47f8-a6bd-65c8818a53b2",
//           "three_ds_method_url": "",
//           "three_ds_optimizations": "k",
//           "directory_server_encryption": {
//             "directory_server_id": "A000000003",
//             "algorithm": "RSA",
//             "certificate": "-----BEGIN CERTIFICATE-----\nMIIGAzCCA+ugAwIBAgIQDaAlB1IbPwgx5esGu9tLIjANBgkqhkiG9w0BAQsFADB2\nMQswCQYDVQQGEwJVUzENMAsGA1UECgwEVklTQTEvMC0GA1UECwwmVmlzYSBJbnRl\ncm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xJzAlBgNVBAMMHlZpc2EgZUNv\nbW1lcmNlIElzc3VpbmcgQ0EgLSBHMjAeFw0yMTA4MjMxNTMyMzNaFw0yNDA4MjIx\nNTMyMzNaMIGhMRgwFgYDVQQHDA9IaWdobGFuZHMgUmFuY2gxETAPBgNVBAgMCENv\nbG9yYWRvMQswCQYDVQQGEwJVUzENMAsGA1UECgwEVklTQTEvMC0GA1UECwwmVmlz\nYSBJbnRlcm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xJTAjBgNVBAMMHDNk\nczIucnNhLmVuY3J5cHRpb24udmlzYS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IB\nDwAwggEKAoIBAQCy34cZ88+xfenoccRD1jOi6uVCPXo2xyabXcKntxl7h1kHahac\nmpnuiH+kSgSg4DEHDXHg0WBcpMp0cB67dUE1XDxLAxN0gL5fXpVX7dUjI9tS8lcW\nndChHxZTA8HcXUtv1IwU1L3luhgNkog509bRw/V1GLukW6CwFRkMI/8fecV8EUcw\nIGiBr4/cAcaPnLxFWm/SFL2NoixiNf6LnwHrU4YIHsPQCIAM1km4XPDb7Gk2S3o0\nkkXroU87yoiHzFHbEZUN/tO0Juyz8K6AtGBKoppv1hEHz9MFNzLlvGPo7wcPpovb\nMYtwxj10KhtfEKh0sS0yMl1Uvw36JmuwjaC3AgMBAAGjggFfMIIBWzAMBgNVHRMB\nAf8EAjAAMB8GA1UdIwQYMBaAFL0nYyikrlS3yCO3wTVCF+nGeF+FMGcGCCsGAQUF\nBwEBBFswWTAwBggrBgEFBQcwAoYkaHR0cDovL2Vucm9sbC52aXNhY2EuY29tL2VD\nb21tRzIuY3J0MCUGCCsGAQUFBzABhhlodHRwOi8vb2NzcC52aXNhLmNvbS9vY3Nw\nMEYGA1UdIAQ/MD0wMQYIKwYBBQUHAgEwJTAjBggrBgEFBQcCARYXaHR0cDovL3d3\ndy52aXNhLmNvbS9wa2kwCAYGZ4EDAQEBMBMGA1UdJQQMMAoGCCsGAQUFBwMCMDUG\nA1UdHwQuMCwwKqAooCaGJGh0dHA6Ly9lbnJvbGwudmlzYWNhLmNvbS9lQ29tbUcy\nLmNybDAdBgNVHQ4EFgQU/JtqQ7VLWNd3/9zQjpnsR2rz+cwwDgYDVR0PAQH/BAQD\nAgSwMA0GCSqGSIb3DQEBCwUAA4ICAQBYOGCI/bYG2gmLgh7UXg5qrt4xeDYe4RXe\n5xSjFkTelNvdf+KykB+oQzw8ZobIY+pKsPihM6IrtoJQuzOLXPV5L9U4j1qa/NZB\nGZTXFMwKGN/v0/tAj3h8wefcLPWb15RsXEpZmA87ollezpXeEHXPhFIit7cHoG5P\nfem9yMuDISI97qbnIKNtFENJr+fMkWIykQ0QnkM1rt99Yv2ZE4GWZN7VJ0zXFqOF\nNF2IVwnTIZ21eDiCOjQr6ohq7bChDMelB5XvEuhfe400DqDP+e5pPHo81ecXkjJK\ngS5grYYZIbeDBdQL1Cgs1mGu6On8ecr0rcpRlQh++BySg9MKkzJdLt1vsYmxfrfb\nkUaLglTdYAU2nYaOEDR4NvkRxfzegXyXkOqfPTmfkrg+OB0LeuICITJGJ0cuZD5W\nGUNaT9WruEANBRJNVjSX1UeJUnCpz4nitT1ml069ONjEowyWUcKvTr4/nrargv2R\npOD4RPJMti6kG+bm9OeATiSgVNmO5lkAS4AkOop2IcbRFcVKJUTOhx2Q37L4nuAH\nTCXQ9vwT4yWz6fVaCfL/FTvCGMilLPzXC/00OPA2ZtWvClvFh/uHJBjRUnj6WXp3\nO9p9uHfdV9eKJH37k94GUSMjBKQ6aIru1VUvSOmUPrDz5JbQB7bP+IzUaFHeweZX\nOWumZmyGDw==\n-----END CERTIFICATE-----\n",
//             "root_certificate_authorities": [
//               "-----BEGIN CERTIFICATE-----\nMIIDojCCAoqgAwIBAgIQE4Y1TR0/BvLB+WUF1ZAcYjANBgkqhkiG9w0BAQUFADBr\nMQswCQYDVQQGEwJVUzENMAsGA1UEChMEVklTQTEvMC0GA1UECxMmVmlzYSBJbnRl\ncm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xHDAaBgNVBAMTE1Zpc2EgZUNv\nbW1lcmNlIFJvb3QwHhcNMDIwNjI2MDIxODM2WhcNMjIwNjI0MDAxNjEyWjBrMQsw\nCQYDVQQGEwJVUzENMAsGA1UEChMEVklTQTEvMC0GA1UECxMmVmlzYSBJbnRlcm5h\ndGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xHDAaBgNVBAMTE1Zpc2EgZUNvbW1l\ncmNlIFJvb3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCvV95WHm6h\n2mCxlCfLF9sHP4CFT8icttD0b0/Pmdjh28JIXDqsOTPHH2qLJj0rNfVIsZHBAk4E\nlpF7sDPwsRROEW+1QK8bRaVK7362rPKgH1g/EkZgPI2h4H3PVz4zHvtH8aoVlwdV\nZqW1LS7YgFmypw23RuwhY/81q6UCzyr0TP579ZRdhE2o8mCP2w4lPJ9zcc+U30rq\n299yOIzzlr3xF7zSujtFWsan9sYXiwGd/BmoKoMWuDpI/k4+oKsGGelT84ATB+0t\nvz8KPFUgOSwsAGl0lUq8ILKpeeUYiZGo3BxN77t+Nwtd/jmliFKMAGzsGHxBvfaL\ndXe6YJ2E5/4tAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQD\nAgEGMB0GA1UdDgQWBBQVOIMPPyw/cDMezUb+B4wg4NfDtzANBgkqhkiG9w0BAQUF\nAAOCAQEAX/FBfXxcCLkr4NWSR/pnXKUTwwMhmytMiUbPWU3J/qVAtmPN3XEolWcR\nzCSs00Rsca4BIGsDoo8Ytyk6feUWYFN4PMCvFYP3j1IzJL1kk5fui/fbGKhtcbP3\nLBfQdCVp9/5rPJS+TUtBjE7ic9DjkCJzQ83z7+pzzkWKsKZJ/0x9nXGIxHYdkFsd\n7v3M9+79YKWxehZx0RbQfBI8bGmX265fOZpwLwU8GUYEmSA20GBuYQa7FkKMcPcw\n++DbZqMAAb3mLNqRX6BGi01qnD093QVG/na/oAo85ADmJ7f/hC3euiInlhBx6yLt\n398znM/jra6O1I7mT1GvFpLgXPYHDw==\n-----END CERTIFICATE-----\n",
//               "-----BEGIN CERTIFICATE-----\nMIIFqTCCA5GgAwIBAgIPUT6WAAAA20Qn7qzgvuFIMA0GCSqGSIb3DQEBCwUAMG8x\nCzAJBgNVBAYTAlVTMQ0wCwYDVQQKDARWSVNBMS8wLQYDVQQLDCZWaXNhIEludGVy\nbmF0aW9uYWwgU2VydmljZSBBc3NvY2lhdGlvbjEgMB4GA1UEAwwXVmlzYSBQdWJs\naWMgUlNBIFJvb3QgQ0EwHhcNMjEwMzE2MDAwMDAwWhcNNDEwMzE1MDAwMDAwWjBv\nMQswCQYDVQQGEwJVUzENMAsGA1UECgwEVklTQTEvMC0GA1UECwwmVmlzYSBJbnRl\ncm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xIDAeBgNVBAMMF1Zpc2EgUHVi\nbGljIFJTQSBSb290IENBMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA\n2WEbXLS3gI6LOY93bP7Kz6EO9L1QXlr8l+fTkJWZldJ6QuwZ1cv4369tfjeJ8O5w\nSJiDcVw7eNdOP73LfAtwHlTnUnb0e9ILTTipc5bkNnAevocrJACsrpiQ8jBI9ttp\ncqKUeJgzW4Ie25ypirKroVD42b4E0iICK2cZ5QfD4BSzUnftp4Bqh8AfpGvG1lre\nCaD53qrsy5SUadY/NaeUGOkqdPvDSNoDIdrbExwnZaSFUmjQT1svKwMqGo2GFrgJ\n4cULEp4NNj5rga8YTTZ7Xo5MblHrLpSPOmJev30KWi/BcbvtCNYNWBTg7UMzP3cK\nMQ1pGLvG2PgvFTZSRvH3QzngJRgrDYYOJ6kj9ave+6yOOFqj80ZCuH0Nugt2mMS3\nc3+Nksaw+6H3cQPsE/Gv5zjfsKleRhEFtE1gyrdUg1DMgu8o/YhKM7FAqkXUn74z\nwoRFgx3Mi5OaGTQbg+NlwJgR4sVHXCV4s9b8PjneLhzWMn353SFARF9dnO7LDBqq\ntT6WltJu1z9x2Ze0UVNZvxKGcyCkLody29O8j9/MGZ8SOSUu4U6NHrebKuuf9Fht\nn6PqQ4ppkhy6sReXeV5NVGfVpDYY5ZAKEWqTYgMULWpQ2Py4BGpFzBe07jXkyulR\npoKvz14iXeA0oq16c94DrFYX0jmrWLeU4a/TCZQLFIsCAwEAAaNCMEAwHQYDVR0O\nBBYEFEtNpg77oBHorQvi8PMKAC+sixb7MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0P\nAQH/BAQDAgEGMA0GCSqGSIb3DQEBCwUAA4ICAQC5BU9qQSZYPcgCp2x0Juq59kMm\nXuBly094DaEnPqvtCgwwAirkv8x8/QSOxiWWiu+nveyuR+j6Gz/fJaV4u+J5QEDy\ncfk605Mw3HIcJOeZvDgk1eyOmQwUP6Z/BdQTNJmZ92Z8dcG5yWCxLBrqPH7ro3Ss\njhYq9duIJU7jfizCJCN4W8tp0D2pWBe1/CYNswP4GMs5jQ5+ZQKN/L5JFdwVTu7X\nPt8b5zfgbmmQpVmUn0oFwm3OI++Z6gEpNmW5bd/2oUIZoG96Qff2fauVMAYiWQvN\nnL3y1gkRguTOSMVUCCiGfdvwu5ygowillvV2nHb7+YibQ9N5Z2spP0o9Zlfzoat2\n7WFpyK47TiUdu/4toarLKGZP+hbA/F4xlnM/8EfZkE1DeTTI0lhN3O8yEsHrtRl1\nOuQZ/IexHO8UGU6jvn4TWo10HYeXzrGckL7oIXfGTrjPzfY62T5HDW/BAEZS+9Tk\nijz25YM0fPPz7IdlEG+k4q4YwZ82j73Y9kDEM5423mrWorq/Bq7I5Y8v0LTY9GWH\nYrpElYf0WdOXAbsfwQiT6qnRio+p82VyqlY8Jt6VVA6CDy/iHKwcj1ELEnDQfVv9\nhedoxmnQ6xe/nK8czclu9hQJRv5Lh9gk9Q8DKK2nmgzZ8SSQ+lr3mSSeY8JOMRlE\n+RKdOQIChWthTJKh7w==\n-----END CERTIFICATE-----\n"
//             ]
//           },
//           "one_click_authn": null
//         }
//       },
//       "on_behalf_of": null,
//       "payment_method": "pm_1JxWpgLkgFoZ4U2TLaGC98hz",
//       "payment_method_options": {
//         "card": {
//           "installments": null,
//           "network": null,
//           "request_three_d_secure": "automatic"
//         }
//       },
//       "payment_method_types": [
//         "card"
//       ],
//       "processing": null,
//       "receipt_email": "ch3ll0v3k@yandex.com",
//       "review": null,
//       "setup_future_usage": null,
//       "shipping": null,
//       "source": null,
//       "statement_descriptor": null,
//       "statement_descriptor_suffix": null,
//       "status": "requires_action",
//       "transfer_data": null,
//       "transfer_group": null
//     }
//   }
// }

// [succeeded]

// {
//   "type": "payment_intent",
//   "event": "succeeded",
//   "object": {
//     "id": "pi_3KTG8QLkgFoZ4U2T0FtWwAhb",
//     "object": "payment_intent",
//     "amount": 586,
//     "amount_capturable": 0,
//     "amount_received": 586,
//     "application": null,
//     "application_fee_amount": null,
//     "automatic_payment_methods": null,
//     "canceled_at": null,
//     "cancellation_reason": null,
//     "capture_method": "automatic",
//     "charges": {
//       "object": "list",
//       "data": [
//         {
//           "id": "ch_3KTG8QLkgFoZ4U2T0osOM3SY",
//           "object": "charge",
//           "amount": 586,
//           "amount_captured": 586,
//           "amount_refunded": 0,
//           "application": null,
//           "application_fee": null,
//           "application_fee_amount": null,
//           "balance_transaction": "txn_3KTG8QLkgFoZ4U2T0lmMVI00",
//           "billing_details": {
//             "address": {
//               "city": null,
//               "country": null,
//               "line1": null,
//               "line2": null,
//               "postal_code": null,
//               "state": null
//             },
//             "email": null,
//             "name": null,
//             "phone": null
//           },
//           "calculated_statement_descriptor": "NODEJS  DEV",
//           "captured": true,
//           "created": 1644889726,
//           "currency": "eur",
//           "customer": "cus_KcmMsBW1A2E0nl",
//           "description": "Order: #10000000173",
//           "destination": null,
//           "dispute": null,
//           "disputed": false,
//           "failure_code": null,
//           "failure_message": null,
//           "fraud_details": {},
//           "invoice": null,
//           "livemode": false,
//           "metadata": {
//             "orderId": "10000000173",
//             "userId": "6",
//             "clientId": "2",
//             "totalItems": "1",
//             "totalPrice": "1.25",
//             "deliveryPrice": "4.61",
//             "finalPrice": "5.86"
//           },
//           "on_behalf_of": null,
//           "order": null,
//           "outcome": {
//             "network_status": "approved_by_network",
//             "reason": null,
//             "risk_level": "normal",
//             "risk_score": 10,
//             "seller_message": "Payment complete.",
//             "type": "authorized"
//           },
//           "paid": true,
//           "payment_intent": "pi_3KTG8QLkgFoZ4U2T0FtWwAhb",
//           "payment_method": "pm_1JxWpgLkgFoZ4U2TLaGC98hz",
//           "payment_method_details": {
//             "card": {
//               "brand": "visa",
//               "checks": {
//                 "address_line1_check": null,
//                 "address_postal_code_check": null,
//                 "cvc_check": null
//               },
//               "country": "IE",
//               "exp_month": 9,
//               "exp_year": 2035,
//               "fingerprint": "2xJCzRZ7SxTqUpwS",
//               "funding": "credit",
//               "installments": null,
//               "last4": "3220",
//               "network": "visa",
//               "three_d_secure": {
//                 "authentication_flow": "challenge",
//                 "result": "authenticated",
//                 "result_reason": null,
//                 "version": "2.1.0"
//               },
//               "wallet": null
//             },
//             "type": "card"
//           },
//           "receipt_email": "ch3ll0v3k@yandex.com",
//           "receipt_number": null,
//           "receipt_url": "https://pay.stripe.com/receipts/acct_1JwPICLkgFoZ4U2T/ch_3KTG8QLkgFoZ4U2T0osOM3SY/rcpt_L9ZIK4oOcQB3lZHfjR1w0OlQtC0WEqX",
//           "refunded": false,
//           "refunds": {
//             "object": "list",
//             "data": [],
//             "has_more": false,
//             "total_count": 0,
//             "url": "/v1/charges/ch_3KTG8QLkgFoZ4U2T0osOM3SY/refunds"
//           },
//           "review": null,
//           "shipping": null,
//           "source": null,
//           "source_transfer": null,
//           "statement_descriptor": null,
//           "statement_descriptor_suffix": null,
//           "status": "succeeded",
//           "transfer_data": null,
//           "transfer_group": null
//         }
//       ],
//       "has_more": false,
//       "total_count": 1,
//       "url": "/v1/charges?payment_intent=pi_3KTG8QLkgFoZ4U2T0FtWwAhb"
//     },
//     "client_secret": "pi_3KTG8QLkgFoZ4U2T0FtWwAhb_secret_zF6LowIzBwLEzpvBUwWqU1gKt",
//     "confirmation_method": "automatic",
//     "created": 1644889638,
//     "currency": "eur",
//     "customer": "cus_KcmMsBW1A2E0nl",
//     "description": "Order: #10000000173",
//     "invoice": null,
//     "last_payment_error": null,
//     "livemode": false,
//     "metadata": {
//       "orderId": "10000000173",
//       "userId": "6",
//       "clientId": "2",
//       "totalItems": "1",
//       "totalPrice": "1.25",
//       "deliveryPrice": "4.61",
//       "finalPrice": "5.86"
//     },
//     "next_action": null,
//     "on_behalf_of": null,
//     "payment_method": "pm_1JxWpgLkgFoZ4U2TLaGC98hz",
//     "payment_method_options": {
//       "card": {
//         "installments": null,
//         "network": null,
//         "request_three_d_secure": "automatic"
//       }
//     },
//     "payment_method_types": [
//       "card"
//     ],
//     "processing": null,
//     "receipt_email": "ch3ll0v3k@yandex.com",
//     "review": null,
//     "setup_future_usage": null,
//     "shipping": null,
//     "source": null,
//     "statement_descriptor": null,
//     "statement_descriptor_suffix": null,
//     "status": "succeeded",
//     "transfer_data": null,
//     "transfer_group": null
//   }
// }
