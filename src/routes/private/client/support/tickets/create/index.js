const express = require('express');
const router = express.Router();

// {
//   "type": "required: ENUM: <string>: [ last-order | other ]",
//   "message": "required: <string>: max: 1000 bytes utf-8",
//   "orderId": "optional: if type == last-order: <number> Ref. Order.id",
//   "uploads": "optional: <array>: [ <number> Ref. Upload.id ]",
//   "example": [
//     "<number> Ref. Upload.id",
//     "<number> Ref. Upload.id",
//     "<number> Ref. Upload.id"
//   ]
// }

// {
//   "type": "last-order",
//   "message": "Hello admins of this app",
//   "orderId": 10000000013,
//   "uploads": [
//     21,22,23,24,25
//   ]
// }

// {
//   "type": "other",
//   "message": "Hello admins of this app",
//   "orderId": null,
//   "uploads": [
//     21,22,23,24,25
//   ]
// }

// {
//   "type": "last-order",
//   "message": "hello! this is message from client",
//   "orderId": 10000000015,
//   "uploads": [22,23,24,25,26]
// }


// /private/client/support/tickets/create

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const ticketTypes = App.getModel('SupportTicket').getTypes({asArray: false});
      const roles = App.getModel('User').getRoles({asArray: false});

      const ticket_t = {
        userId: mUser.id,
        userType: roles.client,
        type: req.getCommonDataString('type', null),
        message: req.getCommonDataString('message', null),
        orderId: req.getCommonDataInt('orderId', null),
      };

      if( App.isNull(ticket_t.type) || !ticketTypes.hasOwnProperty(ticket_t.type) ){
        return App.json( res, 417, App.t(['Ticket','type','is-not','supported'], req.lang), {
          ticketTypes
        });
      }

      if( !App.isString(ticket_t.message) || !ticket_t.message.length ){
        return App.json( res, 417, App.t(['Ticket','message','is-required'], req.lang) );
      }

      ticket_t.message = ticket_t.message.substr(0, 1000); // 1000 bytes utf-8

      if( ticket_t.type === ticketTypes['last-order'] ){

        if( App.isNull(ticket_t.orderId) || !ticket_t.orderId ){
          return App.json( res, 404, App.t(['other','id','is-required','is','type','is','set','to', ticket_t.type ], req.lang) );
        }

        if( !(await App.getModel('Order').isset({ id: ticket_t.orderId, clientId: mClient.id }) ) )
          return App.json( res, 404, App.t(['Order','not','found'], req.lang) );

      }else{
        ticket_t.orderId = null;
      }

      const mSupportTicket = await App.getModel('SupportTicket')
        .create( ticket_t );

      if( !App.isObject(mSupportTicket) || !App.isPosNumber(mSupportTicket.id) )
        return App.json( res, false, App.t(['failed-to','crearte','support-ticker'], req.lang) );

      const uploads = (App.isArray( data.uploads ) ? data.uploads : [])
        .filter((id)=> App.isPosNumber(Math.floor(+id)) )
        .map((id)=> Math.floor(+id) )

      for( const uploadId of uploads ){

        if( !(await App.getModel('Upload').isset({ id: uploadId, userId: mUser.id }) ) ) {
          // not owned file or file not found
          continue;
        }

        const mSupportTicketFile = await App.getModel('SupportTicketFile').create({
          supportTicketId: mSupportTicket.id,
          fileId: uploadId,
        });
      }

      // const devTest = await App.getModel('SupportTicket').findOne({
      //   where: { id: mSupportTicket.id },
      //   include: [{
      //     model: App.getModel('SupportTicketFile'),
      //     attributes: ['id'],
      //     include: [{
      //       model: App.getModel('Upload'),
      //       attributes: ['id','fileName','fileType'],
      //     }]
      //   }]
      // });
      // App.json( res, true, App.t('success', res.lang), {devTest} );

      App.json( res, true, App.t('success', res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


