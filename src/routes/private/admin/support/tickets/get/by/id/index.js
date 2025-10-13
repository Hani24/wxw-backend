const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. SupportTicket.id"
// }

// {
//   "id": 12
// }

// /private/admin/support/tickets/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;

      const data = req.getPost();
      const id = req.getCommonDataInt('id', null);

      if( App.isNull(id) || !id )
        return App.json( res, 417, App.t(['SupportTicket','id','is-required'], req.lang) );

      const mSupportTicket = await App.getModel('SupportTicket').findOne({
        where: {
          id: id,
        },
        distinct: true,
        attributes: [
          'id','userType','type','message','isRead','readAt','createdAt'
        ],
        include: [
          {
            model: App.getModel('User'),
            attributes: ['id','image','firstName','lastName','role','email','phone'],
          },
          {
            model: App.getModel('SupportTicketFile'),
            attributes: ['id','createdAt'],
            include:[{
              model: App.getModel('Upload'),
              attributes: ['id','fileName','createdAt'],
            }]
          },
          {
            model: App.getModel('Order'),
            attributes: [
              'id','totalPrice','finalPrice','totalItems','status',
              'clientDescription','discountAmount','discountCode',
              'isRejectedByClient','rejectedByClientAt','rejectionReason',
              'isCanceledByClient','canceledByClientAt','cancellationReason',
              'isCourierRatedByClient','courierRatedByClientAt','courierRating',
              'isDeliveredByCourier',
            ],
            include:[{
              model: App.getModel('Courier'),
              attributes: ['id'],
              include: [{
                model: App.getModel('User'),
                attributes: ['id','image','firstName','lastName','role','email','phone'],
              }]
            }]
          },
        ],
      });

      if( !App.isObject(mSupportTicket) || !App.isPosNumber(mSupportTicket.id) )
        return App.json( res, 404, App.t(['SupportTicket','id','not-found'], req.lang) );

      App.json( res, true, App.t(['success'], res.lang), mSupportTicket );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


