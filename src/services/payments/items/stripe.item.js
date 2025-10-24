const logger = require('mii-logger.js');
const Stripe = require('stripe');

const Customer = require('./models/Customer');
const Card = require('./models/Card');
const Account = require('./models/Account');

// MEMO: 
//   - events
//     account.external_account.updated, account.external_account.deleted, account.external_account.created, account.application.authorized, account.updated
//     balance.available, charge.captured, charge.expired, charge.failed, charge.pending, charge.refunded, charge.succeeded, charge.updated
//     customer.created, customer.deleted, customer.updated
//     issuing_card.created, issuing_card.updated
//     order.created, order.payment_failed, order.payment_succeeded, order.updated
//     payment_intent.amount_capturable_updated, payment_intent.canceled, payment_intent.created, payment_intent.partially_funded, payment_intent.payment_failed, payment_intent.processing, payment_intent.requires_action, payment_intent.succeeded
//     payment_method.attached, payment_method.detached, payment_method.updated
//     transfer.created, transfer.failed, transfer.paid, transfer.reversed, transfer.updated

// const STRIPE_WEB_HOOK_EVENT_GROUPS = [
//   'balance','charge','customer','issuing_card','order','payment_intent',
//   'transfer','payment_method','account','payout',
// ];

class StripePayment {

  constructor( App, name, params={} ){
    this.App = App;
    this.name = name;
    this.params = params;
    this._stripe = null;
    this._isInited = false;
    this._eventHandlers = {};
    this._init();

  }

  async _init(){
    try{

      const STRIPE_PUBLISHABLE_KEY = this.App.getEnv('STRIPE_PUBLISHABLE_KEY');
      const STRIPE_SECRET_KEY = this.App.getEnv('STRIPE_SECRET_KEY');
      this._stripe = Stripe( STRIPE_SECRET_KEY );

      const EVENT_HANDLER_PATTERN = '.handler.js';
      const EVENT_HANDLERS_ROOT = `${__dirname}/event-handlers`;
      const eventHandlers = console.listDir(EVENT_HANDLERS_ROOT)
        .filter((mItem)=>mItem.endsWith( EVENT_HANDLER_PATTERN ));

      for( const eventHandlerFile of eventHandlers ){
        try{
          const mModule = require(`${EVENT_HANDLERS_ROOT}/${ eventHandlerFile }`);
          const eventGroupType = eventHandlerFile.replace( EVENT_HANDLER_PATTERN, '' ).trim();
          this._eventHandlers[ eventGroupType ] = mModule( this, eventGroupType );
          console.ok(`    #${this.name} => event-handler: ${console.B(eventGroupType)}: ok`);

        }catch(e){
          console.error(`    #${this.name}:_init: [each]: ${e.message}`);
          // console.error(e);
        }
      }

      this._isInited = true;
    }catch(e){
      console.error(` #${this.name}: ${e.message}`);
      return false;
    }
  }

  isInited(){ return this._isInited; }

  isValidAccountId(accountId){
    return !(!this.App.isString(accountId) || !(''+accountId).match(/^(acct_){1}[A-Z0-9]{14,20}$/gi));
  }

  isValidAmount(amount){
    return !(!this.App.isNumber(amount) || amount === 0 || amount % 1 !== 0);
  }

  // const card = await stripe.customers.createSource(
  //   'cus_KbgEpJVyJQgtpy',
  //   {source: 'tok_amex'}
  // );

  getOwnerClientId(){
    return this.App.getEnv('STRIPE_OWNER_CLIENT_ID') || false;
  }

  getRefreshUrl(accountId){
    const url = this.App.toAppPath( 'web', 'stripe.refresh', accountId, true );
    return url;
  }

  getReturnUrl(accountId){
    const url = this.App.toAppPath( 'web', 'stripe.return', accountId, true );
    return url;
  }

  async getKYCAccountLink(accountId, type='account_onboarding'){
    try{

      // const accountRes = await this.accountGetById( accountId );

      const config = {
        account: accountId,
        refresh_url: this.getRefreshUrl(accountId.replace('acct_','')),
        return_url: this.getReturnUrl(accountId).replace('acct_',''),
        type,
      };
      // console.json({config});
      const accountLink = await this._stripe.accountLinks.create(config);
      if( !accountLink.url )
        return this._q(false, 'external-error');

      // {
      //   "object": "account_link",
      //   "created": 1654013441,
      //   "expires_at": 1654013741,
      //   "url": "https://connect.stripe.com/setup/c/VTG9Mek96HAZ"
      // }
      return this._q(true, 'success', {
        createdAt: this.App.DT.unixTimestampToISO(accountLink.created), 
        expiresAt: this.App.DT.unixTimestampToISO(accountLink.expires_at),
        expiresIn: Math.floor((+accountLink.expires_at) - (+accountLink.created)),
        url: accountLink.url,
      });

    }catch(e){
      console.error(` #getKYCAccountLink: ${e.message}`);
      return this._q(false, ['request-could-not-be-processed']);
    }

  }

  async handleEventGroupByType( mEvent ){

    if( !mEvent.type || !mEvent.event || !this.App.isObject(mEvent.object) )
      return this._q(false, ['[type && event && object]','is-required']);

    if( !this._eventHandlers.hasOwnProperty( mEvent.type ) )
      return this._q(false, ['event','type','is-not','valid']);

    const execRes = await this._eventHandlers[ mEvent.type ]( mEvent );
    if( !execRes.success )
      console.json({execRes});

    return execRes;

  }


  getStripe(){ return this._stripe; }

   async accountCreate( clientInfo={}, addressInfo={}, extra={} ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited`);

      // Account.parse( App, {firstName,lastName,email,phone,name,birthday, metadata}, {state,zip,city,street}, {ip:false} );
      const parseRes = Account.parse( this.App, clientInfo, addressInfo, extra );
      if( !parseRes.success ){
        console.json({parseRes});
        return parseRes;
      }

      // https://stripe.com/docs/api/accounts/create?lang=node
      const account = await this._stripe.accounts.create( parseRes.data );
      return this._q(true, 'success', account);

    }catch(e){
      console.error(`accountCreate: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async getBalanceOf( accountId=null ){

    try{

      if( !this.isInited() )
        return {success: false, message: `${this.name}: is not inited`};

      // acct_1LL4GZRHKA0POM0K
      if( this.App.isString(accountId) && !this.isValidAccountId(accountId) )
        return this._q(false, `Account ID is not valid`);

      const of = this.App.isNull(accountId) 
        ? {}
        : {stripeAccount: accountId};

      const account = await this._stripe.balance.retrieve( of );
      return this._q(true, 'success', account);

    }catch(e){
      console.error(`getBalanceOf: accountId: ${accountId}, ${e.message}`);
      return this._q(false, e.message);
    }
  }


  async accountGetById( accountId ){

    try{

      if( !this.isInited() )
        return {success: false, message: `${this.name}: is not inited`};

      // acct_1LL4GZRHKA0POM0K
      if( !this.isValidAccountId(accountId) )
        return this._q(false, `Account ID is not valid`);

      const account = await this._stripe.accounts.retrieve( accountId );
      return this._q(true, 'success', account);

    }catch(e){
      console.error(`accountGetById: accountId: ${accountId}, ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async accountUpdateById( accountId, clientInfo={}, addressInfo={}, extra={} ){

    try{

      // accountId: acct_1LI8TDPtwcTgsmIZ
      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited`);

      // acct_1LL4GZRHKA0POM0K
      if( !this.isValidAccountId(accountId) )
        return this._q(false, `Account ID is not valid`);

      const parseRes = Account.parse( this.App, clientInfo, addressInfo, extra );
      if( !parseRes.success ){
        console.json({parseRes});
        return parseRes;
      }

      // country, type are allowed only in [create] method
      delete parseRes.data.country;
      delete parseRes.data.type;

      const account = await this._stripe.accounts.update(
        accountId,
        parseRes.data,
      );
      return this._q(true, 'success', account);

    }catch(e){
      console.error(`accountUpdateById: accountId: ${accountId}, ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async accountAcceptTos( accountId, ip='127.0.0.1' ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited`);

      if( !this.isValidAccountId(accountId) )
        return this._q(false, `Account ID is not valid`);

      const data = {
        tos_acceptance: {
          date: Math.floor( (new Date()).getTime() /1000 ),
          ip: (ip || '127.0.0.1'),          
        }
      };

      const account = await this._stripe.accounts.update(
        accountId,
        data,
      );

      return this._q(true, 'success', account);

    }catch(e){
      console.error(`accountUpdateById: accountId: ${accountId}, ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async customerCreate( clientInfo={}, addressInfo={} ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited`);

      // https://stripe.com/docs/api/customers/create?lang=node
      const parseRes = Customer.parse( this.App, clientInfo, addressInfo );
      if( !parseRes.success ){
        console.json({parseRes});
        return parseRes;
      }

      const customer = await this._stripe.customers.create( parseRes.data );
      return this._q(true, 'success', customer);

    }catch(e){
      console.error(`customerCreate: ${e.message}`);
      return this._q(false, e.message);
    }

  }

  async customerGetById( customerId='' ){ // cus_KbgYP89ZbqNnx7

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited`);

      // https://stripe.com/docs/api/customers/retrieve?lang=node
      const customer = await this._stripe.customers.retrieve( customerId );
      if( !this.App.isObject(customer) || customer.deleted )
        return this._q(false, `customer not found or/and has been deleted`, customer );

      return this._q(true, 'success', customer);

    }catch(e){
      console.error(`customerGetById: ${e.message}`);
      return this._q(false, e.message);
    }

  }

  // https://stripe.com/docs/api/customers/update?lang=node
  async customerUpdateById( customerId='', clientInfo={}, addressInfo={} ){ // cus_KbgYP89ZbqNnx7
    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const parseRes = Customer.parse( this.App, clientInfo, addressInfo );
      if( !parseRes.success ){
        console.json({parseRes});
        return parseRes;
      }

      const customer = await this._stripe.customers.update( customerId, parseRes.data );
      return this._q(true, 'success', customer);

    }catch(e){
      console.error(`customerUpdateById: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async paymentMethodCardCreate( cardInfo={} ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const parseRes = Card.parse( this.App, cardInfo );
      if( !parseRes.success ){
        console.json({parseRes});
        return parseRes;
      }

      const paymentMethod = await this._stripe.paymentMethods.create({
        type: 'card',
        card: parseRes.data,
      });

      return this._q(true, 'success', paymentMethod);

    }catch(e){
      console.error(`paymentMethodCardCreate: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async paymentMethodAttach( customerId, paymentMethodId ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const attach = await this._stripe.paymentMethods.attach(
        paymentMethodId,
        {customer: customerId}
      );

      return this._q(true, 'success', attach);

    }catch(e){
      console.error(`paymentMethodAttach: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async paymentMethodGetById( paymentMethodId ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const paymentMethod = await this._stripe.paymentMethods.retrieve(
        paymentMethodId
      );

      return this._q(true, 'success', paymentMethod);

    }catch(e){
      console.error(`paymentMethodGetById: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async paymentMethodDetach( paymentMethodId ){

    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const detach = await this._stripe.paymentMethods.detach(
        paymentMethodId
      );
      return this._q(true, 'success', detach);

    }catch(e){
      console.error(`paymentMethodDetach: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async paymentIntentCreate( params={} ){
    try{

      // https://stripe.com/docs/api/payment_intents/create

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const config = { ...( this.App.isObject(params) ? params : {} ) };
      const paymentIntent = await this._stripe.paymentIntents.create({
        ...config,
        // // confirm: true, // default: false,
        // receipt_email: 'ch3ll0v3k@yandex.com',
        // payment_method_types: ['card'],
        // amount: 546,
        // currency: 'eur',
        // customer: DEV_TEST_CUSTOMER,
        // payment_method: DEV_TEST_PM,
        // description: 'Order: #1000001232'
        currency: config.currency || 'usd',
      });
      // console.json({paymentIntentCreate:{paymentIntent}});

      // const { client_secret } = paymentIntent;
      return this._q(true, 'success', paymentIntent);
    }catch(e){
      console.error(`paymentIntentCreate: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async paymentIntentConfirm( paymentIntentId ){
    try{
      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const paymentIntent = await this._stripe.paymentIntents.confirm(
        paymentIntentId
      );

      const intentResponse = this._generateResponse(paymentIntent);

      // if( !intentResponse.success ){
      //   console.error(` #paymentIntentConfirm: ${intentResponse.message} `);
      //   console.debug({intentResponse});
      // }

      return intentResponse;

    }catch(e){
      console.error(`paymentIntentConfirm: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  // https://stripe.com/docs/api/refunds/create?lang=node
  async paymentIntentRefund( paymentIntentId, {reason=null, metadata={},} ){

    try{
      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      // console.debug({paymentIntentId});

      const params = {
        payment_intent: paymentIntentId,
        metadata: {
          ...(this.App.isObject(metadata) ? metadata : {} ),
        },
      };

      if( this.App.isString(reason) && reason.length > 0 ) params.reason = reason;
      const refund = await this._stripe.refunds.create( params );
      return this._q(true, 'success', refund);

    }catch(e){
      console.error(`paymentIntentRefund: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  // https://stripe.com/docs/api/payment_intents/cancel
  async paymentIntentCancel( paymentIntentId, {reason='abandoned', metadata={},} ){


    try{
      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const reasons = [
        'duplicate','fraudulent','requested_by_customer','abandoned',
      ];

      const cancellation_reason = reasons.includes( reason ) && reason.length > 0
        ? reason
        : 'abandoned';

      const cancel = await this._stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason
      });

      if( !this.App.isObject(cancel) || !this.App.isString(cancel.status) || cancel.id !== paymentIntentId ){
        console.json({cancel, paymentIntentId, cancellation_reason});
        return this._q(false, cancel.message || cancel.error || 'failed to cancel payment-intent');
        // {
        //   "cancel": {
        //     "success": false,
        //     "message": "You cannot cancel this PaymentIntent because it has a status of succeeded. Only a PaymentIntent with one of the following statuses may be canceled: requires_payment_method, requires_capture, requires_confirmation, requires_action, processing."
        //   }
        // }
      }

      return this._q(true, 'success', cancel);

    }catch(e){
      console.error(`paymentIntentCancel: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  async transfer( {accountId, amount, metadata={}, txGroup=null, description=null, currency='usd'}={} ){
    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      // acct_1LL4GZRHKA0POM0K
      if( !this.isValidAccountId(accountId) )
        return this._q(false, `Account ID is not valid`);

      amount = (+amount) || 0;
      if( !this.isValidAmount(amount) )
        return this._q(false, `Amount must be converted to ($ cents) as unsigned integer and cannot be zero`);

      description = (this.App.isString(description)?description:null);
      const config = {
        amount,
        currency: 'usd',
        destination: accountId,
        metadata: (this.App.isObject(metadata) ? metadata : {}),
        description,
        // statement_descriptor: description,
      };

      if( this.App.isString(txGroup) )
        config.transfer_group = txGroup;

      const transfer = await this._stripe.transfers.create(config);
      return this._q(true, 'success', transfer);

    }catch(e){
      console.error(`transfer: accountId: ${accountId}, amount: ${amount}, ${e.message}`);
      console.json({metadata});
      return this._q(false, e.message);
    }
  }

  async payout( {accountId, amount, metadata={}, description=null, currency='usd'}={} ){
    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      // acct_1LL4GZRHKA0POM0K
      if( !this.isValidAccountId(accountId) )
        return this._q(false, `Account ID is not valid`);

      amount = (+amount) || 0;
      if( !this.isValidAmount(amount) )
        return this._q(false, `Amount must be converted to ($ cents) as unsigned integer and cannot be zero`);

      description = (this.App.isString(description)?description:null);
      const config = {
        amount,
        currency: 'usd',
        metadata: (this.App.isObject(metadata) ? metadata : {}),
        description,
        statement_descriptor: description,
      };

      const payout = await this._stripe.payouts.create(config, {
        stripeAccount: accountId
      });

      return this._q(true, 'success', payout);

    }catch(e){
      console.error(`payout: accountId: ${accountId}, amount: ${amount}, ${e.message}`);
      console.json({metadata});
      return this._q(false, e.message);
    }
  }

  constructEvent( rawBody, sig, stripeWebhookSecret=false ){
    try{

      if( !this.isInited() )
        return this._q(false, `${this.name}: is not inited` );

      const STRIPE_WEBHOOK_SECRET = this.App.getEnv('STRIPE_WEBHOOK_SECRET');
      const eventRes = this._stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret || STRIPE_WEBHOOK_SECRET);

      const mEvent = {
        type: eventRes.type.split('.')[0],
        event: eventRes.type.split('.')[1],
        object: eventRes.data.object,
      };

      return this._q(true, 'success', mEvent);

    }catch(e){
      console.error(`constructEvent: ${e.message}`);
      return this._q(false, e.message);
    }
  }

  _q(state, message, data={}){
    return {success: state, message, data};
  }

  _generateResponse(intent){

    try{

      if (intent.status === 'succeeded') {
        // The payment didn’t need any additional actions and completed!
        // Handle post-payment fulfillment
        return this._q(true, 'Payment: successfully completed', {
          requiresAction: false,
          intent,          
        });
      }

      // Note that if your API version is before 2019-02-11, 'requires_action'
      // appears as 'requires_source_action'.
      if (
        intent.status === 'requires_action' && intent.next_action.type === 'use_stripe_sdk'
      ) {
        // Tell the client to handle the action
        return this._q(false, 'Payment: Action is required', {
          requiresAction: true,
          clientSecret: intent.client_secret,
          intent,
        });
      }

      return this._q(false, 'Invalid Payment: status', {
        requiresAction: false,
        intent
      });

    }catch(e){
      console.error(`_generateResponse: ${e.message}`);
      return this._q(false, e.message, {
        requiresAction: false,
        intent
      });
    }
  }

}

module.exports = (App, name, params={})=>{
  return new StripePayment(App, name, params);
}

// getBalanceOf(accountId) =>
// {
//   "object": "balance",
//   "available": [
//     { "amount": 0, "currency": "usd", "source_types": { "card": 0 } }
//   ],
//   "instant_available": [
//     { "amount": 0, "currency": "usd", "source_types": { "card": 0 } }
//   ],
//   "livemode": false,
//   "pending": [
//     { "amount": 0, "currency": "usd", "source_types": { "card": 0 } }
//   ]
// }

// getBalanceOf(null === owner) => 
// {
//   "object": "balance",
//   "available": [
//     { "amount": 993000, "currency": "usd", "source_types": { "card": 993000 } }
//   ],
//   "connect_reserved": [
//     { "amount": 0, "currency": "usd" }
//   ],
//   "livemode": false,
//   "pending": [
//     { "amount": 21379, "currency": "usd", "source_types": { "card": 21379 } }
//   ]
// }



// transfer
// {
//   "id": "tr_1LL75jI4FCePIbHHwBvGJYnV",
//   "object": "transfer",
//   "amount": 1000,
//   "amount_reversed": 0,
//   "balance_transaction": "txn_1LL75jI4FCePIbHH9Nch7iRM",
//   "created": 1657724587,
//   "currency": "usd",
//   "description": null,
//   "destination": "acct_1LL4GZRHKA0POM0K",
//   "destination_payment": "py_1LL75jRHKA0POM0KHsfqbdvI",
//   "livemode": false,
//   "metadata": {},
//   "reversals": {
//     "object": "list",
//     "data": [],
//     "has_more": false,
//     "total_count": 0,
//     "url": "/v1/transfers/tr_1LL75jI4FCePIbHHwBvGJYnV/reversals"
//   },
//   "reversed": false,
//   "source_transaction": null,
//   "source_type": "card",
//   "transfer_group": null
// }

// payout
// {
//   "id": "po_1LL75lRHKA0POM0K6UQrjsTc",
//   "object": "payout",
//   "amount": 2000,
//   "arrival_date": 1657756800,
//   "automatic": false,
//   "balance_transaction": "txn_1LL75lRHKA0POM0KvPPfwNvv",
//   "created": 1657724589,
//   "currency": "usd",
//   "description": null,
//   "destination": "ba_1LL5R0RHKA0POM0Kgn2wVlCj",
//   "failure_balance_transaction": null,
//   "failure_code": null,
//   "failure_message": null,
//   "livemode": false,
//   "metadata": {},
//   "method": "standard",
//   "original_payout": null,
//   "reversed_by": null,
//   "source_type": "card",
//   "statement_descriptor": null,
//   "status": "pending",
//   "type": "bank_account"
// }

// refund
// {
//   "id": "re_3KOK8vLkgFoZ4U2T1vJ3CBS1",
//   "object": "refund",
//   "amount": 12535,
//   "balance_transaction": "txn_3KOK8vLkgFoZ4U2T1UWWUIrh",
//   "charge": "ch_3KOK8vLkgFoZ4U2T1dWNQYtO",
//   "created": 1643715728,
//   "currency": "eur",
//   "metadata": {
//     "orderId": "124",
//     "userId": "124",
//     "clientId": "543"
//   },
//   "payment_intent": "pi_3KOK8vLkgFoZ4U2T1BMMb01a",
//   "reason": null,
//   "receipt_number": null,
//   "source_transfer_reversal": null,
//   "status": "succeeded",
//   "transfer_reversal": null
// }

// async customerAddCardById( customerId='', cardInfo={} ){ // cus_KbgYP89ZbqNnx7
//   try{
//     if( !this.isInited() )
//       return {success: false, message: `${this.name}: is not inited`};
//     const cardRes = Card.parse( this.App, cardInfo );
//     if( !cardRes.success ){
//       console.json({cardRes});
//       return cardRes;
//     }
//     const source_t = {
//       source: cardRes.data
//     };
//     console.json({source_t});
//     const card = await this._stripe.customers.createSource( customerId, source_t );
//     return {success: true, message: `success`, data: card };
//   }catch(e){
//     console.error(e);
//     return {success: false, message: `${this.name}: error ...`};
//   }
// }

// async createTestPaymentIntent(){
//   try{
//     if( !this.isInited() )
//       return {success: false, message: `${this.name}: is not inited`};
//     // https://stripe.com/docs/api/payment_intents/create
//     const paymentIntent = await this._stripe.paymentIntents.create({
//       amount: 256,
//       currency: "eur",
//       description: 'this is test payment-intent',
//       payment_method: '',
//       payment_method_types: [
//         "giropay",
//         "eps",
//         "p24",
//         "sofort",
//         "sepa_debit",
//         "card",
//         "bancontact",
//         "ideal",
//       ],
//     });
//     // const paymentIntent = await stripe.paymentIntents.create({
//     //   payment_method_types: ['card'],
//     //   amount: 1099,
//     //   currency: 'eur',
//     //   customer: '{{CUSTOMER_ID}}',
//     //   payment_method: '{{CARD_ID}}'
//     // });
//     // return { clientSecret: paymentIntent.client_secret };
//     return {success: true, message: `success`, data: paymentIntent};
//   }catch(e){
//     console.error(e);
//     return {success: false, message: `${this.name}: error ...`};
//   }
// }


// customerCreate >>>

/* {
  "customer": {
    "id": "cus_KbgYP89ZbqNnx7",
    "object": "customer",
    "address": {
      "city": "",
      "country": "",
      "line1": "",
      "line2": "",
      "postal_code": "",
      "state": ""
    },
    "balance": 0,
    "created": 1637074968,
    "currency": null,
    "default_source": null,
    "delinquent": false,
    "description": "This is test customer",
    "discount": null,
    "email": "ch3ll0v3k@yandex.com",
    "invoice_prefix": "7C5458F0",
    "invoice_settings": {
      "custom_fields": null,
      "default_payment_method": null,
      "footer": null
    },
    "livemode": false,
    "metadata": {},
    "name": "Tsimashenka Viacheslau",
    "phone": null,
    "preferred_locales": [],
    "shipping": null,
    "tax_exempt": "none"
  }
}*/

// customerGetById(customerId);

// NOT-EXISTING:
// {
//   "customerGetById": {
//     "success": false,
//     "message": "No such customer: 'cus_non-existing'"
//   }
// }

// NOT-VALID:
// "cus_KbgYP89ZbqNnx7": {
//   "success": true,
//   "message": "success",
//   "data": {
//     "id": "cus_KbgYP89ZbqNnx7",
//     "object": "customer",
//     "deleted": true
//   }
// }

// VALID:
// "cus_LhUBJGdEV42KVP": {
//   "success": true,
//   "message": "success",
//   "data": {
//     "id": "cus_LhUBJGdEV42KVP",
//     "object": "customer",
//     "address": null,
//     "balance": 0,
//     "created": 1652712483,
//     "currency": null,
//     "default_source": null,
//     "delinquent": false,
//     "description": "new customer",
//     "discount": null,
//     "email": null,
//     "invoice_prefix": "2505B62A",
//     "invoice_settings": {
//       "custom_fields": null,
//       "default_payment_method": null,
//       "footer": null
//     },
//     "livemode": false,
//     "metadata": {
//       "userId": "624",
//       "clientId": "540"
//     },
//     "name": null,
//     "phone": null,
//     "preferred_locales": [],
//     "shipping": null,
//     "tax_exempt": "none",
//     "test_clock": null
//   }
// }

// createTestPaymentIntent: >> 

/* {
  "createTestPaymentIntent": {
    "success": true,
    "message": "success",
    "data": {
      "id": "pi_3JwS2nLkgFoZ4U2T1r7l3h0w",
      "object": "payment_intent",
      "amount": 256,
      "amount_capturable": 0,
      "amount_received": 0,
      "application": null,
      "application_fee_amount": null,
      "canceled_at": null,
      "cancellation_reason": null,
      "capture_method": "automatic",
      "charges": {
        "object": "list",
        "data": [],
        "has_more": false,
        "total_count": 0,
        "url": "/v1/charges?payment_intent=pi_3JwS2nLkgFoZ4U2T1r7l3h0w"
      },
      "client_secret": "pi_3JwS2nLkgFoZ4U2T1r7l3h0w_secret_KDDwbzzNc6X4ju3m4A2zFrL4x",
      "confirmation_method": "automatic",
      "created": 1637070593,
      "currency": "eur",
      "customer": null,
      "description": null,
      "invoice": null,
      "last_payment_error": null,
      "livemode": false,
      "metadata": {},
      "next_action": null,
      "on_behalf_of": null,
      "payment_method": null,
      "payment_method_options": {
        "bancontact": {
          "preferred_language": "en"
        },
        "card": {
          "installments": null,
          "network": null,
          "request_three_d_secure": "automatic"
        },
        "ideal": {},
        "p24": {},
        "sepa_debit": {},
        "sofort": {
          "preferred_language": null
        }
      },
      "payment_method_types": [
        "giropay",
        "eps",
        "p24",
        "sofort",
        "sepa_debit",
        "card",
        "bancontact",
        "ideal"
      ],
      "receipt_email": null,
      "review": null,
      "setup_future_usage": null,
      "shipping": null,
      "source": null,
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "requires_payment_method",
      "transfer_data": null,
      "transfer_group": null
    }
  }
} */

// paymentIntentConfirm >> 

/* {
  "paymentIntentConfirmRes": {
    "success": true,
    "message": "The payment is completed",
    "data": {
      "requiresAction": false,
      "intent": {
        "id": "pi_3JyfnFLkgFoZ4U2T1fhg6VFl",
        "object": "payment_intent",
        "amount": 499,
        "amount_capturable": 0,
        "amount_received": 499,
        "application": null,
        "application_fee_amount": null,
        "automatic_payment_methods": null,
        "canceled_at": null,
        "cancellation_reason": null,
        "capture_method": "automatic",
        "charges": {
          "object": "list",
          "data": [
            {
              "id": "ch_3JyfnFLkgFoZ4U2T1NfDjsDT",
              "object": "charge",
              "amount": 499,
              "amount_captured": 499,
              "amount_refunded": 0,
              "application": null,
              "application_fee": null,
              "application_fee_amount": null,
              "balance_transaction": "txn_3JyfnFLkgFoZ4U2T1UGhaPvl",
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
              "calculated_statement_descriptor": "NODEJS  DEV",
              "captured": true,
              "created": 1637600105,
              "currency": "eur",
              "customer": "cus_KcmMsBW1A2E0nl",
              "description": "Order: #10000000017",
              "destination": null,
              "dispute": null,
              "disputed": false,
              "failure_code": null,
              "failure_message": null,
              "fraud_details": {},
              "invoice": null,
              "livemode": false,
              "metadata": {
                "userId": "6",
                "clientId": "2"
              },
              "on_behalf_of": null,
              "order": null,
              "outcome": {
                "network_status": "approved_by_network",
                "reason": null,
                "risk_level": "normal",
                "risk_score": 62,
                "seller_message": "Payment complete.",
                "type": "authorized"
              },
              "paid": true,
              "payment_intent": "pi_3JyfnFLkgFoZ4U2T1fhg6VFl",
              "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
              "payment_method_details": {
                "card": {
                  "brand": "visa",
                  "checks": {
                    "address_line1_check": null,
                    "address_postal_code_check": null,
                    "cvc_check": null
                  },
                  "country": "US",
                  "exp_month": 9,
                  "exp_year": 2035,
                  "fingerprint": "DVriTDMxd3BsCnK1",
                  "funding": "credit",
                  "installments": null,
                  "last4": "4242",
                  "network": "visa",
                  "three_d_secure": null,
                  "wallet": null
                },
                "type": "card"
              },
              "receipt_email": "ch3ll0v3k@yandex.com",
              "receipt_number": null,
              "receipt_url": "https://pay.stripe.com/receipts/acct_1JwPICLkgFoZ4U2T/ch_3JyfnFLkgFoZ4U2T1NfDjsDT/rcpt_KdxiPquc2jg0gHDjoPsdDK0wQbPU5TJ",
              "refunded": false,
              "refunds": {
                "object": "list",
                "data": [],
                "has_more": false,
                "total_count": 0,
                "url": "/v1/charges/ch_3JyfnFLkgFoZ4U2T1NfDjsDT/refunds"
              },
              "review": null,
              "shipping": null,
              "source": null,
              "source_transfer": null,
              "statement_descriptor": null,
              "statement_descriptor_suffix": null,
              "status": "succeeded",
              "transfer_data": null,
              "transfer_group": null
            }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/charges?payment_intent=pi_3JyfnFLkgFoZ4U2T1fhg6VFl"
        },
        "client_secret": "pi_3JyfnFLkgFoZ4U2T1fhg6VFl_secret_vzceiV222zlDyJzOk0HTQKVt7",
        "confirmation_method": "automatic",
        "created": 1637600101,
        "currency": "eur",
        "customer": "cus_KcmMsBW1A2E0nl",
        "description": "Order: #10000000017",
        "invoice": null,
        "last_payment_error": null,
        "livemode": false,
        "metadata": {
          "userId": "6",
          "clientId": "2"
        },
        "next_action": null,
        "on_behalf_of": null,
        "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
        "payment_method_options": {
          "card": {
            "installments": null,
            "network": null,
            "request_three_d_secure": "automatic"
          }
        },
        "payment_method_types": [
          "card"
        ],
        "receipt_email": "ch3ll0v3k@yandex.com",
        "review": null,
        "setup_future_usage": null,
        "shipping": null,
        "source": null,
        "statement_descriptor": null,
        "statement_descriptor_suffix": null,
        "status": "succeeded",
        "transfer_data": null,
        "transfer_group": null
      }
    }
  }
}*/


// payment-intent: [cancel]

/*

{
  "id": "pi_1JKQKH2PIFT5gUVRBnA82lrg",
  "object": "payment_intent",
  "amount": 1000,
  "amount_capturable": 0,
  "amount_received": 0,
  "application": null,
  "application_fee_amount": null,
  "automatic_payment_methods": null,
  "canceled_at": null,
  "cancellation_reason": null,
  "capture_method": "automatic",
  "charges": {
    "object": "list",
    "data": [],
    "has_more": false,
    "url": "/v1/charges?payment_intent=pi_1JKQKH2PIFT5gUVRBnA82lrg"
  },
  "client_secret": "pi_1JKQKH2PIFT5gUVRBnA82lrg_secret_iAaLZmzLNPin1MFYYTDT9Q5oQ",
  "confirmation_method": "automatic",
  "created": 1628007525,
  "currency": "usd",
  "customer": null,
  "description": "Created by stripe.com/docs demo",
  "invoice": null,
  "last_payment_error": null,
  "livemode": false,
  "metadata": {},
  "next_action": null,
  "on_behalf_of": null,
  "payment_method": null,
  "payment_method_options": {
    "card": {
      "installments": null,
      "network": null,
      "request_three_d_secure": "automatic"
    }
  },
  "payment_method_types": [
    "card"
  ],
  "processing": null,
  "receipt_email": null,
  "review": null,
  "setup_future_usage": null,
  "shipping": null,
  "statement_descriptor": null,
  "statement_descriptor_suffix": null,
  "status": "canceled",
  "transfer_data": null,
  "transfer_group": null
}

*/