const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// /public/services/stripe/web-hook/

module.exports = function(App, RPath){

  router.use('', express.raw({type: 'application/json'}), async(req, res)=>{

    try{

      const data = req.getPost();
      const sig = req.headers['stripe-signature'];
      let eventRes = {};

      if( false /*App.isEnv('dev')*/ ){
        const res = JSON.parse(req.rawBody.toString('utf-8'));
        // console.json(res);
        eventRes = {
          data: {
            type: res.type.split('.')[0],
            event: res.type.split('.')[1],
            object: res.data.object,
          }
        };

      }else{
        eventRes = App.payments.stripe.constructEvent( req.rawBody, sig );
        if( !eventRes.success )
          return App.json( res, 400, App.t('400', req.lang) );
      }

      // [post-processing]
      const mEvent = eventRes.data;
      const execRes = await App.payments.stripe.handleEventGroupByType( mEvent );
      console.debug(` @hook: type: [${mEvent.type}], event: [${mEvent.event}] => execRes: [${execRes.message}]`);

      await App.json( res, true, App.t(['success'], req.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{}, /*node: 'master'*/ };

};


// >> [post, https, US, 54.187.216.72, api.3dmadcat.ru] [/public/services/stripe/web-hook/ : {}]
// >>  #event: payment_intent.created
// >> {
// >>   "event": {
// >>     "id": "evt_3KGivELkgFoZ4U2T0VDG5mhb",
// >>     "object": "event",
// >>     "api_version": "2020-08-27",
// >>     "created": 1641902032,
// >>     "data": {
// >>       "object": {
// >>         "id": "pi_3KGivELkgFoZ4U2T06uTUhBL",
// >>         "object": "payment_intent",
// >>         "amount": 2793,
// >>         "amount_capturable": 0,
// >>         "amount_received": 0,
// >>         "application": null,
// >>         "application_fee_amount": null,
// >>         "automatic_payment_methods": null,
// >>         "canceled_at": null,
// >>         "cancellation_reason": null,
// >>         "capture_method": "automatic",
// >>         "charges": {
// >>           "object": "list",
// >>           "data": [],
// >>           "has_more": false,
// >>           "total_count": 0,
// >>           "url": "/v1/charges?payment_intent=pi_3KGivELkgFoZ4U2T06uTUhBL"
// >>         },
// >>         "client_secret": "pi_3KGivELkgFoZ4U2T06uTUhBL_secret_bx0LPSZ5nSdrlRT0d7xP2gtNI",
// >>         "confirmation_method": "automatic",
// >>         "created": 1641902032,
// >>         "currency": "eur",
// >>         "customer": "cus_KcmPiFJL2CobCi",
// >>         "description": "Order: #10000001403",
// >>         "invoice": null,
// >>         "last_payment_error": null,
// >>         "livemode": false,
// >>         "metadata": {
// >>           "userId": "293",
// >>           "clientId": "286"
// >>         },
// >>         "next_action": null,
// >>         "on_behalf_of": null,
// >>         "payment_method": null,
// >>         "payment_method_options": {
// >>           "card": {
// >>             "installments": null,
// >>             "network": null,
// >>             "request_three_d_secure": "automatic"
// >>           }
// >>         },
// >>         "payment_method_types": [
// >>           "card"
// >>         ],
// >>         "processing": null,
// >>         "receipt_email": "paltashka50@gmail.com",
// >>         "review": null,
// >>         "setup_future_usage": null,
// >>         "shipping": null,
// >>         "source": null,
// >>         "statement_descriptor": null,
// >>         "statement_descriptor_suffix": null,
// >>         "status": "requires_payment_method",
// >>         "transfer_data": null,
// >>         "transfer_group": null
// >>       }
// >>     },
// >>     "livemode": false,
// >>     "pending_webhooks": 3,
// >>     "request": {
// >>       "id": "req_Qma3yj3KX0U2q1",
// >>       "idempotency_key": "2d91601b-aef3-40fe-be17-a1ccf07ae869"
// >>     },
// >>     "type": "payment_intent.created"
// >>   }
// >> }
