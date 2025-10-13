const express = require('express');
const router = express.Router();

// {
//   "// NOTE": "filter:",
//   "type": "optional: ENUM: <string>: [ last-order | other ]",
//   "userType": "optional: ENUM: <string>: [ client | courier ]"
// }

// /private/admin/support/tickets/get/all/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;

      const data = req.getPost();
      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('SupportTicket').getOrderBy(by);
      const types = App.getModel('SupportTicket').getTypes({asArray: true});
      const roles = App.getModel('User').getRoles({asArray: true});
      const supportTicketWhere = {};

      const type = req.getCommonDataString('type', null);
      if( types.includes(type) )
        supportTicketWhere['type'] = type;

      const userType = req.getCommonDataString('userType', null);
      if( roles.includes(userType) )
        supportTicketWhere['userType'] = userType;

      const mSupportTickets = await App.getModel('SupportTicket').findAndCountAll({
        where: supportTicketWhere,
        distinct: true,
        attributes: [
          'id','userType','type','message','isRead','readAt','createdAt'
        ],
        include: [
          {
            model: App.getModel('User'),
            attributes: ['id','image','firstName','lastName','role','email','phone'],
          },
          // {
          //   model: App.getModel('SupportTicketFile'),
          //   attributes: ['id','createdAt'],
          //   include:[{
          //     model: App.getModel('Upload'),
          //     attributes: ['id','fileName','createdAt'],
          //   }]
          // },
          {
            model: App.getModel('Order'),
            attributes: [
              'id','totalPrice','totalItems',
              'isDeliveredByCourier',
              'isRejectedByClient','rejectedByClientAt','rejectionReason',
              'isCanceledByClient','canceledByClientAt','cancellationReason'
            ],
          },
        ],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      App.json( res, true, App.t(['success'], res.lang), mSupportTickets );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


