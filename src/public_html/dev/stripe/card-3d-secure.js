const STRIPE_PUBLISHABLE_KEY = 'pk_test_51JwPICLkgFoZ4U2TxlBryIKQlk5HdDkE1rlLiiuF3pd7ct9uvo2u4g2t6CucuZRYBVYUDOHUJs7RJKdAQ6pCufS400XqmGArY7'
const PI_CLIE_SEC = 'pi_3KRa35LkgFoZ4U2T1yWZHkBN_secret_Jp7wE9KVSpm8T2UIyXgvxUMur';

const stripe = Stripe(STRIPE_PUBLISHABLE_KEY, {
  apiVersion: '2020-08-27',
});

document.addEventListener('DOMContentLoaded', async () => {

  let clientSecret = ''; // 'pi_3KRa35LkgFoZ4U2T1yWZHkBN_secret_Jp7wE9KVSpm8T2UIyXgvxUMur';
  let paymentIntent = null;

  const hClientSecretButton = document.getElementById('client-secret-button');
  const hConfirmPaymentButton = document.getElementById('confirm-payment-button');
  const hPaymentInfo = document.getElementById('payment-info');
  const hPaymentInfoTable = document.getElementById('payment-info-table');
  const hPaymentInfoTableTbody = document.getElementById('payment-info-table-tbody');

  hClientSecretButton.addEventListener('click', async (event) => {
    hConfirmPaymentButton.setAttribute('disabled', true);
    const token = document.getElementById('client-secret-input').value.trim();
    const res = token.match(/^pi_[A-z0-9]{24}_secret_[A-z0-9]{25}$/);
    if( !Array.isArray(res) )
      return alert(`Client token is not valid`);

    const paymentIntentRes = await stripe.retrievePaymentIntent( token );

    if( paymentIntentRes.error )
      return alert( paymentIntentRes.error );

    paymentIntent = paymentIntentRes.paymentIntent;

    if( paymentIntent.status === 'succeeded' )
      return alert(`${paymentIntent.description}: has already been confirmed`);

    if( paymentIntent.status === 'canceled' )
      return alert(`${paymentIntent.description}: has been canceled`);

    clientSecret = token;

    console.log({paymentIntent});
    hConfirmPaymentButton.removeAttribute('disabled', true);

    const keys = [
      'id','object','amount','automatic_payment_methods','canceled_at','cancellation_reason',
      'capture_method','confirmation_method','currency','description','last_payment_error',
      'receipt_email','setup_future_usage','shipping','source','status','payment_method',
    ];

    // hPaymentInfo
    // hPaymentInfoTable
    // hPaymentInfoTableTbody

    hPaymentInfoTableTbody.innerHTML = '';

    for( const mKey of keys ){
      console.log({mKey});
      let mValue = 'n/a';

      switch(mKey){
        case 'last_payment_error':
          mValue = ( !! paymentIntent[ mKey ]) 
            ? paymentIntent[ mKey ].message 
            : 'n/a';
          break;

        case 'amount':
          mValue = +((+paymentIntent[ mKey ])/100).toFixed(2);
          break;

        default:
          mValue = paymentIntent[ mKey ];
          
      }

      hPaymentInfoTableTbody.innerHTML += `
        <tr>
          <td>${mKey}</td><td>${ mValue }</td>
        </tr>
      `;
    }

  });

  hConfirmPaymentButton.addEventListener('click', async (e) => {

    if( !paymentIntent )
      return alert(`Fetch payment info with client-secret token`);

    const {error: mError, paymentIntent: mIntent } = await stripe.confirmCardPayment(
      paymentIntent.client_secret, // '{{PAYMENT_INTENT_CLIENT_SECRET}}',
      // {
      //   payment_method: {card: cardElement},
      //   return_url: 'https://example.com/return_url'
      // },
      // {handleActions: false}, // Disable the default next action handling.
      { 
        "payment_method": paymentIntent.payment_method // "pm_1KRa0yLkgFoZ4U2TV9W03Hu8",
      }
    );

    console.log({mError, mIntent});

    if( mError )
      return alert(`${mError.message}\n${mError.payment_intent.last_payment_error.message}`);

    return alert(`payment has been confirmed successfully`);

  });

});


/*

// get [paymentIntent] by [clientSecret]

{
  "id": "pi_3KRa35LkgFoZ4U2T1yWZHkBN",
  "object": "payment_intent",
  "amount": 140430,
  "automatic_payment_methods": null,
  "canceled_at": null,
  "cancellation_reason": null,
  "capture_method": "automatic",
  "client_secret": "pi_3KRa35LkgFoZ4U2T1yWZHkBN_secret_Jp7wE9KVSpm8T2UIyXgvxUMur",
  "confirmation_method": "automatic",
  "created": 1644489531,
  "currency": "eur",
  "description": "Order: #10000001658",
  "last_payment_error": null,
  "livemode": false,
  "processing": null,
  "receipt_email": "hshshdh4@gmail.com",
  "setup_future_usage": null,
  "shipping": null,
  "source": null,
  "status": "requires_action",
  "payment_method": "pm_1KRa0yLkgFoZ4U2TV9W03Hu8",
  "payment_method_types": [
    "card"
  ]
  "next_action": {
    "type": "use_stripe_sdk",
    "use_stripe_sdk": {
      "type": "stripe_3ds2_fingerprint",
      "merchant": "acct_1JwPICLkgFoZ4U2T",
      "three_d_secure_2_source": "src_1KRa3PLkgFoZ4U2TgaXXPiJD",
      "directory_server_name": "visa",
      "server_transaction_id": "aaf78041-0962-4d08-bb6d-ffbe26ae59af",
      "three_ds_method_url": "",
      "three_ds_optimizations": "k",
      "directory_server_encryption": {
        "directory_server_id": "A000000003",
        "algorithm": "RSA",
        "certificate": "-----BEGIN CERTIFICATE-----\nMIIGAzCCA+ugAwIBAgIQDaAlB1IbPwgx5esGu9tLIjANBgkqhkiG9w0BAQsFADB2\nMQswCQYDVQQGEwJVUzENMAsGA1UECgwEVklTQTEvMC0GA1UECwwmVmlzYSBJbnRl\ncm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xJzAlBgNVBAMMHlZpc2EgZUNv\nbW1lcmNlIElzc3VpbmcgQ0EgLSBHMjAeFw0yMTA4MjMxNTMyMzNaFw0yNDA4MjIx\nNTMyMzNaMIGhMRgwFgYDVQQHDA9IaWdobGFuZHMgUmFuY2gxETAPBgNVBAgMCENv\nbG9yYWRvMQswCQYDVQQGEwJVUzENMAsGA1UECgwEVklTQTEvMC0GA1UECwwmVmlz\nYSBJbnRlcm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xJTAjBgNVBAMMHDNk\nczIucnNhLmVuY3J5cHRpb24udmlzYS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IB\nDwAwggEKAoIBAQCy34cZ88+xfenoccRD1jOi6uVCPXo2xyabXcKntxl7h1kHahac\nmpnuiH+kSgSg4DEHDXHg0WBcpMp0cB67dUE1XDxLAxN0gL5fXpVX7dUjI9tS8lcW\nndChHxZTA8HcXUtv1IwU1L3luhgNkog509bRw/V1GLukW6CwFRkMI/8fecV8EUcw\nIGiBr4/cAcaPnLxFWm/SFL2NoixiNf6LnwHrU4YIHsPQCIAM1km4XPDb7Gk2S3o0\nkkXroU87yoiHzFHbEZUN/tO0Juyz8K6AtGBKoppv1hEHz9MFNzLlvGPo7wcPpovb\nMYtwxj10KhtfEKh0sS0yMl1Uvw36JmuwjaC3AgMBAAGjggFfMIIBWzAMBgNVHRMB\nAf8EAjAAMB8GA1UdIwQYMBaAFL0nYyikrlS3yCO3wTVCF+nGeF+FMGcGCCsGAQUF\nBwEBBFswWTAwBggrBgEFBQcwAoYkaHR0cDovL2Vucm9sbC52aXNhY2EuY29tL2VD\nb21tRzIuY3J0MCUGCCsGAQUFBzABhhlodHRwOi8vb2NzcC52aXNhLmNvbS9vY3Nw\nMEYGA1UdIAQ/MD0wMQYIKwYBBQUHAgEwJTAjBggrBgEFBQcCARYXaHR0cDovL3d3\ndy52aXNhLmNvbS9wa2kwCAYGZ4EDAQEBMBMGA1UdJQQMMAoGCCsGAQUFBwMCMDUG\nA1UdHwQuMCwwKqAooCaGJGh0dHA6Ly9lbnJvbGwudmlzYWNhLmNvbS9lQ29tbUcy\nLmNybDAdBgNVHQ4EFgQU/JtqQ7VLWNd3/9zQjpnsR2rz+cwwDgYDVR0PAQH/BAQD\nAgSwMA0GCSqGSIb3DQEBCwUAA4ICAQBYOGCI/bYG2gmLgh7UXg5qrt4xeDYe4RXe\n5xSjFkTelNvdf+KykB+oQzw8ZobIY+pKsPihM6IrtoJQuzOLXPV5L9U4j1qa/NZB\nGZTXFMwKGN/v0/tAj3h8wefcLPWb15RsXEpZmA87ollezpXeEHXPhFIit7cHoG5P\nfem9yMuDISI97qbnIKNtFENJr+fMkWIykQ0QnkM1rt99Yv2ZE4GWZN7VJ0zXFqOF\nNF2IVwnTIZ21eDiCOjQr6ohq7bChDMelB5XvEuhfe400DqDP+e5pPHo81ecXkjJK\ngS5grYYZIbeDBdQL1Cgs1mGu6On8ecr0rcpRlQh++BySg9MKkzJdLt1vsYmxfrfb\nkUaLglTdYAU2nYaOEDR4NvkRxfzegXyXkOqfPTmfkrg+OB0LeuICITJGJ0cuZD5W\nGUNaT9WruEANBRJNVjSX1UeJUnCpz4nitT1ml069ONjEowyWUcKvTr4/nrargv2R\npOD4RPJMti6kG+bm9OeATiSgVNmO5lkAS4AkOop2IcbRFcVKJUTOhx2Q37L4nuAH\nTCXQ9vwT4yWz6fVaCfL/FTvCGMilLPzXC/00OPA2ZtWvClvFh/uHJBjRUnj6WXp3\nO9p9uHfdV9eKJH37k94GUSMjBKQ6aIru1VUvSOmUPrDz5JbQB7bP+IzUaFHeweZX\nOWumZmyGDw==\n-----END CERTIFICATE-----\n",
        "root_certificate_authorities": [
          "-----BEGIN CERTIFICATE-----\nMIIDojCCAoqgAwIBAgIQE4Y1TR0/BvLB+WUF1ZAcYjANBgkqhkiG9w0BAQUFADBr\nMQswCQYDVQQGEwJVUzENMAsGA1UEChMEVklTQTEvMC0GA1UECxMmVmlzYSBJbnRl\ncm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xHDAaBgNVBAMTE1Zpc2EgZUNv\nbW1lcmNlIFJvb3QwHhcNMDIwNjI2MDIxODM2WhcNMjIwNjI0MDAxNjEyWjBrMQsw\nCQYDVQQGEwJVUzENMAsGA1UEChMEVklTQTEvMC0GA1UECxMmVmlzYSBJbnRlcm5h\ndGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xHDAaBgNVBAMTE1Zpc2EgZUNvbW1l\ncmNlIFJvb3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCvV95WHm6h\n2mCxlCfLF9sHP4CFT8icttD0b0/Pmdjh28JIXDqsOTPHH2qLJj0rNfVIsZHBAk4E\nlpF7sDPwsRROEW+1QK8bRaVK7362rPKgH1g/EkZgPI2h4H3PVz4zHvtH8aoVlwdV\nZqW1LS7YgFmypw23RuwhY/81q6UCzyr0TP579ZRdhE2o8mCP2w4lPJ9zcc+U30rq\n299yOIzzlr3xF7zSujtFWsan9sYXiwGd/BmoKoMWuDpI/k4+oKsGGelT84ATB+0t\nvz8KPFUgOSwsAGl0lUq8ILKpeeUYiZGo3BxN77t+Nwtd/jmliFKMAGzsGHxBvfaL\ndXe6YJ2E5/4tAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQD\nAgEGMB0GA1UdDgQWBBQVOIMPPyw/cDMezUb+B4wg4NfDtzANBgkqhkiG9w0BAQUF\nAAOCAQEAX/FBfXxcCLkr4NWSR/pnXKUTwwMhmytMiUbPWU3J/qVAtmPN3XEolWcR\nzCSs00Rsca4BIGsDoo8Ytyk6feUWYFN4PMCvFYP3j1IzJL1kk5fui/fbGKhtcbP3\nLBfQdCVp9/5rPJS+TUtBjE7ic9DjkCJzQ83z7+pzzkWKsKZJ/0x9nXGIxHYdkFsd\n7v3M9+79YKWxehZx0RbQfBI8bGmX265fOZpwLwU8GUYEmSA20GBuYQa7FkKMcPcw\n++DbZqMAAb3mLNqRX6BGi01qnD093QVG/na/oAo85ADmJ7f/hC3euiInlhBx6yLt\n398znM/jra6O1I7mT1GvFpLgXPYHDw==\n-----END CERTIFICATE-----\n",
          "-----BEGIN CERTIFICATE-----\nMIIFqTCCA5GgAwIBAgIPUT6WAAAA20Qn7qzgvuFIMA0GCSqGSIb3DQEBCwUAMG8x\nCzAJBgNVBAYTAlVTMQ0wCwYDVQQKDARWSVNBMS8wLQYDVQQLDCZWaXNhIEludGVy\nbmF0aW9uYWwgU2VydmljZSBBc3NvY2lhdGlvbjEgMB4GA1UEAwwXVmlzYSBQdWJs\naWMgUlNBIFJvb3QgQ0EwHhcNMjEwMzE2MDAwMDAwWhcNNDEwMzE1MDAwMDAwWjBv\nMQswCQYDVQQGEwJVUzENMAsGA1UECgwEVklTQTEvMC0GA1UECwwmVmlzYSBJbnRl\ncm5hdGlvbmFsIFNlcnZpY2UgQXNzb2NpYXRpb24xIDAeBgNVBAMMF1Zpc2EgUHVi\nbGljIFJTQSBSb290IENBMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA\n2WEbXLS3gI6LOY93bP7Kz6EO9L1QXlr8l+fTkJWZldJ6QuwZ1cv4369tfjeJ8O5w\nSJiDcVw7eNdOP73LfAtwHlTnUnb0e9ILTTipc5bkNnAevocrJACsrpiQ8jBI9ttp\ncqKUeJgzW4Ie25ypirKroVD42b4E0iICK2cZ5QfD4BSzUnftp4Bqh8AfpGvG1lre\nCaD53qrsy5SUadY/NaeUGOkqdPvDSNoDIdrbExwnZaSFUmjQT1svKwMqGo2GFrgJ\n4cULEp4NNj5rga8YTTZ7Xo5MblHrLpSPOmJev30KWi/BcbvtCNYNWBTg7UMzP3cK\nMQ1pGLvG2PgvFTZSRvH3QzngJRgrDYYOJ6kj9ave+6yOOFqj80ZCuH0Nugt2mMS3\nc3+Nksaw+6H3cQPsE/Gv5zjfsKleRhEFtE1gyrdUg1DMgu8o/YhKM7FAqkXUn74z\nwoRFgx3Mi5OaGTQbg+NlwJgR4sVHXCV4s9b8PjneLhzWMn353SFARF9dnO7LDBqq\ntT6WltJu1z9x2Ze0UVNZvxKGcyCkLody29O8j9/MGZ8SOSUu4U6NHrebKuuf9Fht\nn6PqQ4ppkhy6sReXeV5NVGfVpDYY5ZAKEWqTYgMULWpQ2Py4BGpFzBe07jXkyulR\npoKvz14iXeA0oq16c94DrFYX0jmrWLeU4a/TCZQLFIsCAwEAAaNCMEAwHQYDVR0O\nBBYEFEtNpg77oBHorQvi8PMKAC+sixb7MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0P\nAQH/BAQDAgEGMA0GCSqGSIb3DQEBCwUAA4ICAQC5BU9qQSZYPcgCp2x0Juq59kMm\nXuBly094DaEnPqvtCgwwAirkv8x8/QSOxiWWiu+nveyuR+j6Gz/fJaV4u+J5QEDy\ncfk605Mw3HIcJOeZvDgk1eyOmQwUP6Z/BdQTNJmZ92Z8dcG5yWCxLBrqPH7ro3Ss\njhYq9duIJU7jfizCJCN4W8tp0D2pWBe1/CYNswP4GMs5jQ5+ZQKN/L5JFdwVTu7X\nPt8b5zfgbmmQpVmUn0oFwm3OI++Z6gEpNmW5bd/2oUIZoG96Qff2fauVMAYiWQvN\nnL3y1gkRguTOSMVUCCiGfdvwu5ygowillvV2nHb7+YibQ9N5Z2spP0o9Zlfzoat2\n7WFpyK47TiUdu/4toarLKGZP+hbA/F4xlnM/8EfZkE1DeTTI0lhN3O8yEsHrtRl1\nOuQZ/IexHO8UGU6jvn4TWo10HYeXzrGckL7oIXfGTrjPzfY62T5HDW/BAEZS+9Tk\nijz25YM0fPPz7IdlEG+k4q4YwZ82j73Y9kDEM5423mrWorq/Bq7I5Y8v0LTY9GWH\nYrpElYf0WdOXAbsfwQiT6qnRio+p82VyqlY8Jt6VVA6CDy/iHKwcj1ELEnDQfVv9\nhedoxmnQ6xe/nK8czclu9hQJRv5Lh9gk9Q8DKK2nmgzZ8SSQ+lr3mSSeY8JOMRlE\n+RKdOQIChWthTJKh7w==\n-----END CERTIFICATE-----\n"
        ]
      },
      "one_click_authn": null
    }
  }
}

[3dSecure] => [on:cancel/error]

{
  "error": {
    "type": "invalid_request_error",
    "code": "payment_intent_authentication_failure",
    "doc_url": "https://stripe.com/docs/error-codes/payment-intent-authentication-failure",
    "message": "We are unable to authenticate your payment method. Please choose a different payment method and try again.",
    "payment_method": {
      "id": "pm_1KRa0yLkgFoZ4U2TV9W03Hu8",
      "object": "payment_method",
      "billing_details": {
        "address": {
          "city": null,
          "country": null,
          "line1": null,
          "line2": null,
          "postal_code": null,
          "state": null
        },
        "email": null,
        "name": null,
        "phone": null
      },
      "card": {
        "brand": "visa",
        "checks": {
          "address_line1_check": null,
          "address_postal_code_check": null,
          "cvc_check": null
        },
        "country": "IE",
        "exp_month": 12,
        "exp_year": 2032,
        "funding": "credit",
        "generated_from": null,
        "last4": "3220",
        "networks": {
          "available": [
            "visa"
          ],
          "preferred": null
        },
        "three_d_secure_usage": {
          "supported": true
        },
        "wallet": null
      },
      "created": 1644489400,
      "customer": "cus_KwBa7EojP1I6XY",
      "livemode": false,
      "type": "card"
    },
    "payment_intent": {
      "id": "pi_3KRa35LkgFoZ4U2T1yWZHkBN",
      "object": "payment_intent",
      "amount": 140430,
      "automatic_payment_methods": null,
      "canceled_at": null,
      "cancellation_reason": null,
      "capture_method": "automatic",
      "client_secret": "pi_3KRa35LkgFoZ4U2T1yWZHkBN_secret_Jp7wE9KVSpm8T2UIyXgvxUMur",
      "confirmation_method": "automatic",
      "created": 1644489531,
      "currency": "eur",
      "description": "Order: #10000001658",
      "last_payment_error": {
        "code": "payment_intent_authentication_failure",
        "doc_url": "https://stripe.com/docs/error-codes/payment-intent-authentication-failure",
        "message": "The provided PaymentMethod has failed authentication. You can provide payment_method_data or a new PaymentMethod to attempt to fulfill this PaymentIntent again.",
        "payment_method": {
          "id": "pm_1KRa0yLkgFoZ4U2TV9W03Hu8",
          "object": "payment_method",
          "billing_details": {
            "address": {
              "city": null,
              "country": null,
              "line1": null,
              "line2": null,
              "postal_code": null,
              "state": null
            },
            "email": null,
            "name": null,
            "phone": null
          },
          "card": {
            "brand": "visa",
            "checks": {
              "address_line1_check": null,
              "address_postal_code_check": null,
              "cvc_check": null
            },
            "country": "IE",
            "exp_month": 12,
            "exp_year": 2032,
            "funding": "credit",
            "generated_from": null,
            "last4": "3220",
            "networks": {
              "available": [
                "visa"
              ],
              "preferred": null
            },
            "three_d_secure_usage": {
              "supported": true
            },
            "wallet": null
          },
          "created": 1644489400,
          "customer": "cus_KwBa7EojP1I6XY",
          "livemode": false,
          "type": "card"
        },
        "type": "invalid_request_error"
      },
      "livemode": false,
      "next_action": null,
      "payment_method": null,
      "payment_method_types": [
        "card"
      ],
      "processing": null,
      "receipt_email": "hshshdh4@gmail.com",
      "setup_future_usage": null,
      "shipping": null,
      "source": null,
      "status": "requires_payment_method"
    }
  }
}

[3dSecure] => [on:success]

{
  "mIntent": {
    "id": "pi_3KRa35LkgFoZ4U2T1yWZHkBN",
    "object": "payment_intent",
    "amount": 140430,
    "automatic_payment_methods": null,
    "canceled_at": null,
    "cancellation_reason": null,
    "capture_method": "automatic",
    "client_secret": "pi_3KRa35LkgFoZ4U2T1yWZHkBN_secret_Jp7wE9KVSpm8T2UIyXgvxUMur",
    "confirmation_method": "automatic",
    "created": 1644489531,
    "currency": "eur",
    "description": "Order: #10000001658",
    "last_payment_error": null,
    "livemode": false,
    "next_action": null,
    "payment_method": "pm_1KRa0yLkgFoZ4U2TV9W03Hu8",
    "payment_method_types": [
      "card"
    ],
    "processing": null,
    "receipt_email": "hshshdh4@gmail.com",
    "setup_future_usage": null,
    "shipping": null,
    "source": null,
    "status": "succeeded"
  }
}

*/